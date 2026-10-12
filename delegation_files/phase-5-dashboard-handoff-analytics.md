# Sigilla — Phase 5 : Dashboard, conversations, handoff & analytics

> **Fichier de délégation 5/8.** Spec complète, checklist et code de référence. Aucun aller-retour attendu. Si un point n'est pas couvert : option la plus simple compatible avec le PRD, notée dans `DECISIONS.md`.

---

## 0. À lire avant de commencer

- Règles non négociables : **§0 du fichier Phase 1**.
- PRD : §7 F1 (wizard), F2, F6 (conversations & handoff), F7 (analytics), §8 (écrans).
- Audit design : §4 (copy), §5 C1–C6 (corrections des écrans conversation/analytics).
- Écrans Stitch : `sigilla_agents_list_empty_state_screen_10`, `sigilla_agent_wizard_identity_screen_8`, `sigilla_agent_wizard_sources_screen_9`, `sigilla_agent_overview_screen_11`, `sigilla_conversation_detail_handoff_dark_light`, `sigilla_analytics_knowledge_gaps_dark_light`.
- Code existant : app shell (P1), sources (P2), RAG + playground + réglages agent (P3), widget, `EmbedSnippet`, endpoints publics handoff/messages (P4).

**Prérequis :** Phases 1 à 4 terminées.

---

## 1. Spec de la phase

**Objectif :** tout le dashboard métier : liste des agents, wizard de création en 3 étapes, vue d'ensemble de l'agent avec onglets, boîte de réception des conversations avec reprise humaine en direct, et analytics. Règle transverse : **les conversations de playground (`visitorId` commençant par `playground:`) sont exclues de toutes les listes et statistiques.**

---

## 2. Checklist

