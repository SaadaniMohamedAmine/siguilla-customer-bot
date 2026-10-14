import { describe, it, expect } from "vitest";
import { WidgetConfig, parseWidgetConfig } from "@/lib/widget/config";

describe("WidgetConfig", () => {
  it("fills in defaults for an empty input", () => {
    const config = parseWidgetConfig({});
    expect(config.color).toBe("#9E2F45");
    expect(config.theme).toBe("dark");
    expect(config.showBadge).toBe(true);
  });

  it("rejects an invalid hex color", () => {
    expect(() => WidgetConfig.parse({ color: "not-a-color" })).toThrow();
  });

  it("rejects more than 3 suggestions", () => {
    expect(() => WidgetConfig.parse({ suggestions: ["a", "b", "c", "d"] })).toThrow();
  });

  it("accepts exactly 3 suggestions", () => {
    expect(WidgetConfig.parse({ suggestions: ["a", "b", "c"] }).suggestions).toHaveLength(3);
  });
});
