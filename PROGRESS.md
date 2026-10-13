# Sigilla — PROGRESS.md

> Project 07 / 30 — *Every answer, sealed by its source.*
> Références : [SIGILLA-PRD.md](./SIGILLA-PRD.md) · [Audit design](./project-07-sigilla-design-audit-recommendations.md)

**Statut global : 58/151 tâches (38 %)** — cadrage, design, fichiers de délégation, Phase 2 (P1) et Phase 3 (P2) terminés.

| Phase | Avancement |
|---|---|
| Phase 0 — Cadrage | 8/8 — 100 % ✅ |
| Phase D — Design | 6/6 — 100 % ✅ |
| Phase 1 — Préparation de la délégation | 9/10 — 90 % |
| Phase 2 (P1) — Fondations, design system, auth | 20/20 — 100 % ✅ |
| Phase 3 (P2) — Données et ingestion | 15/15 — 100 % ✅ |
| Phase 4 (P3) — RAG et réponses | 0/10 — 0 % |
| Phase 5 (P4) — Widget embeddable | 0/16 — 0 % |
| Phase 6 (P5) — Dashboard, conversations, handoff, analytics | 0/15 — 0 % |
| Phase 7 (P6) — Billing, quotas, API | 0/12 — 0 % |
| Phase 8 (P7) — Landing, démo, docs | 0/10 — 0 % |
| Phase 9 (P8) — Qualité, sécurité, performance | 0/11 — 0 % |
| Phase 10 — Déploiement et zéro maintenance | 0/10 — 0 % |
| Phase 11 — Présentation portfolio | 0/8 — 0 % |

---

