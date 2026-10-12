# Sigilla — Phase 7 : Landing, démo & docs

> **Fichier de délégation 7/8.** Spec complète, checklist et code de référence. Aucun aller-retour attendu. Si un point n'est pas couvert : option la plus simple compatible avec le PRD, notée dans `DECISIONS.md`.

---

## 0. À lire avant de commencer

- Règles non négociables : **§0 du fichier Phase 1**.
- PRD : §7 F10, §13 (branding), §15 (Maison Démo).
- Audit design : **§4 (copy) en entier**, C9 (halo du hero), §6 (brand assets).
- Écrans Stitch : `sigilla_landing_page_dark_light`, `sigilla_pricing_screen_14`, `sigilla_docs_screen_15`, `sigilla_brand_assets_visual_identity_sheet`.
- Repo de référence : `../excerpta-chatbot-document/` (`app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `.github/readme/banner-*.svg`, `app/privacy`, `app/terms`).

**Prérequis :** Phases 1 à 6 terminées.

---

## 1. Spec de la phase

**Objectif :** la vitrine recruteur. Une landing premium avec **un vrai widget Sigilla qui répond** (entraîné sur la doc de Sigilla), une démo explorable **en un clic sans inscription** (« Maison Démo », 90 jours de données réalistes), le pricing, la documentation, les pages légales, le SEO complet et les bannières README.

---

## 2. Checklist

- [ ] Landing premium (hero, How it works, features, citation, CTA final)
- [ ] Widget Sigilla réel sur la landing (agent entraîné sur la doc Sigilla)
- [ ] Seed « Maison Démo » (2 agents, sources, conversations dont 1 handoff, analytics sur 90 jours)
- [ ] Accès démo en 1 clic, lecture seule, protégé contre l'abus
- [ ] Pricing (+ bannière carte test Stripe) + FAQ
- [ ] Docs : démarrage, embed, personnalisation, handoff, référence API
- [ ] Pages privacy et terms (requises pour Notion OAuth)
- [ ] Copy final EN + FR corrigé selon l'audit (aucune promesse hors scope)
- [ ] SEO : metadata, Open Graph dynamique, `sitemap.ts`, `robots.ts`, JSON-LD
- [ ] Bannières README dark / light

---

## 3. Implémentation

### 3.1 Structure

```
app/(marketing)/layout.tsx        # nav + footer marketing
app/(marketing)/page.tsx          # landing (remplace la redirection temporaire de la P1)
app/(marketing)/pricing/page.tsx
app/(marketing)/docs/[[...slug]]/page.tsx
app/(marketing)/privacy/page.tsx
app/(marketing)/terms/page.tsx
app/demo/route.ts                 # connexion démo en 1 clic
app/atelier-lune/[[...slug]]/page.tsx  # site client fictif (remplace la page simple de la P4)
app/ledgerline/[[...slug]]/page.tsx    # 2e site client fictif (centre d'aide)
content/docs/*.md                 # documentation Sigilla (sert aussi à entraîner l'agent de la landing)
content/demo/atelier-lune/*.md    # contenu du site Atelier Lune
content/demo/ledgerline/*.md      # contenu du centre d'aide Ledgerline
prisma/seed.ts
```

Rendu markdown : `react-markdown` + `remark-gfm` (comme Excerpta), composants mappés sur la typo Sigilla (h1/h2 `font-serif`, code `font-mono` dans `bg-surface-raised`, liens `text-link`), **sans HTML brut** (`skipHtml`).

### 3.2 Nav & footer marketing

- **Nav sticky** (fond `bg-bg/80` + `backdrop-blur-sm` léger — pas de blur lourd) : Wordmark à gauche ; liens Product (#how), Pricing, Docs ; à droite « Sign in » (texte) + bouton primaire « Start free » ; toggle de thème compact (icône Sun/Moon). **Pas d'avatar** (page déconnectée).
- **Footer** : wordmark + « Every answer, sealed by its source. », colonnes Product (Pricing, Docs, Live demo), Legal (Privacy, Terms), Built by (lien portfolio de l'auteur — `NEXT_PUBLIC_AUTHOR_URL`, optionnel), sélecteur de langue EN/FR, « © 2026 Sigilla — A portfolio project. »

### 3.3 Landing — contenu final (EN ; traduire en FR dans `fr.json`)

Référence visuelle : `sigilla_landing_page_dark_light`. **Copy corrigé selon l'audit** — utiliser exactement :

1. **Hero**
   - Pastille `label-caps` : « AI SUPPORT, WITH SOURCES »
   - H1 (`font-serif`, 72px desktop / 44px mobile) : « Support, answered » / *« with distinction. »* (2e ligne en italique `text-link`)
   - Sous-titre : « No-code AI support agents, trained on your docs and embedded anywhere in one line. »
   - CTA : primaire « Start free » (`/sign-up`), ghost « Explore the live demo » (`/demo`)
   - Visuel : maquette navigateur `atelierlune.com` (HTML/CSS, **pas d'image**) avec le widget ouvert : question « Do your candles ship to Switzerland? », réponse avec 2 sceaux, ligne « Sealed by 2 sources — Shipping Policy · FAQ ».
   - Halo : **un seul** `radial-gradient` statique bordeaux 18 % derrière le visuel, **sans `filter: blur`** (audit C9).
2. **Bande « Built for houses like »** + mention `text-small text-text-muted` « Illustrative brands » : Atelier Lune, Ledgerline, Maison Verdant, Aurelia Haute, Vendôme & Cie (wordmarks texte en `font-serif` muted).
3. **How it works** (`id="how"`) — 3 colonnes, grands numéros serif italiques :
   - 01 **Connect your sources** — « Upload PDFs, crawl your website or connect Notion. Sigilla reads, splits and indexes everything. »
   - 02 **Shape your agent** — « Give it a name, a tone and boundaries. Choose your colors and welcome message. »
   - 03 **Embed in one line** — « Paste one script tag. Under 5 KB, isolated from your styles. » + snippet `font-mono`.
4. **Built for teams who care** — 4 cartes :
   - **Cited answers** — « Every sentence points to the page or URL it came from. »
   - **Human handoff** — « When the answer isn't in your docs, your agent says so and brings in your team. »
   - **Conversation analytics** — « See what customers ask, what's answered, and what's missing from your docs. »
   - **Under 5 KB** — « A dependency-free widget that won't slow your site down. »
5. **Citation éditoriale** centrée : « “Every answer, sealed by its source.” » — signature `label-caps` « THE SIGILLA PROMISE ».
6. **Section « Try it »** : texte « Ask the concierge in the corner anything about Sigilla. » + flèche vers le launcher.
7. **CTA final** (carte `bg-surface` bordure hairline) : H2 « Your first agent is a few minutes away. » + « Start free » + « Explore the live demo ».

**Widget réel** : en bas de chaque page marketing, `<Script src="/widget/v1.js" data-bot={process.env.NEXT_PUBLIC_LANDING_BOT_KEY} strategy="lazyOnload" />` (agent « Sigilla Concierge » du seed, entraîné sur `content/docs`).

Animations : apparition au scroll (fade + translateY 8px, 400 ms `--ease-lux`) via `IntersectionObserver` (petit hook `useReveal`, comme Excerpta), désactivées si reduced motion.

### 3.4 Pricing — `pricing/page.tsx`

Référence `sigilla_pricing_screen_14` **corrigée** (audit §4.1) :
- H1 « Simple plans. Exceptional answers. », sous-titre « Ground every answer in your documentation. »
- Bannière discrète `font-mono` : « Demo mode — payments use Stripe test mode. Card: 4242 4242 4242 4242 »
- 3 cartes (données `usePlanDetails()` + `PLAN_PRICES`) : Free $0 « Start free » ; **Pro $12/month** encadré `border-accent` + label « Most chosen » + bouton primaire « Upgrade to Pro » ; Team $39/month « Choose Team ». Boutons → `/sign-up?plan=pro|team` si déconnecté, sinon checkout.
- **Supprimer** : « Begin 14-day trial », « Webhooks », « SLA », « Priority concierge support », « Custom citation seal branding », bloc « private VPC / on-premise », « 98.4 % confidence », « Zero hallucination SLA ».
- Bloc « How answers stay honest » : « Below a similarity threshold you control, your agent declines to answer and offers a human instead. »
- **FAQ** (accordéon Radix, 5 questions, réponses courtes et exactes) : How do citations work? · What happens when the answer isn't in my docs? · Which sources can I connect? (PDF, websites up to 100 pages, Notion on Pro) · Can I remove the “Sealed by Sigilla” badge? (Pro and Team) · Is this a real product? (« Sigilla is a portfolio project. Payments run in Stripe test mode; no real charges. »)

### 3.5 Docs — `content/docs/*.md` + `docs/[[...slug]]`

Référence `sigilla_docs_screen_15` : nav gauche, article central, « On this page » à droite (ancres générées depuis les `##`), bloc de code avec bouton copier, callouts `bg-surface-raised`.

Pages à écrire (EN uniquement pour le contenu de doc — l'UI autour est traduite) — **contenu exact et vérifiable, aucune fonctionnalité inventée** :

| Fichier | Contenu |
|---|---|
| `getting-started.md` | Créer un compte, le wizard en 3 étapes, publier |
| `sources.md` | PDF (≤ 10 MB), sites (sitemap, robots.txt, même domaine, limite par plan), Notion (Pro/Team), re-sync manuelle, suppression |
| `embed.md` | Snippet, domaines autorisés, cache 60 s, CSP du site hôte (`script-src` + `connect-src` vers l'URL de l'app) |
| `customize.md` | Couleur (contraste auto), thème, position, style d'en-tête, avatar, messages, suggestions, badge |
| `answers.md` | Retrieval top 6, seuil de similarité, citations, langue, fallback |
| `handoff.md` | Déclenchement (bouton visiteur, 2 fallbacks), email, reprise, résolution |
| `analytics.md` | Définition exacte des 4 KPIs (cf. P5 §3.8) |
| `api.md` | Authentification Bearer, limites (60 req/min), `GET /api/v1/bots`, `POST /api/v1/chat` (stream/non-stream, protocole SSE `meta/token/done/error`), `GET /api/v1/conversations[/id]`, format d'erreur, exemples `curl` et `fetch` |
| `plans.md` | Tableau des limites (PRD §6), quotas mensuels, rétrogradation |

### 3.6 Sites clients fictifs (démo + sources des agents de démo)

`content/demo/atelier-lune/` — boutique de bougies et parfums d'intérieur (Paris). Écrire 6 pages markdown cohérentes et réalistes (300–600 mots chacune) :
- `shipping.md` « Shipping Policy » : France 1–2 jours ; UE 2–4 jours ; **Suisse 3–5 jours ouvrés, droits et TVA calculés au checkout** ; Royaume-Uni 3–5 jours ; USA 5–8 jours ; livraison offerte dès 120 €.
- `returns.md` « Returns & Exchanges » : 30 jours, bougies non allumées, remboursement sous 7 jours, articles gravés non repris.
- `care-guide.md` « Candle Care Guide » : 1re combustion 2–3 h, mèche à 5 mm, max 4 h d'affilée, cire de colza et d'abeille.
- `collections.md` « Our Collections » : Cuir & Encens Noir (145 CHF / 135 €), Figuier Sauvage, Ambre Doré, Neige de Cèdre ; tailles et durées de combustion.
- `bespoke.md` « Bespoke & Gifting » : coffrets dès 20 unités, sceau de cire, délai 3 semaines ; la gravure du verre n'est pas proposée. **Ne mentionner nulle part les moyens de paiement** (sert à démontrer le fallback).
- `faq.md` « FAQ » : 10 questions courtes.

`content/demo/ledgerline/` — SaaS de comptabilité (centre d'aide), 6 pages : `getting-started.md`, `invoices.md`, `bank-sync.md`, `vat.md`, `plans-billing.md`, `security.md`.

Rendu : `/atelier-lune` (accueil boutique + fiche produit « Bougie Cuir & Encens Noir ») et `/atelier-lune/<slug>` (pages ci-dessus) ; `/ledgerline` et `/ledgerline/<slug>` (style centre d'aide sobre, clair). Chaque site charge le widget de **son** agent de démo (`publicKey` lus en base au rendu via `prisma.chatbot.findFirst({ where: { name: … , organization: { isDemo: true } } })`, mis en cache 1 h). Bandeau fin en haut : « Illustrative brand — part of the Sigilla demo. » + lien « Back to Sigilla ». `export const metadata = { robots: { index: false } }`.

### 3.7 Seed — `prisma/seed.ts`

Idempotent : supprime puis recrée tout ce qui est marqué démo. Lancé **une fois** en local contre la base de prod après déploiement (`DATABASE_URL` de prod dans `.env.local` temporairement) — documenté dans le README.

Étapes :
1. **Utilisateur démo** : `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` via `auth.api.signUpEmail` (si absent), nom « Camille Laurent ».
2. **Organisation « Maison Démo »** (`slug = DEMO_ORG_SLUG`, `isDemo: true`, `plan: "pro"`) avec l'utilisateur démo owner, + 2 membres fictifs (« Hugo Martin » admin, « Inès Belkacem » member) créés comme utilisateurs sans mot de passe utilisable.
3. **Organisation « Sigilla HQ »** (`isDemo: true`, `plan: "team"`, sans membre humain) avec l'agent **« Sigilla Concierge »** (couleur `#9E2F45`, welcome « Good evening. Ask me anything about Sigilla. », suggestions « How do citations work? », « What does the widget weigh? », « Can a human take over? », `allowedDomains: []`, `status: "live"`).
4. **Agents de Maison Démo** :
   - « Atelier Lune — Concierge » (couleur `#9E2F45`, thème clair sur le site, welcome « Good evening. How may I help you today? », suggestions « Shipping times », « Return policy », « Scent recommendations », instructions de ton luxe), `status: "live"`.
   - « Ledgerline — Help Center » (couleur `#1F3A5F`, thème clair, welcome « Hi. How can I help with Ledgerline? »), `status: "live"`.
5. **Sources** : pour chaque fichier markdown, créer une `DataSource` de type `url` (`url = <APP_URL>/<site>/<slug>`, `name` = titre de la page, `status: "ready"`), puis **ingérer directement** le contenu markdown avec `chunkSections` + `storeChunks` (vrais embeddings Gemini, `sourceUrl` = URL de la page du site fictif — les citations du widget pointent donc vers de vraies pages). Même chose pour « Sigilla Concierge » avec `content/docs/*.md` (`sourceUrl` = `<APP_URL>/docs/<slug>`).
6. **Historique de 90 jours** (Maison Démo uniquement), généré avec un PRNG déterministe (`mulberry32(42)`) :
   - ~1 200 conversations Atelier Lune, ~500 Ledgerline, réparties avec une tendance légèrement croissante et un creux le week-end.
   - Questions tirées d'un catalogue de 40 questions réalistes par marque (dont 15 % hors périmètre → messages bot `fallback: true` + événement `fallback`).
   - Réponses bot pré-écrites cohérentes avec le contenu, `citations` référençant de **vrais** `chunkId` des sources seedées, `topScore` 0.76–0.93, `provider` « groq » (97 %) / « gemini ».
   - Feedback sur ~25 % des réponses (94 % positifs).
   - ~8 % de conversations avec handoff ; **une conversation récente (il y a 4 minutes) en `handoff_requested`** : « Can I have our initials engraved on the glass jar for 150 candles? », email `e.marchand@example.ch`, pays CH ; une autre en `human` avec réponse de « Camille ».
   - Événements `widget_open` (~1,8 par conversation), `message`, `feedback`, `handoff`, `fallback` cohérents avec les messages.
   - `messageCount` du mois courant cohérent avec le plan Pro (< 2 000).
7. Afficher en fin de script les `publicKey` des 3 agents → à copier dans `NEXT_PUBLIC_LANDING_BOT_KEY` (Sigilla Concierge) sur Vercel.

Utilise `createMany` par lots de 500 pour la vitesse. Durée cible < 3 min (le coût principal est l'embedding des ~20 pages).

### 3.8 Accès démo en 1 clic — `app/demo/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/public/cors";

export async function GET(request: NextRequest) {
  const rl = await rateLimit(`demo:${clientIp(request)}`, 10, 60 * 60_000);
  if (!rl.ok) return NextResponse.redirect(new URL("/?demo=busy", request.url));
  const res = await auth.api.signInEmail({
    body: { email: process.env.DEMO_USER_EMAIL!, password: process.env.DEMO_USER_PASSWORD! },
    asResponse: true,
  });
  const redirect = NextResponse.redirect(new URL("/agents", request.url));
  res.headers.getSetCookie().forEach((c) => redirect.headers.append("set-cookie", c));
  return redirect;
}
```

Garde-fous démo (en plus du `isDemo` bloquant les écritures via `requireOrgApi({ write: true })` en P1) :
- Bandeau permanent dans l'AppShell quand l'org active est `isDemo` : « You're exploring a live demo. Changes are disabled. » + bouton « Start free ».
- Autorisé en démo : navigation, playground (10 req/min par utilisateur), lecture des conversations et analytics, aperçu du widget designer **sans** « Publish ».
- Interdit (403 + toast « The demo is read-only. ») : création/suppression, publication, reply/resolve, billing, clés API, invitations, Notion, suppression de compte, changement de mot de passe.
- Le mot de passe démo n'est jamais affiché ; changer de mot de passe/email est bloqué pour ce compte.

### 3.9 Pages légales — `privacy` et `terms`

Pages sobres (`font-serif` pour les titres), dernière mise à jour 2026, **adaptées à un projet portfolio** :
- **Privacy** : données traitées (compte, contenu des sources, conversations des visiteurs, email optionnel du visiteur), sous-traitants (Vercel — hébergement et stockage, Neon — base de données, Groq et Google Gemini — génération et embeddings, Stripe — paiements en mode test, Notion — si connecté), pas de revente, pas de cookies publicitaires, le widget stocke un identifiant visiteur en localStorage, suppression via Settings, contact (`NEXT_PUBLIC_CONTACT_EMAIL`).
- **Terms** : projet de démonstration, pas de SLA, service fourni « tel quel », paiements en mode test uniquement, usage acceptable (pas de contenu illicite dans les sources), limites des plans.
- Ces URLs sont requises par la configuration de l'intégration publique Notion.

### 3.10 SEO

- `metadata` par page (title, description, `alternates.canonical`).
- `app/opengraph-image.tsx` (1200×630, modèle Excerpta, police Instrument Serif embarquée depuis `public/fonts`) : fond `#0E0A0B`, wordmark en haut à gauche, grande ligne « “Every answer, sealed by its source.” », petite maquette de widget à droite avec 2 sceaux bordeaux, URL en bas à gauche en muted. Variante `twitter-image.tsx` identique.
- `app/sitemap.ts` : `/`, `/pricing`, `/docs/*`, `/privacy`, `/terms` (pas les sites fictifs, pas l'app).
- `app/robots.ts` : `allow: /`, `disallow: /agents, /conversations, /analytics, /settings, /api, /demo, /atelier-lune, /ledgerline`.
- JSON-LD `SoftwareApplication` sur la landing (`name`, `applicationCategory: "BusinessApplication"`, `offers` Free/Pro/Team en USD, `operatingSystem: "Web"`).

### 3.11 Bannières README

`.github/readme/banner-dark.svg` et `banner-light.svg` (1280×320, modèle Excerpta) : wordmark « Sigilla » en serif (police système `Georgia` en fallback dans le SVG + `<text>` avec `font-family="Instrument Serif, Georgia, serif"`), slogan « Every answer, sealed by its source. », fine règle bordeaux 1px. Couleurs : dark `#0E0A0B`/`#F3ECE6`/`#9E2F45`, light `#FAF6F2`/`#1A1214`/`#8A2438`. Utilisées en P8 dans le README via `<picture>` + `prefers-color-scheme`.

---

## 4. Critères d'acceptation

- [ ] La landing en prod : le widget du coin répond à « How do citations work? » avec des sceaux pointant vers `/docs/answers`.
- [ ] « Explore the live demo » → dashboard Maison Démo en < 3 s, sans formulaire ; analytics remplis sur 90 jours ; une conversation « Needs human » visible et un badge « 1 » dans la sidebar.
- [ ] Toute tentative d'écriture en démo → toast « The demo is read-only. » (vérifier au moins : créer agent, publier widget, répondre, upgrade).
- [ ] `/atelier-lune` : la question « Do your candles ship to Switzerland? » donne « 3–5 business days… duties at checkout » avec sceaux vers `/atelier-lune/shipping` ; « Do you accept Klarna? » (absent des sources) → fallback + carte handoff.
- [ ] Pricing et landing : aucune occurrence (mots entiers) de « trial », « SLA », « VPC », « webhook(s) », « 99.8 » dans les namespaces `Landing` et `Pricing` de `messages/*.json` ni dans `app/(marketing)/page.tsx` et `app/(marketing)/pricing/` (`grep -riwE "trial|SLA|VPC|webhooks?|99\.8"`). Les pages légales peuvent mentionner « no SLA ».
- [ ] Lighthouse (mobile, landing) : Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100 (le widget est chargé en `lazyOnload`).
- [ ] OG image visible sur un validateur (opengraph.xyz) ; `sitemap.xml` et `robots.txt` valides.
- [ ] Toutes les pages marketing existent en EN et FR (bascule via le footer).
- [ ] Lint, typecheck, build OK ; aucune Material Symbol.

## 5. Fin de phase
1. Coche les 10 tâches « Phase 8 (P7) » dans `PROGRESS.md` ; recalcule le tableau.
2. `DECISIONS.md` : écarts éventuels.
3. Commit `chore: complete phase 7 (landing, demo, docs)`.
