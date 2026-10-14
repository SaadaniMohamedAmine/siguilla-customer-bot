# Sigilla — PENDING_TESTS.md

> Tests réels pas encore faits, par phase. On coche ici au fur et à mesure qu'on les exécute — jamais à l'avance. Ce fichier vit à côté de `PROGRESS.md` / `DECISIONS.md` et doit être relu/mis à jour à chaque reprise de travail.

---

## Phase 3 (P2) — Données et ingestion

- [ ] **Traitement par lots enchaînés à l'échelle réelle** : crawler un vrai site de 40+ pages et confirmer que plusieurs auto-réinvocations ont bien lieu (pas juste un seul lot). Idem pour un PDF de plus de 20 pages (`STEP = 20` dans `lib/ingestion/pipeline.ts`).
- [ ] **Re-sync incrémentale sans changement** : resynchroniser une source déjà `ready` sans rien modifier → 0 nouveau chunk créé.
- [ ] **Re-sync incrémentale après modification** : modifier réellement le contenu d'une source puis resync → seuls les chunks modifiés sont ré-embeddés, les anciens sont purgés (`purgeOrphans`).
- [ ] **Nettoyage du blob à la suppression** — bug connu : supprimer un **chatbot** entier (cascade Prisma) ne passe pas par `DELETE /api/sources/[id]`, donc `del(blobUrl)` n'est jamais appelé. Des PDF de test sont probablement orphelins sur le Blob store (`siguilla-customer-bot`). À vérifier (`vercel blob list`) et nettoyer, puis décider si on corrige le comportement ou si c'est acceptable.
- [ ] **Isolation multi-org** : un utilisateur d'une organisation différente ne doit jamais pouvoir lire/modifier les chatbots/sources d'une autre org (403/404). Jamais testé avec deux organisations réellement différentes (le test test1/test2 partageait volontairement une org via invitation).
- [ ] **Signature HMAC invalide** sur `POST /api/workflows/ingest` → doit renvoyer 401.
- [ ] **Limite de sources par plan** : la 6e source sur le plan Free doit être refusée (`sources_limit`).
- [ ] **Sanity check final** : `SELECT count(*) FROM "Chunk" WHERE embedding IS NULL` doit valoir 0.

## Phase 4 (P3) — RAG et réponses

- [x] **Pipeline bout en bout avec vraies sources, en conditions réelles (via le widget, Phase 4)** — 2026-10-14 : quota Gemini visiblement reconstitué (plus bloqué). Testé `cmv78snow0000gow3jzmor4ay` ("RAG Test", source Wikipedia Capybara) via `/widget-preview` : réponse streamée, 2 citations correctes avec liens Wikipedia, bloc « Scellé par N sources », feedback 👍/👎 affiché. **Bug réel trouvé et corrigé au passage** : voir `DECISIONS.md` (crochets pleine-largeur 【n】 vs `[n]`).
- [ ] **Pipeline d'ingestion multi-chunks de bout en bout** (le flux d'ingestion lui-même — crawl/PDF → chunks → embeddings) reste à reconfirmer spécifiquement, indépendamment du test de réponse ci-dessus qui portait sur une source déjà `ready`.
- [ ] **Question réelle dans le Playground** (UI dashboard, pas juste le widget) sur un agent avec de vraies sources → réponse citée correctement, sceau cliquable, `SealedBy` avec les bonnes sources.
- [ ] **Question hors sujet** → fallback déclenché, **aucun appel LLM** (vérifiable via les logs — le score sous le seuil doit court-circuiter avant `streamAnswer`).
- [ ] **`handoffSuggested` après 2 fallbacks consécutifs** sur la même conversation.
- [ ] Injection de prompt (« ignore previous instructions… ») → pas de fuite du system prompt, réponse refusée ou fallback.
- [ ] Mémoire de conversation : question de suivi qui dépend du contexte précédent → réponse cohérente.
- [ ] Un agent d'une autre organisation → 404 sur `/playground`.

## Phase 5 (P4) — Widget embeddable

