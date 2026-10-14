import { describe, it, expect, beforeAll } from "vitest";
import { originAllowed } from "@/lib/public/cors";

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://sigilla.app";
});

describe("originAllowed", () => {
  it("accepts an exact domain match", () => {
    expect(originAllowed("https://atelierlune.com", ["atelierlune.com"])).toBe(true);
    expect(originAllowed("https://other.com", ["atelierlune.com"])).toBe(false);
  });

  it("accepts a wildcard subdomain", () => {
    expect(originAllowed("https://shop.atelierlune.com", ["*.atelierlune.com"])).toBe(true);
    expect(originAllowed("https://atelierlune.com", ["*.atelierlune.com"])).toBe(true);
  });

  it("allows any origin when the allowlist is empty", () => {
    expect(originAllowed("https://anything.com", [])).toBe(true);
  });

  it("always accepts the app's own origin", () => {
    expect(originAllowed("https://sigilla.app", ["only-this.com"])).toBe(true);
  });

  it("rejects localhost in production unless explicitly allowed", () => {
    const prev = process.env.NODE_ENV;
    // @ts-expect-error -- readonly in types, writable at runtime
    process.env.NODE_ENV = "production";
    expect(originAllowed("http://localhost:3000", ["example.com"])).toBe(false);
    expect(originAllowed("http://localhost:3000", ["localhost"])).toBe(true);
    // @ts-expect-error -- restore
    process.env.NODE_ENV = prev;
  });
});
