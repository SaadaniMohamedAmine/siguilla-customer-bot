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

### Smoke test sur `<PROD>` (après le merge de la PR #12, 2026-10-19, fenêtre privée, testeur : l'utilisateur)
| ID | Statut | Preuve | Bug trouvé / correctif |
|---|---|---|---|
| B11 | ✅ | splash vu au 1er chargement (logo + barre), absent au rechargement F5, sans clignotement | — |
| B15 (landing) | ✅ | Console : « No issues » sur la landing | — |
| B1, B2 | ✅ | hero et maquette Atelier Lune OK (conversation jouée, « Sealed by 2 sources ») | — |
| B5 / V3 (valeur affichée) | ✅ | carte « Under 5 KB » : « 4.95 KB — limit 5 KB » | barre de progression restée à 90 % → voir remarque 1 |
| B7 | ✅ | widget de la landing : réponse « How do citations work? » avec sceaux numérotés, « Scellé par 1 source · 1·Citations », 👍 👎 ; requête `chat` 200 en 2,30 s | — |
| BLK-9 (/config) | ✅ | requête `config?lang=fr` 200 (1,1 kB, 94 ms) ; libellés « En ligne », « Utile ? », « Scellé par 1 source » (avec `{n}` remplacé) reçus du serveur | — |
| Session anonyme | ✅ | fenêtre privée vierge : barre de navigation « Sign in » + « Start free » (le « Open dashboard » vu avant venait d'une session déjà ouverte dans l'ancienne fenêtre) | aucun bug |

## Remarques et retouches à grouper (non bloquantes, pour la prochaine PR)
1. **Barre « 4.95 KB » de la landing à 90 %** au lieu de ~99 % : largeur écrite en dur (`group-data-[inview=true]:w-[90%]`, `components/marketing/feature-visuals.tsx`), reste de l'ancienne valeur 4,5/5. Cosmétique, 1 ligne. *Priorité : basse.*
2. **Widget mélangé FR/EN** quand le navigateur est en français et le site en anglais : la langue des libellés suit `navigator.language`, le message d'accueil et le placeholder viennent de la config de l'agent (en anglais). Comportement d'origine (test S3), à décider. *Priorité : basse.*
3. **⚠ 4 avertissements + 1 message dans la console DevTools** apparus pendant le test, après un « No issues » initial : **ignorés sur décision de l'utilisateur** (contenu jamais relevé, aucune erreur rouge signalée). *Priorité : aucune.*
4. **BLK-4, nettoyage de la prod (avant de rendre le dépôt public)** : supprimer `test1@`, `test2@`, `test3@sigilla.app` de la base de prod ; faire lire les identifiants des e2e (`billing.spec.ts`, `tenancy.spec.ts`) et du `seed.ts` depuis des variables d'environnement. *Priorité : haute avant publication.*
5. **Reste à re-tester sur la prod** : Test 2 (démo en lecture seule : H4, H5), Test 3 (compte normal, F12), Test 4 (`/atelier-lune`, L-series), Test 5 (crawl : J5, J8).

## Mesures
- Widget : **4,95 kB gzip** (limite 5 kB, marge ~50 o) — était 5,61 kB gzip / 4,89 kB brotli
- Lighthouse mobile `/` : — / — / — / —
- Couverture lib/rag, lib/ingestion, lib/billing, lib/public : — %
- Isolation : — routes testées, — fuite
- Tests unitaires : 198 (50 au départ de la phase)
