import { describe, it, expect, vi } from "vitest";

const rows: { count: number; resetAt: Date }[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(async () => [rows[rows.length - 1]]),
    $executeRaw: vi.fn(async () => undefined),
  },
}));

describe("rateLimit", () => {
  it("stays ok up to the limit, then reports a positive retryAfterSeconds", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const resetAt = new Date(Date.now() + 60_000);
    for (let i = 1; i <= 5; i++) {
      rows.push({ count: i, resetAt });
      const res = await rateLimit("k", 5, 60_000);
      expect(res.ok).toBe(true);
    }
    rows.push({ count: 6, resetAt });
    const over = await rateLimit("k", 5, 60_000);
    expect(over.ok).toBe(false);
    expect(over.retryAfterSeconds).toBeGreaterThan(0);
  });
});
