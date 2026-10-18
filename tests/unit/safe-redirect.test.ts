import { describe, it, expect } from "vitest";
import { safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  it("keeps internal paths", () => {
    expect(safeRedirect("/conversations")).toBe("/conversations");
    expect(safeRedirect("/agents/abc?tab=sources")).toBe("/agents/abc?tab=sources");
  });

  it("falls back when empty or missing", () => {
    expect(safeRedirect(null)).toBe("/agents");
    expect(safeRedirect("")).toBe("/agents");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/agents");
    expect(safeRedirect("javascript:alert(1)")).toBe("/agents");
    expect(safeRedirect("evil.com")).toBe("/agents");
  });

  it("rejects protocol-relative and backslash tricks", () => {
    expect(safeRedirect("//evil.com")).toBe("/agents");
    expect(safeRedirect("/\\evil.com")).toBe("/agents");
  });
});
