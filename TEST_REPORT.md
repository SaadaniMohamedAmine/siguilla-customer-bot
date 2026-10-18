# Sigilla — TEST_REPORT.md

**Verdict : NO-GO (campagne en cours)** — 2026-10-18 — P0 0/0 · P1 0/0 · P2 0/0

> Légende : ✅ vérifié sur `<PROD>` · 🟡 code fait, **re-test sur `<PROD>` en attente** · ⏳ à faire · ❌ échec

## Bloquants (§2)
Branche `fix-phase-9b-blockers`. Preuve actuelle : `npm run check` vert (198 tests unitaires), jamais testé sur `<PROD>`.

| ID | Statut | Correctif (fichier, commit) | Re-test |
|---|---|---|---|
| BLK-1 Garde-fou démo (Better Auth) | 🟡 | `lib/demo-guard.ts`, `lib/auth.ts` — 7937fc0 | H5 |
| BLK-2 SSRF crawler | 🟡 | `lib/ingestion/safe-url.ts`, `crawler.ts`, `sources/route.ts` — 81b953b | J8, J5 (le crawl d'un vrai site doit toujours marcher) |
| BLK-3 Open redirect | 🟡 | `lib/safe-redirect.ts`, `sign-in/page.tsx` — 1b05cac | F12 |
| BLK-4 Mots de passe de test dans Git | 🟡 | `.gitignore`, `TEST_USERS.md` retiré — 81d04cb. **Reste** : mots de passe aussi dans `seed.ts`, `billing.spec.ts`, `tenancy.spec.ts` + historique → supprimer test1-3 de la prod | W4, §6.1 |
| BLK-5 Limite de membres côté serveur | 🟡 | `lib/billing/seats.ts`, `lib/auth.ts` — 063fc67 | G7 |
| BLK-6 Blobs orphelins (suppression d'agent) | 🟡 | `lib/blob-cleanup.ts`, routes chatbots/sources, `lib/account.ts` — 9474eb4. Script `scripts/find-orphan-blobs.ts` **pas encore exécuté** | I8, §6.1 |
| BLK-7 Rate limit mot de passe oublié / connexion | 🟡 | `lib/auth-rate-limit.ts`, `lib/auth.ts` — 0b571ca | F10 |
| BLK-8 Toasts d'erreur génériques | 🟡 | `lib/api-errors.ts`, `lib/use-api-error.ts`, 7 composants — f7501e9 | H4, I6, G7 |
| BLK-9 Widget < 5 KB (gzip) | 🟡 | `size-limit` gzip, `lib/widget/runtime.ts`, `widget/src/index.ts` — 0c41285 | B5, V3, B7, L2, L3, L16, M1, S3 |
| BLK-10 Splash une fois par session | 🟡 | `lib/splash.ts`, `splash-screen.tsx`, `layout.tsx` — c00c939 | B11 |

## Environnement (§1)
| ID | Statut | Note |
|---|---|---|
| ENV-1 Branche Neon `dev` | ⏳ | |
| ENV-2 Stripe test (prod) | ⏳ | dashboard Stripe jamais configuré |
| ENV-3 Comptes de test A/B/C + OAuth | ⏳ | prévoir aussi : e2e `tenancy`/`billing` à faire lire leurs identifiants depuis l'environnement |
| ENV-4 Outils | ⏳ | |
| ENV-5 Fixtures | ⏳ | |
| ENV-6 Ce fichier | ✅ | créé le 2026-10-18 |

## Résultats
| ID | Statut | Preuve | Bug trouvé / correctif |
|---|---|---|---|
| A1 | ✅ (local) | `npm run check` : lint 0 erreur, typecheck OK, 198 tests, widget 4,95 kB gzip | — |
| A2 | ✅ (local) | `design-lint.sh` : aucun échec | — |
| B11 (partiel) | 🟡 | serveur de dev local, 4 `curl` : `/` sans cookie → splash présent ; `/` avec `sg_splash=1` → absent ; `/atelier-lune` → absent ; `/pricing` sans cookie → présent | — |
| J8 (partiel) | 🟡 | script jetable, vrai réseau : `localtest.me` (vrai domaine → 127.0.0.1), `169.254.169.254`, `localhost` → `invalid_url` ; `example.com` crawlé normalement | — |

## Mesures
- Widget : **4,95 kB gzip** (limite 5 kB, marge ~50 o) — était 5,61 kB gzip / 4,89 kB brotli
- Lighthouse mobile `/` : — / — / — / —
- Couverture lib/rag, lib/ingestion, lib/billing, lib/public : — %
- Isolation : — routes testées, — fuite
- Tests unitaires : 198 (50 au départ de la phase)
