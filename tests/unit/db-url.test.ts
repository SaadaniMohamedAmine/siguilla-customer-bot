import { describe, it, expect } from "vitest";
import { explicitSslMode } from "@/lib/db-url";

describe("explicitSslMode", () => {
  it("rewrites the sslmodes pg already treats as verify-full", () => {
    expect(explicitSslMode("postgresql://u:p@h/db?sslmode=require")).toBe("postgresql://u:p@h/db?sslmode=verify-full");
    expect(explicitSslMode("postgresql://u:p@h/db?sslmode=prefer")).toBe("postgresql://u:p@h/db?sslmode=verify-full");
    expect(explicitSslMode("postgresql://u:p@h/db?sslmode=verify-ca")).toBe("postgresql://u:p@h/db?sslmode=verify-full");
  });

  it("keeps the other parameters, wherever sslmode sits", () => {
    expect(explicitSslMode("postgresql://u:p@h/db?channel_binding=require&sslmode=require&x=1")).toBe(
      "postgresql://u:p@h/db?channel_binding=require&sslmode=verify-full&x=1",
    );
  });

  it("leaves other modes and URLs without sslmode untouched", () => {
    expect(explicitSslMode("postgresql://u:p@h/db?sslmode=verify-full")).toBe("postgresql://u:p@h/db?sslmode=verify-full");
    expect(explicitSslMode("postgresql://u:p@h/db?sslmode=disable")).toBe("postgresql://u:p@h/db?sslmode=disable");
    expect(explicitSslMode("postgresql://u:p@h/db")).toBe("postgresql://u:p@h/db");
  });

  it("passes undefined through", () => {
    expect(explicitSslMode(undefined)).toBeUndefined();
  });
});
