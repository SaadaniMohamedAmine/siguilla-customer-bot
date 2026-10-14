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

- [ ] **Pipeline d'ingestion multi-chunks de bout en bout** — bloqué le 2026-10-14 par l'épuisement du quota gratuit Gemini (`embed_content_free_tier_requests`, ~100/min) pendant le diagnostic d'un bug (voir `DECISIONS.md`). Le fix lui-même est prouvé au niveau SDK (10→10, 50→50 embeddings), mais le pipeline complet (ingestion réelle → statut `ready`, chunks > 1, aucun embedding null) doit être reconfirmé une fois le quota reparti. **Piège à éviter** : ne pas re-tester via des scripts qui rappellent l'API en boucle — `withRetry()` retente 4× sur un 429, donc chaque script de "vérification" consomme lui-même le quota et repousse la fenêtre.
- [ ] **Question réelle dans le Playground** (navigateur) sur un agent avec de vraies sources → réponse citée correctement, sceau cliquable, `SealedBy` avec les bonnes sources.
- [ ] **Question hors sujet** → fallback déclenché, **aucun appel LLM** (vérifiable via les logs — le score sous le seuil doit court-circuiter avant `streamAnswer`).
- [ ] **`handoffSuggested` après 2 fallbacks consécutifs** sur la même conversation.
- [ ] Injection de prompt (« ignore previous instructions… ») → pas de fuite du system prompt, réponse refusée ou fallback.
- [ ] Mémoire de conversation : question de suivi qui dépend du contexte précédent → réponse cohérente.
- [ ] Un agent d'une autre organisation → 404 sur `/playground`.

---

*Phases suivantes (widget, dashboard, billing, landing…) : ajouter une section ici à la clôture de chaque phase, avant de passer à la suivante — ne pas attendre la fin du projet pour commencer à lister.*
