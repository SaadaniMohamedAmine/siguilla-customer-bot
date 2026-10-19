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
| H1 / H7 (démo) | 🟡 bloqué | clic sur « Explore the live demo » → redirection vers `/?demo=busy`, aucune démo ni message (limiteur 10/h/IP de `app/demo/route.ts`). Logs Vercel : `/demo` → `/agents` avait bien fonctionné à 18:52 et 19:11 UTC (déploiement post-merge). Compteur illisible : la base n'est pas joignable depuis le poste (port 5432). À refaire quand la fenêtre est repartie | voir remarques 6 et 7 |
| L1–L6 (`/atelier-lune`) | ✅ | pas de splash (voulu), bandeau « Illustrative brand » ; « Do your candles ship to Switzerland? » → réponse citée (« Scellé par 1 source · 1·Shipping Policy », 👍 👎) ; « Do you accept Klarna ? » → message de repli + carte « Votre email (facultatif) » + bouton « Parler à un humain » (libellés en français : navigateur en français) | message de repli en français pour une question en anglais → remarque 2 |
| F12 (open redirect) | ✅ | `/sign-in?redirect=https://evil.com` puis connexion → URL finale `siguilla-customer-bot.vercel.app/agents` (jamais evil.com). Compte utilisé : `test1@sigilla.app` (« Test One's Org », plan Free) | — |
| F5 / BLK-1 / BLK-7 (non-régression) | ✅ | connexion email OK, dashboard chargé (agents, conversations, analytics, settings dans le menu) : le hook Better Auth et le rate limit ne gênent pas un utilisateur normal | — |
| I6 (partiel, UI) | ✅ | plan Free : « 1 of 1 agents », bouton remplacé par « Upgrade to add more » + carte « Unlock more agents ». Refus serveur (`POST /api/chatbots` → 403 `agents_limit`) non testé | — |
| Session anonyme | ✅ | fenêtre privée vierge : barre de navigation « Sign in » + « Start free » (le « Open dashboard » vu avant venait d'une session déjà ouverte dans l'ancienne fenêtre) | aucun bug |

## Remarques et retouches à grouper (non bloquantes, pour la prochaine PR)
1. **Barre « 4.95 KB » de la landing à 90 %** au lieu de ~99 % : largeur écrite en dur (`group-data-[inview=true]:w-[90%]`, `components/marketing/feature-visuals.tsx`), reste de l'ancienne valeur 4,5/5. Cosmétique, 1 ligne. *Priorité : basse.*
2. **Widget mélangé FR/EN** quand le navigateur est en français et le site en anglais : la langue des libellés suit `navigator.language`, le message d'accueil et le placeholder viennent de la config de l'agent (en anglais). Comportement d'origine (test S3), à décider. Même cause pour le **message de repli** : sur `/atelier-lune`, « Do you accept Klarna ? » (anglais) a reçu « Je n'ai pas de réponse vérifiée à cette question… » en français, car le widget envoie `navigator.language` au serveur, qui choisit le texte d'après lui et non d'après la langue de la question (test K3). *Priorité : basse.*
3. **⚠ 4 avertissements + 1 message dans la console DevTools** apparus pendant le test, après un « No issues » initial : **ignorés sur décision de l'utilisateur** (contenu jamais relevé, aucune erreur rouge signalée). *Priorité : aucune.*
4. **BLK-4, comptes de test — risque accepté par l'utilisateur (2026-10-19) : « pas de problème pour les comptes de test », aucune action prévue.** Constat conservé pour mémoire : le dépôt GitHub est PUBLIC (`gh repo view` : `visibility: PUBLIC`). `test1@sigilla.app` est un compte **actif en production** (connexion réussie pendant le test 3) dont le mot de passe est en clair dans `prisma/seed.ts` et dans `tests/e2e/billing.spec.ts` / `tenancy.spec.ts`, donc lisible par n'importe qui (et dans l'historique Git). À faire : supprimer `test1@`, `test2@`, `test3@sigilla.app` de la prod (ou changer leurs mots de passe) **après** le test 5 qui utilise le compte ; ne plus relancer `db:seed` sur la prod tant que `seed.ts` crée ces comptes ; faire lire les identifiants des e2e et du seed depuis des variables d'environnement (ou ne créer ces comptes qu'hors production). Ces comptes ne contiennent que des données de test ; si le contexte change (vraies données, publication portfolio), reprendre les actions ci-dessus. *Priorité : aucune pour l'instant.*
5. **Reste à re-tester sur la prod** : Test 2 (démo en lecture seule : H4, H5), Test 3 (compte normal, F12), Test 4 (`/atelier-lune`, L-series), Test 5 (crawl : J5, J8).

6. **`/?demo=busy` n'affiche aucun message** : le visiteur retombe sur la landing sans explication (le fichier de délégation, test H7, demande « retour landing avec message »). **Cahier des charges retenu** : (a) la route `/demo` transmet le délai déjà calculé par le limiteur (`retryAfterSeconds`) dans l'URL, ex. `?demo=busy&wait=12` ; (b) la landing lit ce paramètre (composant client avec `Suspense`), affiche un toast **persistant** (fermable, pas d'auto-fermeture) traduit EN/FR, puis nettoie l'URL ; (c) texte honnête, car la limite est **par IP** et non « démo occupée » : « Vous avez atteint la limite d'accès à la démo. Réessayez dans environ N minutes, ou créez un compte gratuit », avec un bouton « Start free » ; alternative à comparer : bannière sous le héros, plus visible qu'un toast en bas à droite. À traiter avec la remarque 7 (relever la limite), pas à la place. *Priorité : moyenne (visible par un recruteur).*
7. **Limiteur de `/demo` serré : 10 accès/heure/IP** (`app/demo/route.ts`). Des visiteurs derrière un même réseau (entreprise, école) se bloquent entre eux, et chaque clic compte, même refusé. À décider : relever la limite (ex. 30/h) et/ou ne compter que les créations de session réussies. *Priorité : moyenne.*
8. **Bruit dans les logs Vercel** : chaque démarrage à froid imprime l'avertissement `pg` « SSL modes 'prefer', 'require'… are aliases for 'verify-full' » (niveau « error » dans Vercel, sans conséquence). Correctif côté Vercel : ajouter `sslmode=verify-full` à `DATABASE_URL` (action de l'utilisateur, aucune ligne de code). *Priorité : basse.*

## Mesures
- Widget : **4,95 kB gzip** (limite 5 kB, marge ~50 o) — était 5,61 kB gzip / 4,89 kB brotli
- Lighthouse mobile `/` : — / — / — / —
- Couverture lib/rag, lib/ingestion, lib/billing, lib/public : — %
- Isolation : — routes testées, — fuite
- Tests unitaires : 198 (50 au départ de la phase)
