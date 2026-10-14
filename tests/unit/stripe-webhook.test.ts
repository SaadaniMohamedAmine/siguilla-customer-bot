import { describe, it, expect, vi, beforeEach } from "vitest";

const seenEventIds = new Set<string>();
const organizations = new Map<string, Record<string, unknown>>();

const constructEvent = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent },
    subscriptions: {
      retrieve: vi.fn(async (id: string) => ({
        id,
        status: "active",
        items: { data: [{ price: { id: "price_pro" } }] },
      })),
    },
  }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    stripeEvent: {
      create: vi.fn(async ({ data }: { data: { id: string } }) => {
        if (seenEventIds.has(data.id)) throw new Error("duplicate");
        seenEventIds.add(data.id);
        return data;
      }),
    },
    organization: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const org = organizations.get(where.id) ?? {};
        organizations.set(where.id, { ...org, ...data });
      }),
      findFirst: vi.fn(async ({ where }: { where: { stripeCustomerId: string } }) => {
        for (const [id, org] of organizations)
          if (org.stripeCustomerId === where.stripeCustomerId) return { id, ...org };
        return null;
      }),
    },
  },
}));

process.env.STRIPE_PRICE_ID_PRO = "price_pro";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

function fakeRequest(body: string, signature: string | null = "valid") {
  return {
    text: async () => body,
    headers: { get: (k: string) => (k === "stripe-signature" ? signature : null) },
  } as never;
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    seenEventIds.clear();
    organizations.clear();
    vi.clearAllMocks();
  });

  it("activates Pro on checkout.session.completed for the right organization", async () => {
    organizations.set("org1", {});
    constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { metadata: { organizationId: "org1" }, subscription: "sub_1" } },
    });
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(fakeRequest("{}"));
    expect(res.status).toBe(200);
    expect(organizations.get("org1")).toMatchObject({ plan: "pro", stripeSubscriptionId: "sub_1" });
  });

  it("downgrades to free on customer.subscription.deleted", async () => {
    organizations.set("org2", { stripeCustomerId: "cus_2", plan: "pro" });
    constructEvent.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_2" } },
    });
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    await POST(fakeRequest("{}"));
    expect(organizations.get("org2")).toMatchObject({ plan: "free", stripeSubscriptionId: null });
  });

  it("ignores an event it has already processed", async () => {
    constructEvent.mockReturnValue({
      id: "evt_3",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_x" } },
    });
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    await POST(fakeRequest("{}"));
    const res = await POST(fakeRequest("{}"));
    const json = await res.json();
    expect(json.duplicate).toBe(true);
  });

  it("rejects a request with no signature header with 400", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(fakeRequest("{}", null));
    expect(res.status).toBe(400);
  });

  it("rejects a request with an invalid signature with 400", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(fakeRequest("{}", "bad"));
    expect(res.status).toBe(400);
  });
});
