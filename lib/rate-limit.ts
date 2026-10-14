import { prisma } from "@/lib/db";

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/** Fenêtre fixe atomique. Purge paresseuse des lignes expirées (1 fois sur 50) — aucun cron. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + (${windowMs} * interval '1 millisecond'))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN now() + (${windowMs} * interval '1 millisecond') ELSE "RateLimitBucket"."resetAt" END
    RETURNING "count", "resetAt"`;
  if (Math.random() < 0.02) {
    prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < now() - interval '1 hour'`.catch(() => {});
  }
  const { count, resetAt } = rows[0];
  return count <= limit
    ? { ok: true, retryAfterSeconds: 0 }
    : { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)) };
}