- [ ] Liste des agents + état vide
- [ ] Wizard 3 étapes (identité → sources → widget & embed)
- [ ] Vue d'ensemble de l'agent (KPIs, santé de la base, carte embed)
- [ ] Conversations : liste filtrable (statut, date, feedback, fallback, besoin d'un humain)
- [ ] Conversation : détail, citations, scores, panneau de contexte
- [ ] Polling live (3 s) des vues conversations
- [ ] Human handoff : bouton visiteur + déclenchement auto après 2 fallbacks
- [ ] Handoff : capture email visiteur (optionnelle)
- [ ] Handoff : réponse agent humain + polling widget + « Resolve »
- [ ] Badge des handoffs en attente dans la sidebar
- [ ] Événements analytics (widget_open, message, feedback, handoff, fallback)
- [ ] KPIs (conversations, résolution sans humain, satisfaction, taux de fallback)
- [ ] Graphique conversations / jour + top questions
- [ ] Sources les plus citées + questions sans réponse (bouton « Add source »)
- [ ] Filtres 7 / 30 / 90 jours

---

## 3. Implémentation

### 3.1 Structure des routes

```
app/(app)/agents/page.tsx                    # liste + état vide
app/(app)/agents/new/page.tsx                # wizard (étapes via ?step=1|2|3&id=)
app/(app)/agents/[id]/layout.tsx             # en-tête agent + onglets
app/(app)/agents/[id]/page.tsx               # Overview
app/(app)/agents/[id]/sources/page.tsx       # (P2) → déplacé sous les onglets
app/(app)/agents/[id]/playground/page.tsx    # (P3)
app/(app)/agents/[id]/widget/page.tsx        # (P4)
app/(app)/agents/[id]/settings/page.tsx      # (P3)
app/(app)/conversations/page.tsx             # boîte de réception, toutes les conversations de l'org
app/(app)/conversations/[id]/page.tsx        # détail (même layout 3 colonnes, conversation sélectionnée)
app/(app)/analytics/page.tsx                 # analytics (sélecteur d'agent + période)
```

`agents/[id]/layout.tsx` : breadcrumb « Agents / {nom} », `StatusPill` Live (success) / Draft (neutral), onglets **Overview · Sources · Playground · Widget · Conversations · Analytics · Settings** (Tabs en liens ; « Conversations » et « Analytics » pointent vers `/conversations?agent=<id>` et `/analytics?agent=<id>`).

### 3.2 Liste des agents — `agents/page.tsx`

Référence écran 10 (audit : pas de point rose, avatars neutres).
- En-tête : `font-serif text-h1` « Agents » + bouton primaire « New agent » (désactivé + tooltip « Your plan allows {n} agent(s). Upgrade to add more. » si limite atteinte).
- Grille 2 colonnes (1 en mobile) de cartes : nom (`font-serif text-h3`), description (1 ligne), `StatusPill`, puis 4 métriques `font-mono` en ligne : sources, conversations (30 j), satisfaction (30 j, `—` si aucune note), dernière synchro ; menu kebab (Open, Playground, Copy embed code, Delete).
- Carte pointillée « Create a new agent » à la fin.
- **État vide** : `EmptyState` « Your first agent awaits. » + texte + CTA « Create an agent ».
- Données : un seul appel serveur (Server Component) qui agrège par agent (`prisma.chatbot.findMany` + `groupBy` sur `Conversation` et `Message.feedback`).

### 3.3 Wizard en 3 étapes — `agents/new`

Plein écran **sans sidebar** (layout dédié `app/(app)/agents/new/layout.tsx` qui n'inclut pas l'AppShell, seulement le wordmark en haut à gauche et « Cancel » à droite).

Indicateur d'étapes : 3 numéros `font-serif text-h2` (« 01 Identity · 02 Sources · 03 Widget & embed ») reliés par un trait hairline ; étape active en `text-text`, faites en `text-link` avec `CheckIcon`, à venir en `text-text-muted`.

1. **Identity** (écran 8) : nom (requis), description, instructions (même champ que P3). « Continue » → `POST /api/chatbots` puis `?step=2&id=<id>`.
2. **Sources** (écran 9) : réutilise le composant d'ajout de sources de la P2 en version **pleine page** (3 cartes PDF / Website / Notion côte à côte) + liste live des sources ajoutées avec statuts (« Shipping Policy.pdf — Ready · 42 chunks », « atelierlune.com — Crawling 37/100 pages »). « Continue » actif dès qu'**une** source existe (même en cours de traitement) ; lien « Skip for now ».
3. **Widget & embed** : version compacte du designer (couleur, nom affiché, message d'accueil) + aperçu + `EmbedSnippet` + champ « Allowed domains ». Bouton final « Make it live » → `PATCH status: "live"` → toast « Your agent is live. » → redirection vers l'Overview.

L'état du wizard vit dans l'URL (`step`, `id`) : un rechargement reprend au bon endroit.

### 3.4 Overview de l'agent — `agents/[id]/page.tsx`

Référence écran 11 (sans jargon : pas de « telemetry », « vitrines », etc.).
- 4 KPI compacts (30 j) : Conversations, Resolved without a human, Satisfaction, Fallback rate (même calcul que §3.8).
- « Recent conversations » : 5 dernières (visiteur, aperçu, statut, temps relatif) → lien vers le détail.
- « Knowledge health » : sources ready / processing / failed, dernière synchro, nombre de **questions sans réponse** (30 j) avec lien vers Analytics.
- Carte « Embed » : `EmbedSnippet` + lien « Customize widget ».
- Si `status = draft` : bandeau `warning` « This agent is a draft. Publish it from the Widget tab to answer visitors. »

### 3.5 Conversations — boîte de réception

Référence `sigilla_conversation_detail_handoff_dark_light` **corrigée** (audit C5, C6, §4.1 : pas de toggle de thème dans la barre, pas de « Lead # », pas d'IP, pas de « Socket sync », pas de « templates / lead cards », pas de « Classification », embedding affiché = « Gemini · 768d »).

**Layout 3 colonnes** (≥ 1280px ; en dessous : liste puis détail en navigation) :

**Colonne gauche (340px) — liste**
- Recherche (sur le contenu des messages, `contains` insensible à la casse, debounce 300 ms).
- Filtres (chips) : All · Needs human · Negative feedback · Unanswered · Resolved ; sélecteur d'agent ; période 7/30/90 j.
- Ligne : « Visitor #{4 derniers caractères de visitorId en majuscules} » (Instrument Sans 14px, **pas de serif tronqué**), pays (`Intl.DisplayNames` sur `country`), temps relatif, `StatusPill` (Needs human = warning, Human = accent, Resolved = success, Bot = neutral), aperçu du dernier message (1 ligne).
- Tri : `handoff_requested` d'abord, puis `lastMessageAt desc`. Pagination par curseur (30 par page, « Load more »).

**Colonne centrale — fil**
- En-tête : « Visitor #4821 » (`font-serif text-h2`), agent, « Started {date} » ; actions : « Take over » (si `bot` ou `handoff_requested`), « Resolve » (si non résolu).
- Messages : visiteur à droite (`bg-surface-raised`), bot à gauche (`bg-surface border-border`) avec `AnswerText` + `SealedBy`, fallback en italique muted avec liseré gauche `border-warning`, agent humain à gauche avec libellé « {nom} · {organisation} », messages `system` centrés en `label-caps` (« Handoff requested · 21:14 »).
- Sous chaque message bot : score `font-mono` (« 0.82 ») et feedback reçu (👍/👎 en icônes `ThumbsUpIcon/ThumbsDownIcon`).
- **Composer** (visible si statut `handoff_requested` ou `human`) : textarea « Reply as {prénom}… », Enter = envoyer, bouton primaire « Send » et ghost « Resolve ». Si statut `bot` : bouton « Take over » à la place du composer.

**Colonne droite (320px) — contexte**
- Email capturé (bouton copier) ou « Not provided ».
- Page d'origine (lien), langue, pays.
- Satisfaction de la conversation (compteurs 👍/👎).
- **Retrieval de la dernière réponse** : top score (`font-mono text-kpi` réduit à 32px), « Gemini · 768d », liste des sources citées avec score.
- Si la dernière réponse est un fallback : carte `warning` « Knowledge gap detected » + texte de la question + lien « Add missing knowledge » → `/agents/<id>/sources?add=1`.

**Polling** : liste et fil rafraîchis toutes les **3 s** (`refetchInterval: 3000`, `refetchIntervalInBackground: false`).

### 3.6 Handoff — logique serveur

`lib/handoff.ts` :

```ts
import { prisma } from "@/lib/db";

export async function requestHandoff(conversationId: string, trigger: "visitor" | "auto", email?: string | null) {
  const conv = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "handoff_requested", visitorEmail: email ?? undefined, lastMessageAt: new Date() },
  });
  await prisma.message.create({ data: { conversationId, role: "system", content: "handoff_requested" } });
  await prisma.analyticsEvent.create({ data: { chatbotId: conv.chatbotId, type: "handoff", metadata: { trigger } } });
  return conv;
}

export async function takeOver(conversationId: string, agentName: string) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { status: "human", agentName } });
  await prisma.message.create({ data: { conversationId, role: "system", content: `agent_joined:${agentName}` } });
}

export async function agentReply(conversationId: string, agentName: string, content: string) {
  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversationId }, data: { status: "human", agentName, lastMessageAt: new Date() } }),
    prisma.message.create({ data: { conversationId, role: "agent", content } }),
  ]);
}

export async function resolve(conversationId: string) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { status: "resolved", fallbackStreak: 0 } });
  await prisma.message.create({ data: { conversationId, role: "system", content: "resolved" } });
}
```

- **Déclenchement automatique** : dans `lib/rag/answer.ts` (`finishFallback`), si `updated.fallbackStreak >= HANDOFF_AFTER_FALLBACKS` **et** statut `bot` → appelle `requestHandoff(convId, "auto")`. Le widget affiche alors la carte handoff (déjà géré par `handoffSuggested`).
- Le endpoint public `POST /api/public/v1/handoff` (P4) doit appeler `requestHandoff(id, "visitor", email)` (refactor si besoin).
- Les messages `system` sont stockés avec un **code** (`handoff_requested`, `agent_joined:<nom>`, `resolved`) et traduits à l'affichage (dashboard via next-intl ; widget : il ne reçoit que les rôles `agent` + `agentName`).
- Une conversation `resolved` qui reçoit un nouveau message visiteur repasse à `bot` (dans `answer()` : si `status === "resolved"` → update `status: "bot"`).

Routes dashboard (`requireOrgApi({ write: true })`, vérifier que la conversation appartient à un agent de l'org) :

| Route | Action |
|---|---|
| `GET /api/conversations?agent=&status=&q=&period=&cursor=` | Liste paginée (exclut `playground:`) |
| `GET /api/conversations/[id]` | Détail + messages + dernière réponse bot avec citations |
| `POST /api/conversations/[id]/takeover` | `takeOver(id, user.name)` |
| `POST /api/conversations/[id]/reply` | `{ content }` (1–2000 car.) → `agentReply` |
| `POST /api/conversations/[id]/resolve` | `resolve` |
| `GET /api/conversations/pending-count` | Nombre de `handoff_requested` de l'org (pour le badge) |

**Badge sidebar** : `useQuery(["pending-count"], { refetchInterval: 10_000 })` dans l'AppShell ; badge `bg-accent text-on-accent font-mono text-[11px] rounded-full min-w-5` sur « Conversations », masqué si 0. `document.title` préfixé « (2) » si > 0.

### 3.7 Événements analytics

Déjà émis : `message` (P3), `fallback` (P3), `feedback` (P4), `widget_open` (P4), `handoff` (§3.6). Vérifie qu'aucun n'est émis pour le playground. Ajoute un index si absent : `@@index([chatbotId, type, createdAt])` (fait en P2).

### 3.8 Analytics — calculs (`lib/analytics/queries.ts`)

Périodes : 7 / 30 / 90 jours (UTC), comparaison avec la période précédente de même durée pour les deltas.

| KPI | Définition |
|---|---|
| Conversations | `count(Conversation)` créées dans la période (hors playground) |
| Resolved without a human | % de ces conversations qui n'ont **jamais** eu de statut `handoff_requested`/`human` (aucun message `system` `handoff_requested`) |
| Satisfaction | `up / (up + down)` sur les feedbacks de la période ; `—` si 0 feedback |
| Fallback rate | `count(Message bot fallback=true) / count(Message bot)` |

Requêtes SQL brutes autorisées pour les agrégations par jour (`date_trunc('day', "createdAt")`). Remplir les jours sans données par 0 côté serveur.

- **Conversations per day** : série unique.
- **Top questions** : messages visiteurs de la période, normalisés (minuscules, ponctuation retirée, espaces compressés), groupés par texte normalisé, top 8 avec compteur.
- **Most cited sources** : dépliage de `Message.citations` (JSON) — `jsonb_array_elements` — groupé par `title`, top 6 avec part en %.
- **Unanswered questions** : événements `fallback` (metadata.question) groupés comme les top questions, top 8, avec date de première occurrence.

### 3.9 Analytics — UI (`analytics/page.tsx`)

Référence écran Analytics **corrigée** (audit C2, C3, §4.1 : pas « Export Ledger », pas « Inspect Guardrails », pas « Audit v4.2 », pas de 2e série non définie, pas de « Sombre/Clair »).
- En-tête : `font-serif text-h1` « Analytics », sélecteur d'agent (« All agents » + liste), segmented 7d / 30d / 90d (30d par défaut, dans l'URL `?period=30`).
- 4 cartes KPI : libellé `label-caps`, valeur `font-serif text-kpi`, delta `font-mono text-small` (`text-success` si amélioration, `text-error` si dégradation — attention : pour le fallback rate, baisse = amélioration).
- **Graphique** (recharts `AreaChart`) : une seule série, trait 1.5px `var(--accent)` éclairci pour le dark (`#C24A63`) / `var(--accent)` en light, remplissage dégradé vertical `accent` 18 % → 0 %, grille horizontale hairline `var(--border)`, axes `text-muted` 11px `font-mono`, tooltip `bg-surface-raised border-border` (date + conversations + taux de résolution du jour). Animation désactivée si reduced motion.
- **Most cited sources** : libellé **au-dessus** de la barre, tronqué avec `title` (audit C2), barre 4px pleine largeur `bg-accent` sur fond `bg-surface-raised`, % et nombre en `font-mono`.
- **Top questions** : liste numérotée (`font-mono` 01, 02…), compteur à droite.
- **Unanswered questions — add knowledge to cover them** : lignes (question en `font-serif` 18px entre guillemets, « First seen {relative} », compteur), bouton ghost « Add source » → sources de l'agent concerné.
- Skeletons pendant le chargement, `EmptyState` si aucune donnée (« Analytics appear after your first conversations. »).
- Respecte le principe `dataviz` : une seule couleur d'accent, pas de légende inutile, valeurs lisibles en dark et light.

---

## 4. Critères d'acceptation

- [ ] Créer un agent de bout en bout via le wizard (identité → PDF → widget → « Make it live ») en < 3 minutes ; recharger à chaque étape reprend au bon endroit.
- [ ] Liste des agents correcte (métriques), état vide correct pour une nouvelle org.
- [ ] Depuis `/atelier-lune` : poser 2 questions hors sujet → la conversation passe **automatiquement** en « Needs human », badge sidebar = 1 en ≤ 10 s.
- [ ] Le visiteur laisse son email → visible dans le panneau contexte.
- [ ] « Take over » puis réponse agent → le message apparaît dans le widget en ≤ 3 s avec « {nom} joined » ; le bot ne répond plus pendant le mode humain.
- [ ] « Resolve » → statut Resolved ; un nouveau message visiteur relance le bot.
- [ ] Les conversations de playground n'apparaissent ni dans la liste ni dans les analytics.
- [ ] KPIs vérifiés à la main sur un jeu de 10 conversations (feuille de calcul ou SQL) ; deltas cohérents.
- [ ] Analytics lisibles en dark **et** light ; aucune étiquette tronquée sans `title`.
- [ ] Un membre d'une autre org ne voit aucune conversation (403/404 sur les routes).
- [ ] Lint, typecheck, build OK ; textes EN/FR (messages `system` traduits) ; aucune Material Symbol.

## 5. Fin de phase
1. Coche les 15 tâches « Phase 6 (P5) » dans `PROGRESS.md` ; recalcule le tableau.
2. `DECISIONS.md` : écarts éventuels.
3. Commit `chore: complete phase 5 (dashboard, handoff, analytics)`.
