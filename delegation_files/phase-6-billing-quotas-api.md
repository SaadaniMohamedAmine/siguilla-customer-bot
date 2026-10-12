# Sigilla — Phase 6 : Billing, quotas & API

> **Fichier de délégation 6/8.** Spec complète, checklist et code de référence. Aucun aller-retour attendu. Si un point n'est pas couvert : option la plus simple compatible avec le PRD, notée dans `DECISIONS.md`.

---

## 0. À lire avant de commencer

- Règles non négociables : **§0 du fichier Phase 1**.
- PRD : §6 (plans & limites), §7 F8 (API), F9 (billing & rate limiting).
- Audit design : §4.1 (**aucune promesse hors scope** sur billing/pricing : pas d'essai gratuit, pas de webhooks sortants, pas de SLA).
- Repo de référence (**implémentation de paiement à reprendre exactement**) : `../excerpta-chatbot-document/lib/stripe/client.ts`, `app/api/billing/checkout/route.ts`, `app/api/billing/portal/route.ts`, `app/api/webhooks/stripe/route.ts`, `lib/billing/usage.ts`.
- Écrans Stitch : `sigilla_settings_billing_screen_17`, `sigilla_settings_api_keys_screen_18`, `sigilla_settings_organization_members_screen_16`, `sigilla_settings_integrations_screen_19`.

**Prérequis :** Phases 1 à 5 terminées.

---

## 1. Spec de la phase

**Objectif :** monétisation en mode test (Stripe, identique à Excerpta), quotas mensuels sans cron, application des limites de plan partout, API publique v1 authentifiée par clé, et toutes les pages Settings.

**Différence clé avec Excerpta :** le plan et l'usage sont portés par **`Organization`** (multi-tenant), pas par `User`. Le code Stripe est identique, seules les requêtes Prisma changent de modèle. Seuls les rôles `owner` et `admin` gèrent la facturation.

---

## 2. Checklist

- [ ] Client Stripe lazy (repris d'Excerpta)
- [ ] `billing/checkout` (par organisation)
- [ ] `billing/portal`
- [ ] `webhooks/stripe` (completed, updated, deleted) + idempotence
- [ ] Plans Free / Pro / Team (0 / 12 / 39 $) + limites du PRD
- [ ] Quotas avec reset mensuel sans cron
- [ ] Messages de dépassement (widget « resting » + bannière + carte d'upgrade)
- [ ] `rateLimit()` persistant Neon (upsert atomique + purge des entrées expirées)
- [ ] Plugin Better Auth `apiKey` (création, affichage unique, révocation, préfixe)
- [ ] API v1 (`/chat`, `/bots`, `/conversations`) + validation Zod + erreurs normalisées
- [ ] Settings : profil, organisation et membres, billing, API keys, intégrations Notion
- [ ] Suppression de compte et d'organisation (cascade propre)

---

## 3. Implémentation

### 3.1 Stripe (mode test) — configuration humaine
Dans le dashboard Stripe **en mode test** :
1. Produit « Sigilla Pro » — prix récurrent mensuel **12 USD** → `STRIPE_PRICE_ID_PRO`.
2. Produit « Sigilla Team » — prix récurrent mensuel **39 USD** → `STRIPE_PRICE_ID_TEAM`.
3. Customer portal activé (annulation + changement de plan entre Pro et Team).
4. Webhook vers `<APP_URL>/api/webhooks/stripe` : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`.
5. En local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

`npm install stripe`

### 3.2 Plans — `lib/billing/plans.ts` (complète la version minimale de la P2)

Modèle Excerpta : fichier importable côté client **sans** price IDs ; textes traduits via un hook.

```ts
import { useTranslations } from "next-intl";

export type PlanId = "free" | "pro" | "team";
export const PLAN_ORDER: PlanId[] = ["free", "pro", "team"];
export const PLAN_PRICES: Record<PlanId, number> = { free: 0, pro: 12, team: 39 };

export const PLAN_LIMITS = {
  free: { agents: 1, sourcesPerAgent: 5, pagesPerSite: 25, messagesPerMonth: 200, notion: false, api: false, removeBadge: false, members: 1 },
  pro: { agents: 5, sourcesPerAgent: 25, pagesPerSite: 100, messagesPerMonth: 2000, notion: true, api: true, removeBadge: true, members: 3 },
  team: { agents: 15, sourcesPerAgent: 50, pagesPerSite: 100, messagesPerMonth: 10000, notion: true, api: true, removeBadge: true, members: 10 },
} as const;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(PLAN_ORDER as string[]).includes(plan) ? (plan as PlanId) : "free"];
}

/** Libellés et listes de fonctionnalités traduits (messages/{locale}.json → Billing.plans). */
export function usePlanDetails() {
  const t = useTranslations("Billing.plans");
  return Object.fromEntries(PLAN_ORDER.map((id) => [id, {
    name: t(`${id}.name`), tagline: t(`${id}.tagline`), features: t.raw(`${id}.features`) as string[],
  }])) as Record<PlanId, { name: string; tagline: string; features: string[] }>;
}
```

`messages/en.json` → `Billing.plans` (FR à traduire à l'identique, **aucune promesse hors scope**) :

```json
{
  "free": { "name": "Free", "tagline": "For trying Sigilla on a single site.",
    "features": ["1 agent", "5 sources per agent", "25 pages crawled per website", "200 messages per month", "Human handoff", "“Sealed by Sigilla” badge", "1 team member"] },
  "pro": { "name": "Pro", "tagline": "For growing boutiques and SaaS teams.",
    "features": ["5 agents", "25 sources per agent", "100 pages crawled per website", "2,000 messages per month", "Notion connector", "API access", "Removable badge", "3 team members"] },
  "team": { "name": "Team", "tagline": "For houses with several brands or sites.",
    "features": ["15 agents", "50 sources per agent", "100 pages crawled per website", "10,000 messages per month", "Notion connector", "API access", "Removable badge", "10 team members"] }
}
```

### 3.3 Client Stripe — `lib/stripe/client.ts`
**Copie à l'identique** depuis Excerpta (singleton lazy, pas d'`apiVersion` épinglée).

### 3.4 Routes billing

`app/api/billing/checkout/route.ts` (adaptation Excerpta → Organization) :

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";

const PRICE_IDS: Record<"pro" | "team", string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  team: process.env.STRIPE_PRICE_ID_TEAM,
};

export async function POST(request: NextRequest) {
  try {
    const { org, user, role } = await requireOrgApi({ write: true });
    if (role === "member") throw new HttpError(403, "Only owners and admins can manage billing.");
    const body = await request.json().catch(() => null);
    const plan = body?.plan as "pro" | "team" | undefined;
    if (!plan || !PRICE_IDS[plan]) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

    const stripe = getStripe();
    // Déjà abonné : on envoie vers le portail plutôt que de créer un 2e abonnement.
    if (org.stripeSubscriptionId && org.stripeSubscriptionStatus === "active") {
      const portal = await stripe.billingPortal.sessions.create({ customer: org.stripeCustomerId!, return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing` });
      return NextResponse.json({ url: portal.url });
    }

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: org.name, metadata: { organizationId: org.id } });
      customerId = customer.id;
      await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRICE_IDS[plan]!, quantity: 1 }],
      allow_promotion_codes: false,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&billing=canceled`,
      metadata: { organizationId: org.id, plan },
      subscription_data: { metadata: { organizationId: org.id } },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

`app/api/billing/portal/route.ts` : identique à Excerpta mais sur `org.stripeCustomerId`, rôle owner/admin, `return_url` `/settings?tab=billing`.

`app/api/webhooks/stripe/route.ts` : **structure Excerpta à l'identique** (`runtime = "nodejs"`, `request.text()` pour la signature, `planFromPriceId`, ack 200 même en cas d'erreur interne), avec deux changements :

1. Toutes les mises à jour ciblent `prisma.organization` :
   - `checkout.session.completed` → `organizationId` depuis `metadata` → `plan`, `stripeSubscriptionId`, `stripeSubscriptionStatus`.
   - `customer.subscription.updated` → org trouvée par `stripeCustomerId` → `plan` (si price connu), `stripeSubscriptionStatus`. Si `status` ∈ `canceled | unpaid | incomplete_expired` → `plan: "free"`.
   - `customer.subscription.deleted` → `plan: "free"`, `stripeSubscriptionId: null`, `stripeSubscriptionStatus: "canceled"`.
2. **Idempotence** — nouveau modèle et garde en tête de traitement :

```prisma
model StripeEvent {
  id        String   @id // event.id
  type      String
  createdAt DateTime @default(now())
}
```

```ts
try {
  await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
} catch {
  return NextResponse.json({ received: true, duplicate: true }); // déjà traité
}
```

**Rétrogradation** (Pro → Free) : rien n'est supprimé. Les agents/sources au-delà de la limite restent **en lecture seule** : création bloquée, et seuls les N premiers agents (par `createdAt`) répondent dans le widget ; les autres renvoient `quota_exceeded` côté widget (état « resting »). Bandeau dashboard : « Your plan changed. {n} agents are paused until you upgrade or remove some. »

### 3.5 Quotas — `lib/billing/usage.ts`

Même philosophie qu'Excerpta : **reset mensuel paresseux (mois calendaire UTC), aucun cron**. Remplace les stubs de la P3 :

```ts
import { prisma } from "@/lib/db";
import { getPlanLimits } from "./plans";

