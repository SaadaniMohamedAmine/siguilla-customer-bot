import { describe, it, expect } from "vitest";
import { isDemoAllowedPath, isDemoEmail, PASSWORD_RESET_REQUEST_PATHS } from "@/lib/demo-guard";

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

describe("PASSWORD_RESET_REQUEST_PATHS", () => {
  it("covers both the current and the legacy reset endpoint names", () => {
    expect(PASSWORD_RESET_REQUEST_PATHS).toEqual(["/request-password-reset", "/forget-password"]);
  });
});
