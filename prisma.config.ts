// prisma.config.ts
//
// Prisma 7 moved connection URLs out of schema.prisma and into this file
// (the CLI no longer auto-loads .env files, hence the explicit dotenv import).
// The runtime PrismaClient (lib/db.ts) still needs its own driver adapter —
// this file only configures the Prisma CLI (generate/db push/studio).
// Plain "dotenv/config" only loads .env — this project follows Next.js's own
// convention of keeping local secrets in .env.local instead, so it has to be
// pointed at explicitly.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

// Plain process.env read (not the `env()` helper) on purpose: `env()` throws
// immediately if DATABASE_URL is unset, which would break `prisma generate`
// (and therefore every `npm install`, via postinstall) before Neon is wired
// up. `prisma generate` doesn't need a live connection string; `db push` /
// `studio` do, and DATABASE_URL will be set in .env.local by then.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
