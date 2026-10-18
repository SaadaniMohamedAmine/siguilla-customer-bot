import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { API_ERROR_CODES, apiErrorKey } from "@/lib/api-errors";
import { responseError, unwrapAuth } from "@/lib/api";

describe("apiErrorKey", () => {
  it("maps known codes to themselves", () => {
    expect(apiErrorKey("agents_limit")).toBe("agents_limit");
    expect(apiErrorKey("members_limit")).toBe("members_limit");
    expect(apiErrorKey("rate_limited")).toBe("rate_limited");
  });

  it("maps the plain-text server messages", () => {
    expect(apiErrorKey("The demo is read-only.")).toBe("demo_read_only");
    expect(apiErrorKey("Unauthorized")).toBe("unauthorized");
    expect(apiErrorKey("Only owners and admins can manage billing.")).toBe("billing_forbidden");
    expect(apiErrorKey("Only owners and admins can manage API keys.")).toBe("keys_forbidden");
    expect(apiErrorKey("Only the owner can delete the organization.")).toBe("owner_only");
  });

  it("returns null for unknown or non-string values (caller falls back to its generic message)", () => {
    expect(apiErrorKey("request_failed")).toBeNull();
    expect(apiErrorKey("Internal error")).toBeNull();
    expect(apiErrorKey("toString")).toBeNull();
    expect(apiErrorKey("constructor")).toBeNull();
    expect(apiErrorKey("__proto__")).toBeNull();
    expect(apiErrorKey("")).toBeNull();
    expect(apiErrorKey(undefined)).toBeNull();
    expect(apiErrorKey(404)).toBeNull();
  });
});

describe("ApiErrors translations", () => {
  const expected = [
    ...API_ERROR_CODES,
    "demo_read_only",
    "unauthorized",
    "billing_forbidden",
    "keys_forbidden",
    "owner_only",
  ].sort();

  it.each([
    ["en", en],
    ["fr", fr],
  ])("%s has a message for every mapped error", (_locale, messages) => {
    expect(Object.keys(messages.ApiErrors).sort()).toEqual(expected);
  });
});

describe("responseError", () => {
  it("uses the server error code as the message", async () => {
    const err = await responseError(new Response(JSON.stringify({ error: "agents_limit" }), { status: 403 }));
    expect(err.message).toBe("agents_limit");
  });

  it("falls back to request_failed when the body has no error", async () => {
    expect((await responseError(new Response("oops", { status: 500 }))).message).toBe("request_failed");
  });
});

describe("unwrapAuth", () => {
  it("returns data on success", () => {
    expect(unwrapAuth({ data: { id: "x" }, error: null })).toEqual({ id: "x" });
  });

  it("throws the server message on error, so callers never show a false success", () => {
    expect(() => unwrapAuth({ data: null, error: { message: "members_limit" } })).toThrow("members_limit");
    expect(() => unwrapAuth({ data: null, error: {} })).toThrow("request_failed");
  });
});
