# Sigilla — Product Requirements Document (PRD)

> **Project 07 / 30 — Portfolio**
> *Every answer, sealed by its source.*
> Version 1.0 — 2026-10-12 — Statut : **DRAFT, en attente de validation**

---

## 0. Résumé exécutif

| Élément | Valeur |
|---|---|
| Nom | **Sigilla** (latin *sigilla* = « les sceaux ») |
| Slogan | *Every answer, sealed by its source.* |
| Accroche portfolio | *No-code AI support agents, trained on your docs and embedded anywhere in one line.* |
| Catégorie | SaaS B2B — RAG chatbot builder multi-tenant |
| Cibles | SaaS, e-commerce, agences, startups |
| Références marché | Intercom Fin, Chatbase, CustomGPT.ai, Voiceflow |
| Budget | **0 $** — free tiers uniquement |
| Exigence n°1 | **Zéro maintenance** : déployé une fois, jamais retouché |
| Exigence n°2 | **Premium / luxe** sur chaque choix (UI, copy, perf, détails) |

### Différenciation vs Excerpta (Projet 08, déjà au portfolio)

Le RAG est une **commodité réutilisée**. La vitrine de Sigilla, c'est :

1. **Multi-tenant** — Organization → Chatbots → Sources (isolation stricte des données).
2. **Widget embeddable < 5 KB gzip** — une ligne de code, Shadow DOM, zéro dépendance.
3. **Ingestion multi-source** — PDF + crawl de site web + Notion OAuth.
4. **Ops support** — conversation viewer, human handoff, analytics, API keys, plans.

---

## 1. Principes non négociables

1. **0 $** — aucun service payant, aucun nom de domaine (sous-domaine `.vercel.app`).
2. **Zéro maintenance** — aucun service qui se met en pause, s'archive ou expire ; **aucun cron** ; quotas réinitialisés paresseusement (lazy reset) comme dans Excerpta.
3. **Repo identique à Excerpta** — mêmes conventions, structure, outillage (audit du 2026-10-12), sauf exceptions listées en §3.2.
4. **Dernières versions stables** de chaque dépendance au moment du scaffolding.
5. **IA 100 % gratuite** — Groq + Gemini, jamais OpenAI payant.
6. **Résilience aux changements de modèles** — noms de modèles en env vars + fallback automatique Groq → Gemini.
7. **Premium** — WCAG AA, perf (Lighthouse ≥ 95), micro-interactions soignées, copy « maître d'hôtel ».

---

## 2. Services externes (4 + Stripe test)

| Service | Usage | Free tier : comportement à l'inactivité |
|---|---|---|
| **Vercel Hobby** | Hébergement, Functions, Blob | Pas de pause |
| **Neon** | Postgres + **pgvector** + rate limiting | Scale-to-zero, **réveil auto** (~centaines de ms) |
| **Groq** | Chat LLM (principal) | Pas de pause |
| **Google Gemini** | Embeddings 768d + chat fallback | Pas de pause |
| **Stripe (test mode)** | Abonnements | Pas d'expiration |
| Notion API | Connecteur OAuth (optionnel côté utilisateur) | Pas de pause |

**Écartés volontairement** : Supabase (pause 7 j), Upstash Redis (archivage 30 j), Pinecone, Inngest, Ably, Resend, Clerk, Fastify, Puppeteer — chacun = un service / un risque de plus.

---

## 3. Stack technique verrouillée

### 3.1 Baseline Excerpta (copie à l'identique)

