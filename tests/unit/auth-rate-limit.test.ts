import { describe, it, expect } from "vitest";
import { authRateRules } from "@/lib/auth-rate-limit";

describe("authRateRules", () => {
  it("limits password reset requests to 5 per hour per IP and per email", () => {
    const rules = authRateRules("/request-password-reset", "1.2.3.4", "Alice@Example.com ");
    expect(rules).toEqual([
      { key: "auth:reset:ip:1.2.3.4", limit: 5, windowMs: 3_600_000 },
      { key: "auth:reset:email:alice@example.com", limit: 5, windowMs: 3_600_000 },
    ]);
  });

  it("covers the legacy reset endpoint name too", () => {
    expect(authRateRules("/forget-password", "1.2.3.4", "a@b.co")).toHaveLength(2);
  });

  it("falls back to the IP rule when the email is missing or not a string", () => {
    expect(authRateRules("/request-password-reset", "1.2.3.4")).toHaveLength(1);
    expect(authRateRules("/request-password-reset", "1.2.3.4", 42)).toHaveLength(1);
    expect(authRateRules("/request-password-reset", "1.2.3.4", "   ")).toHaveLength(1);
  });

  it("limits email sign-in to 10 per minute per IP", () => {
    expect(authRateRules("/sign-in/email", "1.2.3.4", "a@b.co")).toEqual([
      { key: "auth:signin:1.2.3.4", limit: 10, windowMs: 60_000 },
    ]);
  });

  it("does not limit other endpoints", () => {
    expect(authRateRules("/get-session", "1.2.3.4")).toEqual([]);
    expect(authRateRules("/sign-up/email", "1.2.3.4", "a@b.co")).toEqual([]);
    expect(authRateRules("/sign-out", "1.2.3.4")).toEqual([]);
  });
});