const isNewMonth = (start: Date, now: Date) =>
  now.getUTCFullYear() !== start.getUTCFullYear() || now.getUTCMonth() !== start.getUTCMonth();

export class QuotaExceededError extends Error { constructor() { super("quota_exceeded"); } }

export async function getUsage(orgId: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const now = new Date();
  let used = org.messageCount;
  if (isNewMonth(org.usagePeriodStart, now)) {
    await prisma.organization.update({ where: { id: orgId }, data: { messageCount: 0, usagePeriodStart: now } });
    used = 0;
  }
  const limits = getPlanLimits(org.plan);
  const [agents, sources, members] = await Promise.all([
    prisma.chatbot.count({ where: { organizationId: orgId } }),
    prisma.dataSource.count({ where: { chatbot: { organizationId: orgId } } }),
    prisma.member.count({ where: { organizationId: orgId } }),
  ]);
  return {
    plan: org.plan, limits,
    messages: { used, limit: limits.messagesPerMonth },
    agents: { used: agents, limit: limits.agents },
    sources: { used: sources, limit: limits.sourcesPerAgent * limits.agents },
    members: { used: members, limit: limits.members },
    periodStart: isNewMonth(org.usagePeriodStart, now) ? now : org.usagePeriodStart,
  };
}

export async function assertWithinQuota(orgId: string) {
  const { messages } = await getUsage(orgId);
  if (messages.used >= messages.limit) throw new QuotaExceededError();
}

