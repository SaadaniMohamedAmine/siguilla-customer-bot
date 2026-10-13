# Sigilla — DECISIONS.md

> Écarts par rapport aux fichiers de délégation, et choix pris quand un point n'était pas couvert. Un paragraphe par décision, la plus récente en haut.

---

## Phase 3 (P2) — Données et ingestion — 2026-10-13

**Minimal CRUD Chatbot + page Sources ajoutés, hors spec stricte mais explicitement autorisés par le fichier de délégation** (§1 : « un CRUD Chatbot minimal pour pouvoir rattacher des sources »).
`/agents` liste désormais les vrais agents de l'organisation (au lieu d'un état vide statique) et un dialogue « Create an agent » (nom uniquement) crée l'agent via `POST /api/chatbots` puis redirige vers sa page Sources. Le wizard complet en 3 étapes reste prévu pour la Phase 5 ; ceci n'est qu'un strict minimum pour pouvoir tester l'ingestion dès maintenant.

**Test de bout en bout — succès complet (2026-10-13, après ajout de `GROQ_API_KEY` et `GEMINI_API_KEY`) :** connexion `test1@sigilla.app` → `POST /api/chatbots` → `POST /api/chatbots/:id/sources` avec `{ type: "url", url: "https://example.com" }` → statut `queued` → `ready` en ~5 s, `pagesCount: 1`, `chunksCount: 1`. Vérifié en base : le chunk a son `sourceTitle`/`sourceUrl` et un `embedding` non-null (vecteur 768d stocké dans pgvector). Pipeline complet (crawl → chunk → embed Gemini → stockage pgvector) validé de bout en bout.
Premier essai (avant les clés) : statut `queued` → `failed` / `error: "processing_failed"`, comme attendu — confirmait que la gestion d'erreur à l'étape embedding est propre (pas de crash).

**Vercel Blob store créé via le CLI** (`vercel blob create-store siguilla-customer-bot --access public`) et lié automatiquement au projet — `BLOB_READ_WRITE_TOKEN` posé sur Development/Preview/Production sans action manuelle sur le dashboard.

**Upload PDF — succès complet (2026-10-13).** PDF minimal généré à la main (texte brut dans un flux PDF valide), uploadé directement sur Blob, ingéré via `POST /api/chatbots/:id/sources` → `status: "ready"`, `pagesCount: 1`, `chunksCount: 1`. Un premier essai avec un texte trop court (33 caractères, sous le seuil de 40 de `chunkSections`) a donné `status: "failed"` / `error: "no_content"` — confirme que le garde-fou anti-contenu-vide fonctionne proprement.

**Connecteur Notion — succès complet de bout en bout (2026-10-13).** Intégration publique créée par l'utilisateur sur notion.so/my-integrations (type OAuth, 2 redirect URIs : local + prod). Flow entier vérifié avec un vrai compte Notion :
1. `GET /api/notion/connect` → redirection Notion correcte → écran de consentement → sélection de page → callback → `?notion=connected`.
2. En base : `NotionConnection` créée avec le bon `workspaceName`, token stocké **chiffré** (format `iv:tag:ciphertext`, jamais le `secret_...` en clair).
3. `GET /api/notion/pages` déchiffre le token et interroge l'API Notion avec succès → retrouve la page partagée.
4. Ingestion d'une page Notion réelle (après passage temporaire de l'org de test en plan `pro` pour contourner le garde-fou `notion_requires_pro` — remis en `free` après le test) → `pagesCount: 1`, statut `failed`/`no_content` **attendu** car la page Notion de test était vide (juste des boutons de template, aucun bloc de texte). Le garde-fou anti-contenu-vide s'est déclenché correctement ; le mécanisme (fetch → `blocksToMarkdown` → chunking) est validé jusqu'au bout.

Les 3 chemins d'ingestion (URL, PDF, Notion) sont maintenant tous vérifiés de bout en bout avec de vrais services externes (Groq, Gemini, Vercel Blob, Notion).

**`as Prisma.InputJsonValue` ajouté sur les champs JSON (`cursor`, `progress`) dans `lib/ingestion/pipeline.ts`.**
TypeScript n'arrivait pas à inférer correctement le type attendu par Prisma pour un objet construit par spread (`{ ...cursor, ...patch, keepHashes: [...keep], pagesDone }`) — erreur `Record<string, unknown>` non assignable à `JsonNull | InputJsonValue`. Cast explicite, comportement runtime inchangé.

**Intégration publique Notion : pas encore créée.** Le code OAuth (connect/callback/pages/disconnect) est complet et prêt, mais `NOTION_CLIENT_ID`/`NOTION_CLIENT_SECRET` sont vides — le connecteur Notion ne pourra être testé qu'une fois l'intégration créée sur notion.so/my-integrations.

---

## Phase 2 (P1) — Fondations, design system, auth — 2026-10-13

**`prisma` pinné sur `7.10.0`, pas sur le tag npm `latest`.**
Le tag `latest` de `prisma` pointe vers `8.0.0-rc.22`, une release candidate (pré-version), malgré le tag. La vraie dernière version stable est `7.10.0` (tag `prev`). `@prisma/client` et `@prisma/adapter-pg` sont alignés sur la même version. Conforme à la règle « jamais de beta/canary » du PRD et cohérent avec Excerpta (Prisma 7).

**`NotionIcon` n'existe pas dans `@hugeicons/core-free-icons` → remplacé par `Notion01Icon`.**
Tous les autres noms d'icônes de l'audit (§2) ont été vérifiés un par un contre les déclarations du package installé et sont corrects.

