// prisma/seed.ts
//
// Dev-only test accounts with known passwords (see TEST_USERS.md). Idempotent —
// safe to run again, skips any user that already exists. Goes through Better
// Auth's own sign-up API (not a raw Prisma insert) so passwords are hashed
// exactly like a real sign-up, and the personal-organization hook runs too.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const TEST_USERS = [
  { name: "Test One", email: "test1@sigilla.app", password: "Test1Sigilla!" },
  { name: "Test Two", email: "test2@sigilla.app", password: "Test2Sigilla!" },
  { name: "Test Three", email: "test3@sigilla.app", password: "Test3Sigilla!" },
];

async function main() {
  // Import après le chargement de .env.local : lib/db.ts lit DATABASE_URL au chargement du module.
  const { auth } = await import("@/lib/auth");
  const { prisma } = await import("@/lib/db");

  try {
    for (const u of TEST_USERS) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        console.log(`[seed] ${u.email} already exists, skipping`);
        continue;
      }
      await auth.api.signUpEmail({ body: { name: u.name, email: u.email, password: u.password } });
      console.log(`[seed] created ${u.email}`);
    }
    console.log("[seed] done");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