## Phase 0 — Cadrage
- [x] Raffinement du brief et différenciation vs Excerpta
- [x] Stack verrouillée : 0 $, zéro maintenance, IA gratuite (Groq + Gemini)
- [x] Audit des repos Excerpta et Linqis (config, Better Auth, Stripe)
- [x] Adaptations validées (billing par organisation, Prisma 7, rate limit Neon, Vitest/Playwright, Tailwind v4)
- [x] Nom **Sigilla**, slogan et accroche portfolio
- [x] Branding complet (Noir Bordeaux, Instrument, wordmark, Hugeicons, ton « maître d'hôtel »)
- [x] PRD rédigé et validé (`SIGILLA-PRD.md`)
- [x] Prix des plans (0 / 12 / 39 $) et organisation démo « Maison Démo »

## Phase D — Design
- [x] Prompts Stitch découpés en 5 LOTs
- [x] Génération des écrans dashboard et auth
- [x] Génération landing, pricing, docs
- [x] Génération des 8 états du widget (+ variante light + mobile)
- [x] Export des écrans + `DESIGN.md`
- [x] Audit design (tokens MD3, Material Symbols, sceaux de citation, copy)

## Phase 1 — Préparation de la délégation
- [x] Fichier de délégation P1 — Fondations, design system, auth
- [x] Fichier de délégation P2 — Données et ingestion
- [x] Fichier de délégation P3 — RAG et réponses
- [x] Fichier de délégation P4 — Widget embeddable
- [x] Fichier de délégation P5 — Dashboard, conversations, handoff, analytics
- [x] Fichier de délégation P6 — Billing, quotas, API
- [x] Fichier de délégation P7 — Landing, démo, docs
- [x] Fichier de délégation P8 — Qualité, sécurité, performance
- [ ] Checklist de création des comptes gratuits (GitHub, Vercel, Neon, Groq, Google AI Studio, Stripe test, OAuth Google, OAuth GitHub, intégration publique Notion) — GitHub/Vercel/Neon faits ; le reste au fil des phases qui en ont besoin (voir DECISIONS.md)
- [x] `.env.example` complet et commenté

## Phase 2 (P1) — Fondations, design system, auth
- [x] Init Next.js 16 + React 19 + TS strict + npm (conventions Excerpta)
- [x] `AGENTS.md`, `CLAUDE.md`, ESLint flat config, Prettier, `.gitignore`, `.editorconfig`
- [x] Repo GitHub + premier commit
- [x] **Déploiement Vercel précoce** — URL live dès le jour 1
- [x] Tailwind CSS v4 + tokens Noir Bordeaux (dark-first + light) dans `@theme`
- [x] `next/font` : Instrument Serif, Instrument Sans, JetBrains Mono
- [x] Hugeicons Free (Stroke Rounded, 1.5px) + composant `Icon`
- [x] Composants UI : Button (primary/ghost/link), Input, Textarea, Select, Card, Badge, StatusPill, Avatar, Dropdown, Dialog, Drawer, Tabs, Tooltip, Toast, Skeleton, EmptyState
- [x] Composant **`CitationSeal`** (spec unique de l'audit)
- [x] Wordmark « Sigilla », favicon « S » (32/180, `ImageResponse`), `manifest.webmanifest` — tailles 512/16 manquantes (voir DECISIONS.md)
- [x] Theme toggle (next-themes) dans le menu utilisateur
- [x] i18n next-intl EN + FR (dashboard) — landing/widget suivront en Phase 7/4
- [x] App shell : sidebar, switcher d'organisation, menu utilisateur, plan chip (breadcrumb non ajouté, pas encore de sous-pages à fil d'Ariane)
- [x] Prisma 7 + Neon + `prisma.config.ts` + `lib/db.ts` — connexion vérifiée en direct
- [x] Better Auth : email/mot de passe + Google + GitHub (code complet ; clés OAuth à fournir par l'utilisateur pour activer les boutons sociaux)
- [x] Plugin `organization` : org perso auto, switcher, rôles Owner/Admin/Member — vérifié de bout en bout (sign-up → org créée → `/agents` accessible) ; invitations par lien = Phase 6
- [x] Pages sign-in, sign-up, forgot password, reset password
- [x] `proxy.ts` (protection des routes) + vérification de session côté serveur — vérifié (redirection sans session, accès avec session)
- [x] Pages 404, `error.tsx` global, `loading.tsx`
- [x] Micro-interactions : transitions, hover, focus visibles, `prefers-reduced-motion`

## Phase 3 (P2) — Données et ingestion
- [x] Schéma Prisma complet (Chatbot, DataSource, Chunk, NotionConnection, Conversation, Message, AnalyticsEvent, RateLimitBucket + billing sur Organization)
- [x] Extension pgvector + index HNSW cosine (SQL manuel versionné) — vérifié en direct sur Neon
- [x] Orchestrateur IA repris d'Excerpta (Groq → Gemini, modèles en env vars)
- [x] Embeddings Gemini 768d par lots, avec retry et backoff
- [x] Upload PDF sur Vercel Blob (10 MB max, validation MIME) — code prêt, `BLOB_READ_WRITE_TOKEN` pas encore fourni pour test réel
- [x] Pipeline PDF : extraction, nettoyage, chunks avec page, hash de contenu
- [x] Crawler URL : sitemap.xml, robots.txt, même domaine, 100 pages max, Cheerio, nettoyage nav/footer
- [x] Traitement par lots enchaînés (curseur + auto-invocation signée HMAC, < 300 s par appel) — déclenchement vérifié de bout en bout
- [x] Notion OAuth + token chiffré AES-GCM — code prêt, intégration publique Notion pas encore créée
- [x] Loader Notion (sélection de pages → markdown → chunks)
- [x] Data Sources manager (liste, ajout PDF / URL / Notion, tiroir d'ajout)
- [x] Statuts d'ingestion en direct (polling) + messages d'erreur soignés
- [x] Re-sync manuelle (ré-embed des seuls chunks modifiés, purge des orphelins)
- [x] Suppression d'une source (chunks + blob nettoyés)
- [x] Garde-fous : `MAX_TOTAL_CHUNKS`, limites par plan, taille des fichiers

## Phase 4 (P3) — RAG et réponses
- [ ] CRUD des agents (nom, description, instructions, seuil de similarité)
- [ ] Retrieval pgvector (top 6, filtré par agent)
- [ ] Prompt système Sigilla + instructions de l'agent + contexte numéroté
- [ ] Streaming des réponses (fallback Groq → Gemini avant le 1er octet)
- [ ] Citations `[n]` → titre + URL/page, rendues en `CitationSeal`
- [ ] Fallback « I don't have a verified answer » sous le seuil, sans appel LLM
- [ ] Garde-fous : contexte uniquement, langue du visiteur, anti-injection, longueur max
- [ ] Mémoire courte de conversation (derniers échanges)
- [ ] Persistance Conversation / Message (scores, provider, fallback)
- [ ] Playground interne + inspecteur de retrieval (scores, chunks, curseur de seuil)

## Phase 5 (P4) — Widget embeddable
- [ ] Source `widget/` TypeScript vanilla, zéro dépendance
- [ ] Build esbuild → `public/widget/v1.js` (IIFE, minifié)
- [ ] `size-limit` bloquant en CI (≤ 5 KB gzip)
- [ ] Shadow DOM (isolation CSS totale)
- [ ] Endpoint public de config de l'agent
- [ ] Chat SSE + rendu des citations
- [ ] `visitorId` persistant (localStorage avec try/catch)
- [ ] 8 états fidèles au LOT 2 (fermé, accueil, streaming, citations, fallback, mode humain, quota, mobile plein écran)
- [ ] Feedback 👍 / 👎 par réponse
- [ ] Sécurité : allowlist `Origin`, CORS, rate limit clé publique + IP
- [ ] A11y : focus trap, Esc, ARIA live, clavier, `reduced-motion`
- [ ] Contraste automatique du texte selon la couleur du client
- [ ] Widget designer (couleur, avatar, position, accueil, placeholder, badge, style d'en-tête)
- [ ] Aperçu live desktop / mobile dans le dashboard
- [ ] Snippet d'embed en une ligne + bouton copier
- [ ] Page de test « site client » Atelier Lune (démo + tests e2e)

## Phase 6 (P5) — Dashboard, conversations, handoff, analytics
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

## Phase 7 (P6) — Billing, quotas, API
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

## Phase 8 (P7) — Landing, démo, docs
- [ ] Landing premium (hero, How it works, features, citation, CTA final)
- [ ] **Widget Sigilla réel sur la landing** (agent entraîné sur la doc Sigilla)
- [ ] Seed « Maison Démo » (2 agents, sources, conversations dont 1 handoff, analytics sur 90 jours)
- [ ] Accès démo en 1 clic, lecture seule, protégé contre l'abus
- [ ] Pricing (+ bannière carte test Stripe) + FAQ
- [ ] Docs : démarrage, embed, personnalisation, handoff, référence API
- [ ] Pages privacy et terms (requises pour Notion OAuth)
- [ ] Copy final EN + FR corrigé selon l'audit (aucune promesse hors scope)
- [ ] SEO : metadata, Open Graph dynamique, `sitemap.ts`, `robots.ts`, JSON-LD
- [ ] Bannières README dark / light

## Phase 9 (P8) — Qualité, sécurité, performance
- [ ] Tests Vitest : chunking, citations, fallback, quotas, rate limit, plans, crawler, webhooks Stripe
- [ ] Tests Playwright : sign-up → wizard → upload → widget sur site client → handoff → upgrade Stripe
- [ ] Test e2e du widget sur une page tierce (Shadow DOM, CORS, origine refusée)
- [ ] CI GitHub Actions : lint, typecheck, tests, build, `size-limit`
- [ ] Lighthouse ≥ 95 sur la landing (perf, a11y, best practices, SEO)
- [ ] Audit WCAG 2.1 AA (contrastes, clavier, lecteurs d'écran) dashboard + widget
- [ ] Audit sécurité : isolation par org, en-têtes (CSP, HSTS), secrets serveur, signatures webhook, HMAC
- [ ] Test de prompt injection sur contenu crawlé
- [ ] Test de charge léger du widget (rate limit + quotas)
- [ ] QA manuelle complète : EN/FR, dark/light, mobile/desktop
- [ ] Conformité à l'audit design (zéro Material Symbol, zéro token MD3)

## Phase 10 — Déploiement et zéro maintenance
- [ ] Variables d'env de production sur Vercel
- [ ] Migration + seed de la base de production
- [ ] Webhook Stripe pointé sur l'URL de production
- [ ] URLs de redirection OAuth (Google, GitHub, Notion) en production
- [ ] Sous-domaine Vercel définitif
- [ ] Revue des 4 services : aucune pause, aucun archivage, aucun cron
- [ ] Limites gratuites protégées (caps globaux, rate limit)
- [ ] Test de résilience : Groq indisponible → fallback Gemini
- [ ] Vercel Analytics + logs structurés
- [ ] Vérification finale de bout en bout sur l'URL de production

## Phase 11 — Présentation portfolio
- [ ] README premium (bannière, GIF du widget, captures, architecture, stack, décisions, liens)
- [ ] Schéma d'architecture (widget → API → RAG → Neon/pgvector)
- [ ] Case study : problème, différenciation, décisions, compromis assumés, résultats
- [ ] Vidéo de démo 60–90 s
- [ ] Captures haute qualité (dark/light, desktop/mobile)
- [ ] Carte projet sur le portfolio + liens (démo, GitHub, case study)
- [ ] Post LinkedIn de lancement
- [ ] Mise à jour du statut portfolio (Sigilla publié)

---

## ✅ Definition of Done — « fini, premium, top tech »
- Démo live accessible en 1 clic, sans inscription
- Widget ≤ 5 KB gzip, prouvé en CI
- Lighthouse ≥ 95 et WCAG AA vérifiés
- Tests unitaires et e2e verts en CI
- Aucun service en pause, aucun cron, 0 $
- Chaque réponse citée, fallback honnête
- Copy EN/FR sans promesse inventée
- README et case study prêts pour un recruteur

---
*Mis à jour au fur et à mesure. Pourcentage + tâches faites/total reportés à la fin de chaque phase. Ne rien cocher sans exécution réelle vérifiée.*
