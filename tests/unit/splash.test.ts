import { describe, it, expect } from "vitest";
import { shouldShowSplash } from "@/lib/splash";

describe("shouldShowSplash", () => {
  it("shows the splash on Sigilla's own pages", () => {
    expect(shouldShowSplash("/")).toBe(true);
    expect(shouldShowSplash("/pricing")).toBe(true);
    expect(shouldShowSplash("/agents")).toBe(true);
    expect(shouldShowSplash("/docs/getting-started")).toBe(true);
  });

  it("never shows it on the fictional sites or the widget preview", () => {
    expect(shouldShowSplash("/atelier-lune")).toBe(false);
    expect(shouldShowSplash("/atelier-lune/shipping")).toBe(false);
    expect(shouldShowSplash("/ledgerline")).toBe(false);
    expect(shouldShowSplash("/ledgerline/pricing")).toBe(false);
    expect(shouldShowSplash("/widget-preview")).toBe(false);
  });

  it("does not exclude pages that merely start with the same letters", () => {
    expect(shouldShowSplash("/atelier-lune-fans")).toBe(true);
    expect(shouldShowSplash("/ledgerline2")).toBe(true);
  });
});
