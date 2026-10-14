import { describe, it, expect } from "vitest";
import { fallbackMessage } from "@/lib/rag/fallback";

describe("fallbackMessage", () => {
  it("returns French for fr-CH", () => {
    expect(fallbackMessage("fr-CH")).toMatch(/vérifiée/);
  });
  it("defaults to English for anything else", () => {
    expect(fallbackMessage("de-DE")).toMatch(/verified/);
    expect(fallbackMessage(null)).toMatch(/verified/);
    expect(fallbackMessage(undefined)).toMatch(/verified/);
  });
});