| Couche | Choix | Référence Excerpta |
|---|---|---|
| Framework | **Next.js 16.x** (App Router, `proxy.ts`) | 16.3.2 |
| UI runtime | **React 19.x** | 19.2.8 |
| Langage | TypeScript `strict`, alias `@/*` | idem |
| Package manager | **npm** | idem |
| Lint | ESLint 9 flat config (`core-web-vitals` + `typescript`) | idem |
| ORM | **Prisma 7** + `@prisma/adapter-pg` + `prisma.config.ts` (`.env.local`) | idem |
| Auth | **Better Auth 1.x** — email/password + Google + GitHub, session 30 j | idem |
| IA | Orchestrateur maison `lib/ai/` : `groq-sdk` + `@google/genai`, fallback avant 1er octet streamé | idem |
| Chunking | `@langchain/textsplitters` | idem |
| Parsing PDF | `pdf-parse` (+ config `serverExternalPackages` / `outputFileTracingIncludes`) | idem |
| Stockage fichiers | **Vercel Blob** | idem |
| Billing | **Stripe SDK direct** (checkout / portal / webhook), client lazy | idem |
| i18n | **next-intl** EN + FR | idem |
| Thème | `next-themes`, variables CSS RGB, `darkMode: "class"` | idem |
| UI | Composants maison style shadcn (Radix + CVA + `tailwind-merge`) | idem |
| Toasts / charts | `react-toastify`, `recharts` | idem |
| Fichiers agent | `AGENTS.md` + `CLAUDE.md` (`@AGENTS.md`) | idem |

### 3.2 Adaptations validées (2026-10-12)

| # | Adaptation | Raison |
|---|---|---|
| A1 | **Billing rattaché à `Organization`** (pas `User`) — même code Stripe | Multi-tenant |
| A2 | **Prisma conservé** ; recherche vectorielle via `$queryRaw` (pgvector) | Cohérence Excerpta |
| A3 | **Rate limiting persistant dans Neon** pour les routes publiques (widget, API) ; même signature `rateLimit()` | Le widget est exposé à Internet ; l'in-memory d'Excerpta est best-effort |
| A4 | **Vitest + Playwright** ajoutés | Qualité premium + narratif « tests » du portfolio |
| A5 | **Tailwind CSS v4** (tokens via `@theme` en CSS) au lieu de 3.4 | Règle « latest stable » |
| A6 | **pgvector (Neon)** au lieu d'Upstash Vector | Zéro service supplémentaire, zéro archivage |
| A7 | Better Auth plugins **`organization`** + **`apiKey`** | Multi-tenant + tâche 20 sans code maison |
| A8 | **Hugeicons Free** (Stroke Rounded, 1.5px) au lieu de Phosphor | Identité propre |
| A9 | Fonts **Instrument Serif / Instrument Sans / JetBrains Mono** | Identité propre |

### 3.3 Spécifique Sigilla

