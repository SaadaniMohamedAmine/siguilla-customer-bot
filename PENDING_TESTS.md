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
- [ ] **8 états visuels du LOT 2** — seuls fermé/tooltip, accueil+suggestions, streaming, citations et feedback ont été vus. Pas testés : fallback + carte handoff, mode humain (divider « X joined »), quota (« resting »), mobile plein écran < 480px.
- [ ] **Origine non autorisée** → 403, widget ne se monte pas (jamais testé avec un vrai domaine hors liste).
- [ ] **Rate limit** : 21 messages/minute depuis la même IP → 21e refusé.
- [ ] **A11y clavier complet** : Tab → launcher, Entrée ouvre, focus piégé, Échap ferme et rend le focus (le code existe, non testé interactivement — testé uniquement via `element.click()` direct, pas au clavier réel).
- [ ] **Rechargement de page** → conversation restaurée depuis `localStorage` + endpoint messages (code existe, non testé).
- [ ] **Navigation privée** (localStorage bloqué) → le widget fonctionne quand même (try/catch présent, non testé en conditions réelles).
- [ ] **Contraste auto** sur une couleur claire (ex. `#E0B05C`) → texte en encre foncée (seules des couleurs sombres ont été testées).
- [ ] `/atelier-lune` : jamais ouverte avec une vraie clé publique (`NEXT_PUBLIC_LANDING_BOT_KEY` non définie en dev) — layout/illustration visuels non vérifiés dans un navigateur.
- [ ] Page collée dans un site HTML statique externe (`npx serve` sur un autre port) avec un CSS agressif (`* { font-family: Comic Sans; color: red }`) pour prouver l'isolation Shadow DOM en conditions réelles (testé seulement en same-origin jusqu'ici).
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

- [ ] **Exécution réelle du seed** — jamais lancé (nécessite Stripe/Gemini configurés + `.env.local` pointant vers la base de prod). Vérifier la durée (<3 min visée), le nombre réel de conversations créées, et que `NEXT_PUBLIC_LANDING_BOT_KEY` fonctionne une fois copié sur Vercel.
- [ ] Widget réel sur la landing répondant à une question sur Sigilla avec sceaux vers `/docs/*`.
- [ ] `/demo` → dashboard Maison Démo en 1 clic, bandeau lecture seule visible, badge handoff « 1 » dans la sidebar.
- [ ] `/atelier-lune` : « Do your candles ship to Switzerland? » (réponse avec sceau) et « Do you accept Klarna? » (fallback + carte handoff) jamais testés en navigateur réel.
- [ ] **Garde-fou démo incomplet** (voir `DECISIONS.md`) : les routes Better Auth natives (invite membre, changement de rôle, renommage d'organisation, changement de mot de passe, suppression de compte) contournent le blocage `isDemo` — seules les routes API propres à Sigilla sont protégées. À corriger avant d'exposer la démo publiquement.
- [ ] La plupart des toasts d'erreur affichent un message générique plutôt que « The demo is read-only. » renvoyé par le serveur.
- [ ] Lighthouse (mobile, landing) — jamais mesuré.
- [ ] OG image/sitemap/robots — jamais validés sur un outil externe (opengraph.xyz, etc.).
- [ ] **FR non fait pour le marketing** (voir `DECISIONS.md`) : landing, pricing, docs (UI autour du contenu) sont en anglais codé en dur, pas dans `messages/*.json`. Le contenu des docs lui-même est EN-only par spec, mais l'UI autour (nav, labels) devrait être traduisible.

## Phase 9 (P8) — Qualité, sécurité, performance

- [ ] **`journey.spec.ts`** (parcours complet sign-up → wizard → upload PDF → widget → handoff → resolve) — jamais écrit, nécessite `tests/fixtures/atelier-shipping.pdf` (jamais généré) et un timeout confortable (90s+).
- [ ] **`billing.spec.ts`** (upgrade réel via Stripe Checkout test) — nécessite Stripe configuré (voir mémoire `project_sigilla_stripe_setup`).
- [ ] **`demo.spec.ts`** (`/demo` → dashboard sans formulaire, bandeau lecture seule) — nécessite le seed exécuté (jamais fait).
- [ ] **`landing.spec.ts`** (widget réel de la landing répond avec un sceau) — nécessite `NEXT_PUBLIC_LANDING_BOT_KEY` + le seed.
- [ ] **Lighthouse** (mobile, `/`, `/pricing`, `/docs/getting-started`, `/sign-in`) — jamais mesuré, objectif ≥95/95/95/100.
- [ ] **Audit WCAG complet** : dashboard entier (pas juste 4 pages publiques), les 8 états du widget, lecteur d'écran réel (VoiceOver/NVDA, 10 min).
- [ ] **Injection indirecte** (contenu crawlé contenant la charge malveillante, pas juste la question du visiteur) — seule l'injection directe a été testée.
- [ ] **`scripts/audit-tenancy.ts`** — pas écrit ; l'isolation a été vérifiée par revue manuelle ciblée + 1 test e2e sur 1 agent, pas un balayage systématique des ~34 routes.
- [ ] **CI GitHub Actions** (`.github/workflows/ci.yml`) — écrit, jamais déclenché pour de vrai (nécessite un push vers le remote).
- [ ] **`QA.md`** — matrice créée (16 parcours × dark/light × EN/FR × desktop/mobile), entièrement **non remplie**.
- [ ] **securityheaders.com** — CSP/HSTS ajoutés et vérifiés sans erreur console en local, jamais validés sur l'outil externe (nécessite un déploiement public).
- [ ] Couverture Vitest réelle de `lib/**` : ~27%, pas les 70% visés (voir `DECISIONS.md` pour la liste des modules couverts vs non couverts).

---

*Phases suivantes (déploiement, portfolio…) : ajouter une section ici à la clôture de chaque phase, avant de passer à la suivante — ne pas attendre la fin du projet pour commencer à lister.*
