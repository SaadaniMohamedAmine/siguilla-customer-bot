# Comptes de test (dev)

> Créés par `npm run db:seed` (`prisma/seed.ts`). Comme dev et prod partagent la même base Neon, ces comptes sont utilisables aussi bien sur `localhost:3000` que sur `https://siguilla-customer-bot.vercel.app`.

| Email | Mot de passe |
|---|---|
| test1@sigilla.app | Test1Sigilla! |
| test2@sigilla.app | Test2Sigilla! |
| test3@sigilla.app | Test3Sigilla! |

Chaque compte a sa propre organisation personnelle créée automatiquement (comme à l'inscription normale). Re-lancer `npm run db:seed` est sans danger : les comptes déjà existants sont ignorés.

> Comptes de test uniquement — à supprimer avant le seed de démo final (Phase 7, « Maison Démo »).
