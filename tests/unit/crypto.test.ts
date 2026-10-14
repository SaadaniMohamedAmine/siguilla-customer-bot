import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  process.env.INGESTION_HMAC_SECRET = "test-hmac-secret";
});

describe("encrypt/decrypt", () => {
  it("round-trips a plaintext string", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const payload = encrypt("super secret notion token");
    expect(payload).not.toContain("super secret");
    expect(decrypt(payload)).toBe("super secret notion token");
  });
});

describe("verifySignature", () => {
  it("accepts a correctly signed body", async () => {
    const { sign, verifySignature } = await import("@/lib/crypto");
    const body = JSON.stringify({ a: 1 });
    expect(verifySignature(body, sign(body))).toBe(true);
  });

  it("rejects a tampered signature", async () => {
    const { sign, verifySignature } = await import("@/lib/crypto");
    const body = JSON.stringify({ a: 1 });
    const bad = sign(body).slice(0, -2) + "00";
    expect(verifySignature(body, bad)).toBe(false);
  });

  it("rejects a missing signature", async () => {
    const { verifySignature } = await import("@/lib/crypto");
    expect(verifySignature("body", null)).toBe(false);
  });
});