/** Incrément atomique (pas de lecture-écriture concurrente). */
export async function incrementMessageUsage(orgId: string) {
  await prisma.organization.update({ where: { id: orgId }, data: { messageCount: { increment: 1 } } });
}
```

**Points d'application des limites** (à vérifier/ajouter partout) :

| Action | Limite | Réponse |
|---|---|---|
| Créer un agent | `agents` | 403 `agents_limit` |
| Ajouter une source | `sourcesPerAgent` (déjà P2) | 403 `sources_limit` |
| Crawl | `pagesPerSite` (déjà P2) | arrêt propre du crawl |
| Notion | `notion` | 403 `notion_requires_pro` |
| Inviter un membre | `members` (membres + invitations en attente) | 403 `members_limit` |
| Créer une clé API / appeler `/api/v1` | `api` | 403 `api_requires_pro` |
| Masquer le badge | `removeBadge` | champ ignoré + badge forcé (endpoint config P4) |
| Message widget/API | `messagesPerMonth` | SSE `quota_exceeded` → état « resting » |

**UI de dépassement :**
- Widget : état « This assistant is resting for now. » (P4).
- Dashboard : bandeau global (dans l'AppShell) quand usage ≥ 90 % : `warning` « You've used 90% of this month's messages. » ; à 100 % : `error` « Your agents are resting until {date du 1er du mois suivant}. » + bouton « Upgrade ».
- Carte d'upgrade réutilisable `UpgradeCard` (titre serif, 1 phrase, bouton « Upgrade to Pro ») affichée à la place des boutons bloqués.

### 3.6 Rate limiting
`lib/rate-limit.ts` (persistant Neon) a été livré en P4 : **vérifie** qu'il est utilisé sur : endpoints publics (P4), `/api/v1/*` (60 req/min par clé API), playground (20 req/min par utilisateur), routes d'auth sensibles côté app (`/forgot-password` : 5/heure par IP via une Server Action ou route wrapper). Tests en P8.

### 3.7 API keys (plugin Better Auth `apiKey`)

UI `settings?tab=api-keys` (écran 18) — réservé owner/admin, plan Pro/Team (sinon `UpgradeCard`) :
- Table : nom, préfixe `font-mono` (« sk_live_7Hq2… »), créée le, dernière utilisation, bouton texte `text-error` « Revoke » (Dialog de confirmation).
- « Create key » → Dialog : nom → création → **affichage unique** de la clé complète en `font-mono` + bouton copier + avertissement « Copy it now — you won't see it again. »

Serveur — `app/api/keys/route.ts` :

```ts
// POST : création
const key = await auth.api.createApiKey({
  body: { name, prefix: "sk_live_", organizationId: org.id, userId: user.id },
});
// Si `organizationId` n'est pas supporté par la version installée : utiliser metadata: { organizationId: org.id } (cf. DECISIONS.md de la P1).
return Response.json({ id: key.id, key: key.key, start: key.start });

// GET : liste (sans la clé)
const { apiKeys } = await auth.api.listApiKeys({ query: { organizationId: org.id }, headers: await headers() });

// DELETE ?id= : révocation
await auth.api.deleteApiKey({ body: { keyId: id }, headers: await headers() });
```

`lib/api-auth.ts` — authentification de l'API publique :

```ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing/plans";
import { rateLimit } from "@/lib/rate-limit";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function authenticateApiKey(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!key) throw new ApiError(401, "missing_api_key", "Provide an API key in the Authorization header.");
  const result = await auth.api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) throw new ApiError(401, "invalid_api_key", "This API key is invalid or revoked.");
  const orgId = (result.key as { organizationId?: string; metadata?: { organizationId?: string } }).organizationId
    ?? (result.key as { metadata?: { organizationId?: string } }).metadata?.organizationId;
  if (!orgId) throw new ApiError(401, "invalid_api_key", "This API key is not linked to an organization.");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  if (!getPlanLimits(org.plan).api) throw new ApiError(403, "api_requires_pro", "API access requires the Pro or Team plan.");
  const rl = await rateLimit(`api:${result.key.id}`, 60, 60_000);
  if (!rl.ok) throw new ApiError(429, "rate_limited", `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);
  return { org, keyId: result.key.id };
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  console.error("[api/v1]", error);
  return Response.json({ error: { code: "internal", message: "Internal error." } }, { status: 500 });
}
```

### 3.8 API v1 — `app/api/v1/…`

Format d'erreur unique : `{ "error": { "code": string, "message": string } }`. Toutes les entrées validées par Zod (400 `invalid_request` avec le détail du premier champ).

| Endpoint | Description |
|---|---|
| `GET /api/v1/bots` | `{ data: [{ id, name, status, publicKey, createdAt }] }` de l'org |
| `POST /api/v1/chat` | Body `{ botId, question, conversationId?, visitorId?, stream? = true, locale? }`. Vérifie que le bot appartient à l'org. Quota → `assertWithinQuota`. `stream: true` → SSE (même protocole que le widget) ; `stream: false` → consomme les événements et répond `{ data: { conversationId, answer, citations, fallback } }`. `visitorId` par défaut `api:<keyId>`. Incrémente l'usage. |
| `GET /api/v1/conversations?botId=&limit=&cursor=` | `{ data: [{ id, status, createdAt, lastMessageAt, messageCount }], nextCursor }` (exclut le playground) |
| `GET /api/v1/conversations/[id]` | `{ data: { id, status, messages: [{ role, content, citations, createdAt }] } }` |

`maxDuration = 60` sur `/chat`. Aucune donnée d'une autre organisation n'est jamais renvoyée (filtre `organizationId` systématique).

### 3.9 Settings — `app/(app)/settings/page.tsx`

Onglets via `?tab=` (sous-navigation verticale à gauche, écran 16) : **Profile · Organization · Billing · API keys · Integrations**.

- **Profile** : nom (modifiable), email (lecture seule), fournisseurs connectés (badges Google/GitHub/Email), changement de mot de passe (si compte email : `authClient.changePassword`), préférences Thème + Langue, **zone danger** « Delete account ».
- **Organization** (écran 16) : nom de l'organisation (owner/admin), table des membres (Avatar, nom, email, rôle Owner/Admin/Member via Select — owner seul peut changer les rôles, actions Remove), invitations en attente (révoquer), bouton « Invite member » → carte inline : email + rôle → `authClient.organization.inviteMember` → **lien copiable** `<APP_URL>/invite/<invitationId>` en `font-mono` (pas d'email envoyé — dire « Share this link with your teammate. »). Limite `members`. Zone danger owner : « Delete organization » (saisir le nom pour confirmer).
- **Billing** (écran 17) : carte plan courant (« Pro — $12/month, renews on {date} » via `stripe.subscriptions.retrieve` côté serveur si abonné, sinon « Free »), bouton « Manage billing » (portal), jauges fines 4px `bg-accent` : Messages x / y, Agents x / y, Sources x / y, Members x / y ; trois cartes de plans pour upgrade (prix en `font-serif text-kpi`) ; bannière discrète « Demo mode — use test card 4242 4242 4242 4242 » ; toasts selon `?billing=success|canceled`.
- **API keys** : §3.7.
- **Integrations** (écran 19) : carte Notion — non connecté : « Connect workspace » (Pro+) ; connecté : icône + nom du workspace, nombre de pages synchronisées (sum des sources Notion), « Manage pages » (→ drawer de sélection P2), « Disconnect » (Dialog). Carte muted « More integrations coming soon » **sans liste de promesses**.

### 3.10 Suppressions

`lib/account.ts` :
- **Supprimer une organisation** (owner) : si abonnement actif → `stripe.subscriptions.cancel(id)` ; supprimer les blobs des sources PDF (`del` par lots) ; `prisma.organization.delete` (cascade : chatbots → sources → chunks, conversations → messages, events, NotionConnection, members, invitations, apikeys) ; basculer la session sur une autre organisation de l'utilisateur (`setActiveOrganization`) ou en créer une personnelle s'il n'en a plus.
- **Supprimer le compte** : pour chaque organisation dont l'utilisateur est **seul owner** → suppression d'organisation ci-dessus ; sinon retrait du membership ; puis `auth.api.deleteUser` (ou `prisma.user.delete` si l'endpoint exige une vérification email non disponible — noter dans `DECISIONS.md`) ; déconnexion et redirection vers `/`.
- Le compte démo et l'organisation `isDemo` ne peuvent jamais être supprimés (403).

---

## 4. Critères d'acceptation

- [ ] Upgrade Free → Pro avec la carte `4242 4242 4242 4242` : retour sur Billing avec toast, plan « Pro » en ≤ 5 s (webhook), limites mises à jour (2e agent créable, Notion débloqué, badge masquable).
- [ ] Portal : passage Pro → Team puis annulation → plan revient à Free à la fin de l'événement `deleted`.
- [ ] Rejouer un même webhook (`stripe events resend`) → ignoré (idempotence).
- [ ] Un `member` ne peut ni ouvrir le checkout ni le portal (403).
- [ ] Quota : forcer `messageCount = limit` → le widget affiche « resting », l'API renvoie **HTTP 429** avec `{ "error": { "code": "quota_exceeded" } }`, bandeau rouge dans le dashboard ; changer `usagePeriodStart` au mois précédent → le compteur repart à 0 à la requête suivante.
- [ ] Clé API : créée, affichée une seule fois, utilisable (`curl -H "Authorization: Bearer sk_live_…" <APP_URL>/api/v1/bots`), révoquée → 401.
- [ ] `/api/v1/chat` en `stream: false` renvoie réponse + citations ; en `stream: true` renvoie le SSE.
- [ ] 61 appels/min avec la même clé → 429.
- [ ] Invitation par lien acceptée par un 2e compte ; limite de membres respectée.
- [ ] Suppression d'organisation : plus aucune ligne liée en base, blobs supprimés, abonnement test annulé.
- [ ] Aucune mention (mots entiers) de « trial », « webhook(s) », « SLA », « VPC » dans les namespaces `Billing` et `Settings` de `messages/*.json` (`grep -riwE "trial|SLA|VPC|webhooks?"`).
- [ ] Lint, typecheck, build OK ; textes EN/FR ; aucune Material Symbol.

## 5. Fin de phase
1. Coche les 12 tâches « Phase 7 (P6) » dans `PROGRESS.md` ; recalcule le tableau.
2. `DECISIONS.md` : éventuels écarts du plugin apiKey.
3. Commit `chore: complete phase 6 (billing, quotas, API)`.
