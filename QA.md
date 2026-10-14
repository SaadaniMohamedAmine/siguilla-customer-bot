# Sigilla — QA.md

> Matrice de QA manuelle (Phase 9/P8 §3.10). Remplir ✅ / ❌ + note pour chaque ligne, en **dark & light**, **EN & FR**, **desktop (1440) & mobile (390)**. Tout ❌ doit être corrigé avant de cocher la phase comme faite. État actuel : **non rempli** (voir `DECISIONS.md` — pas fait faute de temps cette session, seules quelques vérifications ponctuelles ont été faites en cours de route, documentées phase par phase dans `DECISIONS.md`/`PENDING_TESTS.md`).

| # | Parcours | Dark | Light | EN | FR | Desktop | Mobile | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | Landing (toutes sections, widget de la landing) | | | | | | | |
| 2 | Pricing + FAQ | | | | | | | |
| 3 | Docs (navigation, ancres, copier le code) | | | | | | | |
| 4 | Sign-up / Sign-in (email, Google, GitHub) / Forgot / Reset | | | | | | | |
| 5 | Démo en 1 clic + lecture seule | | | | | | | |
| 6 | Wizard 3 étapes | | | | | | | |
| 7 | Sources : PDF, site, Notion, re-sync, suppression, erreurs | | | | | | | |
| 8 | Playground + inspecteur + seuil | | | | | | | |
| 9 | Widget designer + aperçu desktop/mobile + publish | | | | | | | |
| 10 | Widget sur `/atelier-lune` : 8 états | | | | | | | |
| 11 | Conversations : filtres, recherche, take over, reply, resolve, badge | | | | | | | |
| 12 | Analytics : 7/30/90 j, agent, états vides | | | | | | | |
| 13 | Settings : profil, organisation & membres, invitations, billing, API keys, intégrations | | | | | | | |
| 14 | Upgrade / portail Stripe / rétrogradation | | | | | | | |
| 15 | API v1 via `curl` (bots, chat stream/non-stream, conversations, erreurs) | | | | | | | |
| 16 | 404, erreur, états de chargement (skeletons) | | | | | | | |

## Ce qui a déjà été vérifié en direct, hors de cette matrice formelle

Au fil des Phases 4 à 8, plusieurs de ces parcours ont été testés manuellement (navigateur réel, pas juste lecture de code) sans suivre ce tableau précisément — voir `DECISIONS.md` pour le détail de chaque session :
- Widget designer + aperçu live + publish (Phase 5)
- Conversations : take over, reply, resolve, badge (Phase 6)
- Isolation multi-tenant (ligne 15-ish, ici via Playwright — Phase 9)
- Widget sur page tierce, clavier, contraste (Phase 9)

Aucun n'a cependant été passé en revue dans **toutes** les combinaisons dark/light × EN/FR × desktop/mobile que cette matrice demande.
