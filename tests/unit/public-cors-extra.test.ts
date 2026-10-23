import { describe, it, expect, vi, beforeAll } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn(async (args: unknown) => ({ id: "b1", args })) }));
vi.mock("@/lib/db", () => ({ prisma: { chatbot: { findUnique } } }));

import { effectiveOrigin, corsHeaders, clientIp, loadPublicBot, originAllowed } from "@/lib/public/cors";
import * as limits from "@/lib/public/limits";

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://sigilla.app";
});

const req = (headers: Record<string, string>) => new Request("https://sigilla.app/api/public/v1/chat", { headers });

describe("effectiveOrigin", () => {
  it("prefers the Origin header", () => {
    expect(effectiveOrigin(req({ origin: "https://shop.example", referer: "https://other.example/page" }))).toBe("https://shop.example");
  });

  it("falls back to the Referer origin (same-origin GET sends no Origin)", () => {
    expect(effectiveOrigin(req({ referer: "https://sigilla.app/widget-preview?x=1" }))).toBe("https://sigilla.app");
  });

  it("returns null with neither header, or with an unparsable Referer", () => {
    expect(effectiveOrigin(req({}))).toBeNull();
    expect(effectiveOrigin(req({ referer: "not a url" }))).toBeNull();
  });
});

describe("originAllowed edge cases", () => {
  it("refuses a missing or unparsable origin", () => {
    expect(originAllowed(null, [])).toBe(false);
    expect(originAllowed("null", ["example.com"])).toBe(false);
  });

  it("does not accept a lookalike suffix of an allowed domain", () => {
    expect(originAllowed("https://example.com.evil.test", ["example.com"])).toBe(false);
    expect(originAllowed("https://sub.example.com", ["example.com"])).toBe(false);
  });
});

describe("corsHeaders", () => {
  it("echoes the origin with the allowed methods and Vary: Origin", () => {
    expect(corsHeaders("https://shop.example")).toMatchObject({
      "access-control-allow-origin": "https://shop.example",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      vary: "Origin",
    });
  });

  it("sends no CORS header without an origin", () => {
    expect(corsHeaders(null)).toEqual({});
  });
});

describe("clientIp", () => {
  it("takes the first address of x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("falls back to 0.0.0.0", () => {
    expect(clientIp(req({}))).toBe("0.0.0.0");
  });
});

describe("loadPublicBot", () => {
  it("looks the agent up by its public key and includes the organization plan", async () => {
    await loadPublicBot("pk_abc");
    expect(findUnique).toHaveBeenCalledWith({
      where: { publicKey: "pk_abc" },
      include: { organization: { select: { id: true, plan: true, isDemo: true } } },
    });
  });
});

describe("public limits", () => {
  it("exposes the documented public rate limits", () => {
    expect(limits.CHAT_PER_MINUTE).toBe(20);
    expect(limits.CHAT_PER_DAY).toBe(200);
    expect(limits.CONFIG_PER_MINUTE).toBe(60);
    expect(limits.MISC_PER_MINUTE).toBe(60);
    expect(limits.DEMO_PER_HOUR).toBeGreaterThan(0);
  });
});