| Besoin | Choix |
|---|---|
| Crawler | `fetch` natif + **Cheerio** (sitemap.xml d'abord, `robots.txt` respecté) |
| Notion | `@notionhq/client` + OAuth public integration |
| Widget build | **esbuild** (IIFE, minifié) → `public/widget/v1.js` |
| Budget taille | **`size-limit`** en CI : échec si > 5 KB gzip |
| Realtime dashboard | **Polling TanStack Query** (3 s sur les vues live) |
| Widget streaming | **SSE** (Route Handler `text/event-stream`) |

---

## 4. Architecture

```
┌──────────────────── Site du client ────────────────────┐
│ <script src="…/widget/v1.js" data-bot="pk_…" async>    │
│   └─ Shadow DOM : bulle + panneau chat (vanilla TS)    │
└───────────────┬────────────────────────────────────────┘
                │ fetch / SSE (CORS + Origin allowlist + rate limit Neon)
┌───────────────▼──────────── Next.js 16 (Vercel) ───────────────────────┐
│ app/(marketing)  landing, pricing, docs embed, legal                   │
│ app/(auth)       sign-in, sign-up, forgot/reset password               │
│ app/(app)        dashboard multi-tenant (Better Auth session)          │
│ app/api/auth     Better Auth handler                                   │
│ app/api/*        routes dashboard (session)                            │
│ app/api/public/v1/*  routes widget (bot public key)                    │
│ app/api/v1/*     API programmatique (API key, Bearer)                  │
│ app/api/workflows/*  ingestion (maxDuration 300, batches chaînés)      │
│ app/api/webhooks/stripe                                                │
└──────┬──────────────┬───────────────┬──────────────┬───────────────────┘
       │              │               │              │
   Neon (Prisma   Vercel Blob     Groq / Gemini    Stripe (test)
   + pgvector)    (PDF)           (chat / embed)   Notion API
```

### Structure du repo (calquée sur Excerpta)

```
sigilla-customer-bot/
├─ app/
│  ├─ (marketing)/            # landing, pricing, docs, privacy, terms
│  ├─ (auth)/                 # sign-in, sign-up, forgot-password, reset-password
│  ├─ (app)/                  # bots, bots/[id]/{sources,playground,widget,conversations,analytics}, settings
│  └─ api/                    # voir §4
├─ components/{ui,landing,dashboard,bots,sources,conversations,analytics,widget-preview,settings,shared}
├─ lib/
│  ├─ ai/                     # groq.ts, gemini.ts, orchestrator.ts  (repris d'Excerpta)
│  ├─ rag/                    # retrieve.ts, prompt.ts, citations.ts, fallback.ts
│  ├─ ingestion/              # pdf.ts, crawler.ts, notion.ts, chunk.ts, embed.ts, pipeline.ts
│  ├─ billing/                # plans.ts, usage.ts  (repris, adaptés Organization)
│  ├─ stripe/client.ts        # repris tel quel
│  ├─ auth.ts, auth-client.ts # + plugins organization, apiKey
│  ├─ rate-limit.ts           # même API, backend Neon
│  ├─ db.ts                   # repris tel quel
│  └─ validation/             # zod
├─ widget/                    # source TS du widget (hors app Next)
│  ├─ src/{index.ts,ui.ts,styles.ts,api.ts,storage.ts}
│  └─ build.mjs               # esbuild → public/widget/v1.js
├─ messages/{en,fr}.json
├─ prisma/{schema.prisma,seed.ts,manual/pgvector.sql}
├─ tests/{unit,e2e}
├─ proxy.ts, next.config.ts, prisma.config.ts, eslint.config.mjs
├─ AGENTS.md, CLAUDE.md, PROGRESS.md, README.md, .env.example
```

---

## 5. Modèle de données (Prisma)

> Tables Better Auth (User, Session, Account, Verification) + plugin `organization` (Organization, Member, Invitation) + plugin `apiKey` (ApiKey) générées par le CLI Better Auth, puis étendues.

| Modèle | Champs clés | Notes |
|---|---|---|
| **Organization** (étendu) | `plan` (free/pro/team), `stripeCustomerId`, `stripeSubscriptionId`, `stripeSubscriptionStatus`, `messageCount`, `usagePeriodStart` | Billing + quotas (A1), reset lazy mensuel UTC |
| **Chatbot** | `id`, `organizationId`, `name`, `description`, `instructions`, `publicKey` (`pk_…`), `allowedDomains[]`, `similarityThreshold` (déf. 0.75), `widgetConfig` (Json), `status` | `widgetConfig` = couleur, position, avatar, welcome, placeholder, langue |
| **DataSource** | `id`, `chatbotId`, `type` (pdf/url/notion), `name`, `url?`, `blobUrl?`, `notionPageIds?`, `status` (queued/processing/ready/failed), `pagesCount`, `chunksCount`, `contentHash`, `lastSyncedAt`, `error?` | Re-ingestion manuelle |
| **Chunk** | `id`, `dataSourceId`, `chatbotId`, `content`, `embedding vector(768)`, `sourceTitle`, `sourceUrl?`, `pageNumber?`, `contentHash` | Index **HNSW cosine** (SQL manuel) ; filtre `chatbotId` = isolation |
| **NotionConnection** | `organizationId`, `accessToken` (chiffré AES-GCM), `workspaceName`, `workspaceIcon` | Token chiffré avec `ENCRYPTION_KEY` |
| **Conversation** | `id`, `chatbotId`, `visitorId`, `status` (bot/handoff_requested/human/resolved), `visitorEmail?`, `pageUrl?`, `locale`, `lastMessageAt` | |
| **Message** | `id`, `conversationId`, `role` (visitor/bot/agent), `content`, `citations` (Json), `topScore?`, `fallback` (bool), `provider?`, `feedback?` (up/down) | |
| **AnalyticsEvent** | `id`, `chatbotId`, `type` (widget_open/message/feedback/handoff/fallback), `metadata` (Json), `createdAt` | Agrégations dashboard |
| **RateLimitBucket** | `key` (PK), `count`, `resetAt` | Upsert atomique ; purge lazy des lignes expirées (A3) |

---

## 6. Plans & limites (Stripe test mode)

| | **Free** — 0 $ | **Pro** — 12 $/mois | **Team** — 39 $/mois |
|---|---|---|---|
| Chatbots | 1 | 5 | 15 |
| Sources / bot | 5 | 25 | 50 |
| Pages crawlées / URL | 25 | 100 | 100 |
| Messages / mois (org) | 200 | 2 000 | 10 000 |
| Connecteur Notion | — | ✅ | ✅ |
| API keys | — | ✅ | ✅ |
| Human handoff | ✅ | ✅ | ✅ |
| Badge « Sealed by Sigilla » masquable | — | ✅ | ✅ |
| Membres d'équipe | 1 | 3 | 10 |

- **Garde-fou global** (protège le free tier Neon 0,5 GB) : plafond total de chunks et taille max PDF (10 MB) via env vars.
- Carte de test Stripe `4242 4242 4242 4242` affichée sur `/pricing` (bannière discrète « Demo mode »).

---

## 7. Périmètre fonctionnel (22 tâches du brief → toutes livrées avant publication)

> Pas de « V2 » : le projet est publié une fois, complet. Les 22 tâches sont réparties en 7 phases de délégation (§10).

### F1 — Onboarding & Organisations
- Sign-up / sign-in (email + Google + GitHub), création automatique d'une organisation personnelle.
- Switcher d'organisation, invitations membres (lien d'invitation copiable, pas d'email).
- **Wizard 3 étapes** de création de bot : ① Identité (nom, description, instructions) → ② Sources → ③ Widget & embed.

### F2 — Chatbots (tâche 14)
- CRUD bot ; `instructions` = system prompt additionnel (ton, périmètre).
- **Playground** interne (test du bot avec affichage des scores et sources).

### F3 — Ingestion (tâches 2, 4, 5, 6, 15, 16)
| Source | Pipeline | Contraintes |
|---|---|---|
| **PDF** | Upload Blob → `pdf-parse` → chunks (page conservée) → embeddings Gemini (batch) → `Chunk` | ≤ 10 MB |
| **URL** | `sitemap.xml` sinon BFS same-origin → `robots.txt` → Cheerio (retire nav/footer/script) → chunks (URL + titre conservés) | ≤ 100 pages, 1 req/250 ms, timeout 10 s/page |
| **Notion** | OAuth → sélection de pages → blocks → markdown → chunks | Pro/Team |
- **Traitement par lots chaînés** : chaque invocation traite N pages/chunks (< 300 s), sauvegarde un curseur, puis se ré-invoque (`fetch` vers sa propre route, signé HMAC). Aucun service de queue.
- **Re-sync manuelle** (bouton) : recalcule `contentHash`, ne ré-embedde que les chunks modifiés, supprime les orphelins.
- Statuts temps réel dans l'UI (polling) + messages d'erreur ton « maître d'hôtel ».

### F4 — RAG & réponses (tâches 7, 8, 9, 10)
1. Question → embedding Gemini (768d).
2. `SELECT … ORDER BY embedding <=> $1 LIMIT 6 WHERE chatbotId = $2` (pgvector).
3. **Fallback** si `topScore < similarityThreshold` → réponse « I don't have a verified answer to that. » + proposition de handoff ; aucun appel LLM.
4. Sinon prompt = règles système Sigilla + `instructions` du bot + contexte numéroté → **streaming** Groq (fallback Gemini avant 1er octet).
5. **Citations** : le modèle cite `[1]`, `[2]` ; le serveur mappe vers titre + URL/page ; rendu en « sceaux » cliquables.
6. Garde-fous : réponse uniquement depuis le contexte, langue du visiteur, refus des injections (« ignore previous instructions »), longueur max question 1 000 caractères.

### F5 — Widget embeddable (tâches 11, 12, 13)
- Snippet : `<script src="https://<app>.vercel.app/widget/v1.js" data-bot="pk_xxx" async></script>`
- **Vanilla TS, zéro dépendance, Shadow DOM**, < 5 KB gzip (`size-limit` bloquant en CI).
- Charge `GET /api/public/v1/bots/:pk/config` (couleur, position bas-gauche/droite, avatar, welcome, placeholder, badge).
- Conversation persistée par `visitorId` (localStorage, try/catch) ; streaming SSE ; affichage des citations.
- Feedback 👍/👎 par réponse ; bouton « Talk to a human ».
- **Sécurité** : vérification `Origin` ∈ `allowedDomains` (+ `localhost` en dev), CORS restreint, rate limit Neon par `pk + IP` (ex. 20 msg/min) et quota org.
- A11y : focus trap, `Esc` ferme, ARIA live pour le streaming, `prefers-reduced-motion`, responsive mobile plein écran.
- **Live preview** dans le dashboard (iframe locale du widget avec la config en cours).

### F6 — Conversations & Human handoff (tâches 17, 19)
- Liste filtrable (statut, date, feedback négatif, fallback), vue détaillée avec citations et scores.
- Handoff : visiteur clique « Talk to a human » **ou** fallback 2× consécutifs → statut `handoff_requested`, badge dans le dashboard, le widget demande un email (optionnel).
- L'agent répond depuis le dashboard ; le widget **poll** toutes les 3 s tant que la conversation est en mode humain ; bouton « Resolve ».

### F7 — Analytics (tâche 18)
- KPIs : conversations, messages, **taux de résolution sans humain**, satisfaction (👍 / total feedbacks), taux de fallback.
- Graphiques (recharts) : volume / jour, top questions (regroupement par similarité simple), **sources les plus citées**, questions sans réponse (à documenter).
- Filtre période 7 j / 30 j / 90 j.

### F8 — API programmatique (tâche 20)
- Plugin Better Auth `apiKey` : création / révocation, préfixe visible `sk_live_…`, hash en base.
- `POST /api/v1/chat` (stream ou non), `GET /api/v1/bots`, `GET /api/v1/conversations` — doc dans `/docs/api`.

### F9 — Billing & rate limiting (tâche 21)
- Repris d'Excerpta : `billing/checkout`, `billing/portal`, `webhooks/stripe` (3 events), adapté `Organization`.
- `assertWithinQuota()` sur chaque message ; message de dépassement élégant dans le widget (« This assistant is resting for now. ») + bannière dashboard.

### F10 — Marketing, docs, qualité, déploiement (tâche 22)
- **Landing premium** avec **widget Sigilla réel embarqué** (bot de démo entraîné sur la doc de Sigilla) — preuve vivante.
- Pages : pricing, docs (embed, customisation, API), privacy, terms.
- **Compte démo** pré-rempli (seed) : org « Maison Démo », 2 bots, conversations et analytics réalistes — accès en 1 clic depuis la landing.
- SEO / OG images, README avec bannières dark/light (comme Excerpta).

---

## 8. Écrans (base pour les LOTs Stitch)

| # | Écran | # | Écran |
|---|---|---|---|
| 1 | Landing (hero + widget live) | 11 | Sources (liste + statuts) |
| 2 | Pricing | 12 | Ajouter une source (PDF / URL / Notion) |
| 3 | Docs (embed + API) | 13 | Playground |
| 4 | Sign-in / Sign-up | 14 | Widget designer + live preview |
| 5 | Forgot / Reset password | 15 | Embed code |
| 6 | Wizard étape 1 — Identité | 16 | Conversations (liste) |
| 7 | Wizard étape 2 — Sources | 17 | Conversation (détail + handoff) |
| 8 | Wizard étape 3 — Widget & embed | 18 | Analytics |
| 9 | Bots (liste / empty state) | 19 | Settings : profil, organisation & membres, billing, API keys, Notion |
| 10 | Bot overview | 20 | Widget : fermé, ouvert, streaming, citations, handoff, quota, mobile |

---

## 9. Exigences non fonctionnelles

| Domaine | Exigence |
|---|---|
| Performance | Lighthouse ≥ 95 (landing), LCP < 2 s ; 1er token chat < 1,5 s (Groq) |
| Widget | ≤ 5 KB gzip, aucun impact CLS sur le site hôte, chargement `async` |
| A11y | WCAG 2.1 AA (contrastes de la palette déjà vérifiés), navigation clavier complète |
| Sécurité | Isolation par `organizationId` / `chatbotId` sur **chaque** requête ; secrets serveur uniquement ; tokens Notion chiffrés ; signature webhook Stripe ; HMAC sur les auto-invocations d'ingestion |
| i18n | EN + FR (UI dashboard, landing, widget) |
| Tests | Vitest : chunking, citations, fallback, quotas, rate limit, plans ; Playwright : sign-up → wizard → upload → chat widget → handoff → upgrade Stripe |
| Observabilité | Logs structurés `[module]` (pattern Excerpta) |

---

## 10. Phases de délégation (fichiers à produire ensuite)

| Phase | Contenu | Tâches brief |
|---|---|---|
| **P1** | Scaffolding (copie conventions Excerpta), Tailwind v4 + design system Sigilla, i18n, Better Auth + organizations | 1, (14 partiel) |
| **P2** | Schéma Prisma, pgvector, ingestion PDF + URL + Notion, batches chaînés, re-sync | 2, 3, 4, 5, 6, 15, 16 |
| **P3** | RAG : retrieve, prompt, streaming, citations, fallback, playground | 7, 8, 9, 10 |
| **P4** | Widget vanilla + Shadow DOM + config + SSE + designer/preview + embed | 11, 12, 13 |
| **P5** | Dashboard : wizard 3 étapes, conversations, handoff, analytics | 14, 17, 18, 19 |
| **P6** | Billing Stripe (Organization), quotas, rate limit Neon, API keys + API v1 | 20, 21 |
| **P7** | Landing + widget live, docs, compte démo, SEO, tests Vitest/Playwright, `size-limit`, déploiement | 22 |

---

## 11. Variables d'environnement

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GROQ_API_KEY=
GROQ_MODEL=
GEMINI_API_KEY=
GEMINI_CHAT_MODEL=
GEMINI_EMBEDDING_MODEL=
BLOB_READ_WRITE_TOKEN=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
ENCRYPTION_KEY=            # AES-GCM tokens Notion
INGESTION_HMAC_SECRET=     # auto-invocations des batches
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_TEAM=
MAX_TOTAL_CHUNKS=          # garde-fou stockage Neon
DEMO_ORG_ID=
```

---

## 12. Risques & parades

| Risque | Parade |
|---|---|
| Modèle Groq/Gemini retiré | Noms en env vars + fallback automatique ; changer une variable, pas le code |
| Quotas IA gratuits épuisés par des visiteurs | Rate limit Neon + quotas org + cap global |
| Stockage Neon (0,5 GB) saturé | `MAX_TOTAL_CHUNKS`, limites par plan, taille PDF max |
| Timeout 300 s sur gros crawl | Batches chaînés avec curseur |
| Abus du widget depuis un domaine tiers | Allowlist `Origin` + rate limit par `pk + IP` |
| Prompt injection via contenu crawlé | Règles système prioritaires + contexte délimité + aucune action exécutable |
| Notion OAuth (intégration publique) | Pages privacy/terms + URL de redirection fixe ; connecteur réservé Pro/Team |

---

## 13. Branding (validé 2026-10-12)

| Élément | Valeur |
|---|---|
| Palette | **Noir Bordeaux**, dark-first + light (tokens ci-dessous) |
| Typographie | Instrument Serif (titres) · Instrument Sans (UI) · JetBrains Mono (code) |
| Logo | **Wordmark** « Sigilla » (Instrument Serif, tracking léger) ; favicon / avatar widget = « S » porcelaine sur carré arrondi bordeaux |
| Icônes | Hugeicons Free — Stroke Rounded, 1.5px |
| Ton | « Le maître d'hôtel » — posé, précis, chaleureux, bref |

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0E0A0B` | `#FAF6F2` |
| `--surface` | `#171113` | `#FFFFFF` |
| `--surface-raised` | `#201719` | `#F4EDE8` |
| `--border` | `#2E2225` | `#E8DED8` |
| `--text` | `#F3ECE6` | `#1A1214` |
| `--text-muted` | `#A8999A` | `#6B5A5D` |
| `--accent` (fills) | `#9E2F45` | `#8A2438` |
| `--accent-hover` | `#872538` | `#741D2F` |
| `--accent-soft` (liens, focus) | `#E3B3BA` | `#F3DDE1` |
| `--success` | `#6FBF8E` | `#2F7A4D` |
| `--warning` | `#E0B05C` | `#85590C` |
| `--error` | `#E5675F` | `#B3261E` |

> Règle : le bordeaux n'est **jamais** utilisé comme couleur de texte sur fond sombre (contraste 2,8) — uniquement en fond.

---

## 14. Décisions (log)

| Date | Décision |
|---|---|
| 2026-10-12 | Budget 0 $, zéro maintenance, IA gratuite (Groq + Gemini) |
| 2026-10-12 | Repo identique à Excerpta (app Next.js unique) ; Fastify, Turborepo, Clerk abandonnés |
| 2026-10-12 | Neon (pas Supabase) ; pgvector (pas Pinecone/Upstash) ; pas d'Inngest/Ably/Resend |
| 2026-10-12 | Paiement Stripe test mode, même implémentation qu'Excerpta, rattaché à Organization |
| 2026-10-12 | Prisma 7, rate limit Neon, Vitest + Playwright, Tailwind v4 |
| 2026-10-12 | Nom Sigilla, slogan, palette Noir Bordeaux, typo Instrument, wordmark, Hugeicons, ton maître d'hôtel |
| 2026-10-12 | Prix alignés sur Excerpta (0 / 12 / 39 $) ; organisation démo « Maison Démo » ; domaine Vercel fixé après déploiement |

---

## 15. Points ouverts

1. **Sous-domaine Vercel** — fixé après le push GitHub et le premier déploiement Vercel.

### Points tranchés (2026-10-12)

- **Prix des plans** : identiques aux autres projets du portfolio (référence Excerpta) — Free 0 $ · Pro 12 $/mois · Team 39 $/mois. Limites du §6 inchangées.
- **Organisation démo** : « **Maison Démo** », créée par `prisma/seed.ts` — 2 bots entraînés (boutique e-commerce + SaaS), conversations réalistes dont une en human handoff, analytics pré-remplis. Accès en 1 clic via « Explore the live demo » sur la landing, sans inscription.
