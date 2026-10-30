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


## Clôture de la campagne 9B (2026-10-30) — couverture de la matrice

La matrice ci-dessus n'a pas été remplie case par case. La campagne 9B (`TEST_REPORT.md`) a couvert les mêmes parcours avec des familles de tests transversales : **thèmes** sombre et clair (T1, T3), **largeurs** 390 / 768 / 1440 px (T2), **français** relu par l'utilisateur (S, M, N, O, R), accessibilité automatisée axe sombre + clair sur 9 pages (U1), lecteur d'écran (U3, L15), cohérence EN/FR (838 clés en parité).

| # | Parcours | Preuves dans `TEST_REPORT.md` |
|---|---|---|
| 1 | Landing | B, L, T, V (Lighthouse), U |
| 2 | Pricing + FAQ | C, D, S |
| 3 | Docs | D (ancres, D4 : copie des deux blocs de code) |
| 4 | Sign-up / Sign-in / Forgot / Reset | F3, F6, F7, F9 (2026-10-30), F10, F12 |
| 5 | Démo en 1 clic + lecture seule | H, R6 |
| 6 | Wizard | I1 à I5 (2026-10-30) |
| 7 | Sources | J (PDF, site, re-synchronisation), J9 à J11 (Notion, 2026-10-30), I8 |
| 8 | Playground + inspecteur + seuil | K, I1 à I5 |
| 9 | Widget designer + aperçu + publication | L16, L17 (2026-10-30) |
| 10 | Widget sur `/atelier-lune` : 8 états | L1 à L23 |
| 11 | Conversations : take over, reply | L9 (2026-10-30), H |
| 12 | Analytics | I9, I10, V5 |
| 13 | Settings | F, G, I7 (2026-10-30), J10 |
| 14 | Upgrade / portail / rétrogradation | P1 à P10, passage en Pro de test le 2026-10-30 |
| 15 | API v1 via `curl` | Q |
| 16 | 404, erreur, chargement | B, X |

**Limite connue :** toutes les combinaisons dark/light × EN/FR × desktop/mobile n'ont pas été passées une à une ; le français a été relu en entier par l'utilisateur et le mobile vérifié sur 30 pages à 3 largeurs.
