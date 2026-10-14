import { describe, it, expect, vi } from "vitest";

const org = {
  id: "org1",
  plan: "free",
  messageCount: 5,
  usagePeriodStart: new Date(),
};

vi.mock("@/lib/db", () => ({
  prisma: {
    organization: {
      findUniqueOrThrow: vi.fn(async () => org),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => {
        Object.assign(org, args.data);
        return org;
      }),
    },
    chatbot: { count: vi.fn(async () => 0) },
    dataSource: { count: vi.fn(async () => 0) },
    member: { count: vi.fn(async () => 1) },
  },
}));

describe("getUsage / assertWithinQuota", () => {
  it("resets messageCount when the calendar month (UTC) changed", async () => {
    org.usagePeriodStart = new Date(Date.now() - 40 * 86_400_000); // ~40 jours en arrière
    org.messageCount = 150;
    const { getUsage } = await import("@/lib/billing/usage");
    const usage = await getUsage("org1");
    expect(usage.messages.used).toBe(0);
    expect(org.messageCount).toBe(0);
  });

  it("throws QuotaExceededError once used >= limit", async () => {
    org.usagePeriodStart = new Date();
    org.messageCount = 200; // limite free = 200
    const { assertWithinQuota, QuotaExceededError } = await import("@/lib/billing/usage");
    await expect(assertWithinQuota("org1")).rejects.toThrow(QuotaExceededError);
  });
});
