import { describe, it, expect } from "vitest";
import {
  busyWaitMinutes,
  isDemoAllowedPath,
  isDemoEmail,
  isPrefetchRequest,
  parseBusyWait,
  PASSWORD_RESET_REQUEST_PATHS,
} from "@/lib/demo-guard";

describe("isDemoAllowedPath", () => {
  it.each([
    "/get-session",
    "/list-sessions",
    "/sign-out",
    "/sign-in/email",
    "/sign-in/social",
    "/sign-up/email",
    "/callback/google",
    "/callback/github",
    "/organization/list",
    "/organization/get-full-organization",
    "/organization/get-active-member",
    "/organization/list-members",
    "/organization/set-active",
    "/organization/has-permission",
    "/api-key/list",
    "/api-key/get",
  ])("allows %s", (path) => {
    expect(isDemoAllowedPath(path)).toBe(true);
  });

  it.each([
    "/organization/create",
    "/organization/update",
    "/organization/delete",
    "/organization/invite-member",
    "/organization/cancel-invitation",
    "/organization/remove-member",
    "/organization/update-member-role",
    "/organization/leave",
    "/organization/accept-invitation",
    "/organization/create-role",
    "/organization/create-team",
    "/change-password",
    "/change-email",
    "/update-user",
    "/delete-user",
    "/set-password",
    "/revoke-session",
    "/revoke-sessions",
    "/revoke-other-sessions",
    "/unlink-account",
    "/link-social",
    "/update-session",
    "/api-key/create",
    "/api-key/update",
    "/api-key/delete",
    "/callback/../delete-user",
    "/some-future-endpoint",
  ])("blocks %s", (path) => {
    expect(isDemoAllowedPath(path)).toBe(false);
  });
});

describe("isDemoEmail", () => {
  it("matches the demo email case-insensitively", () => {
    expect(isDemoEmail("Demo@Sigilla.app", "demo@sigilla.app")).toBe(true);
    expect(isDemoEmail(" demo@sigilla.app ", "demo@sigilla.app")).toBe(true);
  });

  it("does not match other emails, non-strings or a missing demo email", () => {
    expect(isDemoEmail("other@sigilla.app", "demo@sigilla.app")).toBe(false);
    expect(isDemoEmail(undefined, "demo@sigilla.app")).toBe(false);
    expect(isDemoEmail("demo@sigilla.app", undefined)).toBe(false);
  });
});

describe("isPrefetchRequest", () => {
  const h = (init: Record<string, string>) => new Headers(init);

  it("detects Next.js <Link> prefetches and RSC requests", () => {
    expect(isPrefetchRequest(h({ "next-router-prefetch": "1" }))).toBe(true);
    expect(isPrefetchRequest(h({ rsc: "1" }))).toBe(true);
  });

  it("detects browser prefetch / prerender hints", () => {
    expect(isPrefetchRequest(h({ purpose: "prefetch" }))).toBe(true);
    expect(isPrefetchRequest(h({ "sec-purpose": "prefetch;prerender" }))).toBe(true);
  });

  it("lets a normal click through (so the demo still opens)", () => {
    expect(isPrefetchRequest(h({}))).toBe(false);
    expect(isPrefetchRequest(h({ accept: "text/html", "user-agent": "Mozilla/5.0" }))).toBe(false);
  });
});

describe("busyWaitMinutes", () => {
  it("rounds up to whole minutes, at least 1", () => {
    expect(busyWaitMinutes(1)).toBe(1);
    expect(busyWaitMinutes(60)).toBe(1);
    expect(busyWaitMinutes(61)).toBe(2);
    expect(busyWaitMinutes(0)).toBe(1);
    expect(busyWaitMinutes(1500)).toBe(25);
  });
});

describe("parseBusyWait", () => {
  it("reads the wait from a demo=busy URL", () => {
    expect(parseBusyWait("?demo=busy&wait=12")).toBe(12);
  });

  it("clamps the wait to 1–60 and defaults to 5 when missing or invalid", () => {
    expect(parseBusyWait("?demo=busy&wait=0")).toBe(1);
    expect(parseBusyWait("?demo=busy&wait=999")).toBe(60);
    expect(parseBusyWait("?demo=busy")).toBe(5);
    expect(parseBusyWait("?demo=busy&wait=abc")).toBe(5);
  });

  it("returns null for any other URL", () => {
    expect(parseBusyWait("")).toBeNull();
    expect(parseBusyWait("?wait=12")).toBeNull();
    expect(parseBusyWait("?demo=1&wait=12")).toBeNull();
  });
});

describe("PASSWORD_RESET_REQUEST_PATHS", () => {
  it("covers both the current and the legacy reset endpoint names", () => {
    expect(PASSWORD_RESET_REQUEST_PATHS).toEqual(["/request-password-reset", "/forget-password"]);
  });
});