**`npm audit` signale 9 vulnérabilités « high », toutes dans des outils de dev, aucune touchée :**
- `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` (DoS sur patterns imbriqués). Le correctif automatique rétrograderait `eslint-config-next` vers 14.2.35, contredisant la règle « dernières versions stables ».
- `prisma CLI → @prisma/config → deepmerge-ts` et `→ mysql2` (le CLI Prisma embarque un connecteur MySQL qu'on n'utilise jamais, 100 % Postgres/Neon). Le correctif rétrograderait vers `prisma@6.19.3`.
Les deux chaînes sont dev-only (jamais exécutées en prod/runtime). Laissées telles quelles, à surveiller si Prisma/Next publient un correctif amont.

**`next.config.ts` : retrait des flags expérimentaux `cacheComponents` et `partialPrefetching`** (présents par défaut dans le scaffold généré par `create-next-app` sur Next 16.4).
Ils cassaient le prerendering de `/_not-found` : `Error: Route "/_not-found": Next.js encountered uncached or runtime data during prerendering` — provoqué par l'accès à `cookies()` dans `app/layout.tsx` (résolution de la locale next-intl) hors `<Suspense>`. Le projet n'a pas besoin de ces optimisations expérimentales pour l'instant (app largement dynamique, authentifiée) ; retirés plutôt que de restructurer le layout racine autour d'eux.

**`lib/session.ts` : fallback sur la première organisation de l'utilisateur quand `session.activeOrganizationId` est `null`.**
Race condition réelle constatée en testant le flow d'inscription de bout en bout contre la base Neon live : le hook `databaseHooks.user.create.after` (création de l'organisation personnelle) et `databaseHooks.session.create.before` (lecture de cette organisation pour activer la session) ne sont pas garantis dans un ordre qui laisse le temps au premier de se terminer avant le second — sur le tout premier sign-up, `activeOrganizationId` restait `null` alors que l'organisation et le membership existaient bien en base. `resolveActiveMembership()` (dans `lib/session.ts`) retombe sur `prisma.member.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } })` si l'id actif est absent ou invalide, utilisé par `requireOrgPage` et `requireOrgApi`. Comportement vérifié : nouvel utilisateur → `/agents` répond 200 (état vide) dès la première requête après inscription, sans session.activeOrganizationId posé.

**`apiKey({ references: "organization" })` accepté tel quel par la version installée (`@better-auth/api-key@1.7.7`).**
Le schéma généré expose un champ générique `referenceId` (pas un champ `organizationId` dédié) sur le modèle `Apikey` — c'est le comportement normal du plugin, `referenceId` portera l'id de l'organisation au moment de la création de la clé (Phase 6). Aucun écart à gérer.

**Favicon : seules les tailles 32×32 (`app/icon.tsx`) et 180×180 (`app/apple-icon.tsx`) sont générées, pas de variante 512×512 ni d'ICO 16×16 dédié, et la police n'est pas Instrument Serif (la lettre « S » est rendue en `Georgia, serif`).**
Choix de vitesse (priorité donnée à l'auth/app shell plutôt qu'à l'embarquement d'un fichier de police OFL via `fs.readFile` dans une route `ImageResponse`). Le rendu reste conforme à la charte (fond `#9E2F45`, lettre `#F3ECE6`, coin arrondi 22 %) ; la police dédiée Instrument Serif + les tailles additionnelles sont à reprendre avant la publication finale (Phase 11, README/portfolio).

**`page-loader.tsx` (loader animé avec trait bordeaux, LOT 5) non implémenté.**
Reporté — purement cosmétique, n'affecte aucun critère d'acceptation de la Phase 1.

**Breadcrumb de l'app shell non implémenté.**
Il n'y a pour l'instant qu'un seul niveau de page par section (`/agents`, `/conversations`…), donc rien à fil d'Ariane. Sera ajouté avec les sous-pages d'agent (Phase 5).

**Google/GitHub OAuth : configuré et vérifié en local (2026-10-13).**
Apps OAuth créées par l'utilisateur (Google Cloud Console, GitHub Developer Settings), clés renseignées dans `.env.local`. Vérifié : `POST /api/auth/sign-in/social` pour les deux providers renvoie une redirection valide (`accounts.google.com` / `github.com/login/oauth/authorize`) avec le bon `client_id` et `redirect_uri`. Le callback complet (retour après consentement) n'a pas été testé avec un vrai compte — nécessite un navigateur.
Restant à faire : ajouter les mêmes clés dans les variables d'environnement Vercel (projet en prod), et ajouter l'URI de redirection prod (`https://siguilla-customer-bot.vercel.app/api/auth/callback/google` et `.../github`) dans les consoles Google/GitHub — GitHub n'autorise qu'une seule callback URL par app, donc soit on la remplace par l'URL prod, soit on crée une 2e app GitHub dédiée à la prod.

**Test de bout en bout effectué manuellement (pas encore de suite Playwright — Phase 8) :**
`npm run build && npm run start`, puis via `curl` : inscription (`POST /api/auth/sign-up/email`) → vérification en base (Prisma) que l'organisation personnelle et le membership `owner` sont créés → `GET /agents` avec le cookie de session → 200, état vide affiché → `GET /agents` sans cookie → 307 vers `/sign-in?redirect=%2Fagents`. Les comptes de test (`qa-test@…`, `qa-flow@…`, `qa-final@…`) restent en base Neon (environnement de dev, pas de données sensibles) ; à nettoyer avant le seed de démo (Phase 7).