- [x] Widget monté en Shadow DOM, isolation CSS vérifiée visuellement (pas de style hérité/fui).
- [x] Flux complet Designer → aperçu live (`postMessage`, < 200 ms) → Publish → widget réel reflète la config.
- [x] Chat SSE + citations + feedback + bloc sources, testés via `/widget-preview` avec une vraie réponse RAG.
- [x] `npm run size` : 4.58 KB brotli / 5 KB budget.
- [x] **8 états visuels du LOT 2** — 2026-10-14 : fermé/tooltip, accueil+suggestions, streaming, citations, feedback, fallback + carte handoff, et mobile plein écran < 480px tous vus en navigateur réel (Chrome DevTools MCP). **Bug réel trouvé et corrigé** : le choix de couleur de texte sur fond accent utilisait un seuil de luminance brut (0.4) au lieu d'un vrai calcul de ratio de contraste — une des 6 couleurs preset (#2F7A4D, le token `--success` du projet) ne passait qu'à 4.47:1 (sous 4.5:1 AA). Corrigé avec un vrai calcul de contraste + le vrai token `on-accent` clair (`#ffffff`) — voir `DECISIONS.md`. Pas encore vu : mode humain (divider « X joined »), quota (« resting »).
- [ ] **Origine non autorisée** → 403, widget ne se monte pas (jamais testé avec un vrai domaine hors liste).
- [ ] **Rate limit** : 21 messages/minute depuis la même IP → 21e refusé.
- [x] **A11y clavier complet** — fait en Phase 9 (P8), voir plus bas (`a11y.spec.ts`).
- [ ] **Rechargement de page** → conversation restaurée depuis `localStorage` + endpoint messages (code existe, non testé).
- [ ] **Navigation privée** (localStorage bloqué) → le widget fonctionne quand même (try/catch présent, non testé en conditions réelles).
- [x] **Contraste auto** — voir ligne ci-dessus (8 états visuels) : bug réel trouvé sur une couleur preset et corrigé.
- [x] `/atelier-lune`/`/ledgerline` : seedés et vérifiés en direct (publicKeys réels, widget répondant avec sceau) — 2026-10-14.
- [x] Page collée dans un site HTML statique externe avec un CSS agressif — `widget-third-party.spec.ts`, passe en live.
- [ ] Upload d'avatar (Vercel Blob) — code écrit, jamais exercé avec un vrai fichier.

## Phase 6 (P5) — Dashboard, conversations, handoff, analytics

- [x] Handoff complet de bout en bout (take over, réponse agent visible dans le widget en direct, resolve) — testé réellement.
- [ ] Parcours complet du wizard (identité → sources → widget → Make it live) dans un vrai navigateur.
- [ ] Liste des agents : métriques affichées correctement, menu kebab (Open/Playground/Copy embed/Delete), tooltip de limite de plan.
- [ ] KPIs analytics vérifiés à la main sur un jeu de 10 conversations réelles (deltas, taux de fallback, satisfaction).
- [ ] Isolation multi-org : un membre d'une autre org ne voit aucune conversation/analytics (403/404).
- [ ] Déclenchement auto du handoff après exactement 2 fallbacks consécutifs (jamais déclenché manuellement en test, seulement le take-over manuel).
- [ ] Email visiteur capturé visible dans le panneau contexte (jamais testé avec un vrai email saisi côté widget).
- [ ] Filtres conversations (negative feedback, unanswered) et période 7/30/90 — jamais exercés avec des données variées.
- [ ] Recherche de messages (debounce) dans l'inbox.

## Phase 7 (P6) — Billing, quotas, API

- [ ] Upgrade Free → Pro réel avec la carte de test Stripe `4242 4242 4242 4242` (jamais testé — nécessite Stripe configuré en mode test : produits, prix, webhook).
- [ ] Rejouer un webhook déjà traité (idempotence `StripeEvent`) — code écrit, jamais exercé avec un vrai event Stripe.
- [ ] Portal : changement de plan Pro ↔ Team, annulation → retombée sur Free.
- [ ] Quota : forcer `messageCount = limit` et vérifier l'état « resting » du widget + bannière dashboard + 429 sur `/api/v1/chat`.
- [ ] Clé API : créée → `curl` avec `Authorization: Bearer sk_live_…` sur `/api/v1/bots` → révoquée → 401.
- [ ] 61 appels/min avec la même clé API → 429 (rate limit jamais déclenché en test).
- [ ] Invitation par lien acceptée par un 2e compte réel ; limite de membres respectée (actuellement seulement vérifiée côté client, pas de garde-fou serveur sur `inviteMember`).
- [ ] Suppression d'organisation et de compte — jamais exécutée (chemin code relu, pas déclenché).
- [ ] Grep `trial|SLA|VPC|webhooks?` sur les namespaces `Billing`/réglages — jamais exécuté.
- [ ] Rate limit sur `/forgot-password` — pas implémenté (voir `DECISIONS.md`).

## Phase 8 (P7) — Landing, démo, docs

