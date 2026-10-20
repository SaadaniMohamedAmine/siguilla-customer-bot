import { describe, it, expect, afterEach } from "vitest";
import { testUsersPassword } from "../e2e/helpers";

const original = process.env.TEST_USERS_PASSWORD;

afterEach(() => {
  if (original === undefined) delete process.env.TEST_USERS_PASSWORD;
  else process.env.TEST_USERS_PASSWORD = original;
});

describe("testUsersPassword", () => {
  it("prefers the environment variable", () => {
    process.env.TEST_USERS_PASSWORD = "from-the-environment-123";
    expect(testUsersPassword()).toBe("from-the-environment-123");
  });

  it("never returns an empty string (an empty value counts as missing)", () => {
    process.env.TEST_USERS_PASSWORD = "";
    expect(testUsersPassword() === undefined || testUsersPassword()!.length > 0).toBe(true);
  });
});
