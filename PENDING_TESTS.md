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

---

*Phases suivantes (dashboard, billing, landing…) : ajouter une section ici à la clôture de chaque phase, avant de passer à la suivante — ne pas attendre la fin du projet pour commencer à lister.*