- [x] **Exécution réelle du seed** — 2026-10-14, lancé deux fois (le 2e après correction du contenu `citations.md`). ~107 conversations Atelier Lune + 90 Ledgerline générées. `NEXT_PUBLIC_LANDING_BOT_KEY` corrigé dans `.env.local` (était vide — bug réel).
- [x] Widget réel sur la landing répondant à une question sur Sigilla avec sceaux vers `/docs/*` — `landing.spec.ts`, passe en live. **Bug réel trouvé et corrigé** : la question suggérée par l'UI elle-même (« How do citations work? ») tombait en fallback (score 0.717 sous le seuil 0.75) car l'explication des citations était diluée dans un chunk multi-sujets — scindé en doc dédié, score maintenant 0.771.
- [x] `/demo` → dashboard Maison Démo en 1 clic, bandeau lecture seule visible — `demo.spec.ts`, passe en live.
- [x] `/atelier-lune` et `/ledgerline` : seedés avec vraies publicKeys, widget réel testé en direct (voir plus haut).
- [ ] **Garde-fou démo incomplet** (voir `DECISIONS.md`) : les routes Better Auth natives (invite membre, changement de rôle, renommage d'organisation, changement de mot de passe, suppression de compte) contournent le blocage `isDemo` — seules les routes API propres à Sigilla sont protégées. À corriger avant d'exposer la démo publiquement.
- [x] Les toasts d'erreur du wizard (create/make-live) affichaient un message générique plutôt que « The demo is read-only. » renvoyé par le serveur — **bug réel trouvé (via `demo.spec.ts`) et corrigé** dans `agent-wizard.tsx`. D'autres emplacements (`settings-tabs.tsx`, `agent-settings-form.tsx`, `agent-card.tsx`, `widget-designer.tsx`) ont le même pattern mais n'ont pas été exercés en live cette session — à vérifier au cas par cas plus tard.
- [x] Lighthouse (landing, desktop et mobile) — 100/100/100, voir Phase 9 (P8).
- [ ] OG image/sitemap/robots — jamais validés sur un outil externe (opengraph.xyz, etc.).
- [ ] **FR non fait pour le marketing** (voir `DECISIONS.md`) : landing, pricing, docs (UI autour du contenu) sont en anglais codé en dur, pas dans `messages/*.json`. Le contenu des docs lui-même est EN-only par spec, mais l'UI autour (nav, labels) devrait être traduisible.

## Phase 9 (P8) — Qualité, sécurité, performance

- [x] **`journey.spec.ts`** — écrit et passe en live (2026-10-14). **3 bugs réels trouvés et corrigés en le faisant tourner** : `sources/upload` et `avatar` résolvaient l'org via `session.activeOrganizationId` brut au lieu de `requireOrgApi()` (404 sur toute 1ère upload d'un compte neuf) ; le CSP `connect-src` pour `https://vercel.com/api/blob` n'avait pas le `/` final donc ne matchait jamais le vrai chemin de requête (bloquait tout upload PDF, dev et prod) ; `components/ui/button.tsx` passait un enfant `null` en plus à Radix `Slot` sur les boutons `asChild`, le faisant planter.
- [ ] **`billing.spec.ts`** — écrit, `test.skip` actif (Stripe non configuré). Laissé de côté pour cette phase (décision utilisateur, 2026-10-14) — voir mémoire `project_sigilla_stripe_setup`.
- [x] **`demo.spec.ts`** — passe en live.
- [x] **`landing.spec.ts`** — passe en live.
- [x] **Lighthouse** — 100/100/100 (a11y/best practices/SEO) sur landing (desktop+mobile), pricing, docs, sign-in, sign-up, terms, `/agents`, détail agent, analytics, conversations, settings, widget designer. Perf non mesurée (serveur dev non représentatif ; à refaire sur un vrai déploiement).
- [x] **Audit WCAG** : dashboard (agents, analytics, conversations, settings, widget designer, sources) + 2 nouveaux états widget (fallback/handoff, mobile plein écran). **10 bugs réels trouvés et corrigés** — voir `DECISIONS.md` pour le détail complet (heading-order ×2, touch target trop petit, `<main>` manquant, liens non distinguables, comboboxes sans nom accessible, switches sans nom accessible, input couleur sans label, hydration mismatch ×2, lien cassé `/agents//sources`, contraste du bouton handoff sur une couleur preset). Pas fait : lecteur d'écran réel (VoiceOver/NVDA).
- [ ] **Injection indirecte** (contenu crawlé contenant la charge malveillante, pas juste la question du visiteur) — seule l'injection directe a été testée.
- [ ] **`scripts/audit-tenancy.ts`** — pas écrit ; l'isolation a été vérifiée par revue manuelle ciblée + 1 test e2e sur 1 agent, pas un balayage systématique des ~34 routes.
- [ ] **CI GitHub Actions** (`.github/workflows/ci.yml`) — écrit, jamais déclenché pour de vrai (se déclenchera à l'ouverture de la PR).
- [ ] **`QA.md`** — matrice créée (16 parcours × dark/light × EN/FR × desktop/mobile), volontairement laissée **non remplie** pour que l'utilisateur la fasse lui-même.
- [ ] **securityheaders.com** — CSP/HSTS ajoutés et vérifiés sans erreur console en local, jamais validés sur l'outil externe (nécessite un déploiement public).
- [ ] Couverture Vitest réelle de `lib/**` : ~27%, pas les 70% visés (voir `DECISIONS.md` pour la liste des modules couverts vs non couverts).

---

*Phases suivantes (déploiement, portfolio…) : ajouter une section ici à la clôture de chaque phase, avant de passer à la suivante — ne pas attendre la fin du projet pour commencer à lister.*
