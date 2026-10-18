import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { onColor, toRuntimeConfig, widgetStrings } from "@/lib/widget/runtime";
import { parseWidgetConfig } from "@/lib/widget/config";

describe("onColor", () => {
  it("picks dark text on light backgrounds and white text on dark ones", () => {
    expect(onColor("#FFFFFF")).toBe("#1A1214");
    expect(onColor("#F4EDE8")).toBe("#1A1214");
    expect(onColor("#000000")).toBe("#FFFFFF");
    expect(onColor("#9E2F45")).toBe("#FFFFFF"); // bordeaux de marque
  });

  it("keeps at least 4.5:1 contrast for the six preset-like colors", () => {
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((x) => {
        const c = x / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const bg of ["#9E2F45", "#2F5D8A", "#2E7D5B", "#C9A227", "#E9D8C4", "#1A1214"]) {
      const a = lum(bg);
      const b = lum(onColor(bg));
      expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("toRuntimeConfig", () => {
  it("adds the computed text color without changing the saved fields", () => {
    const config = parseWidgetConfig({ color: "#FFFFFF" });
    expect(toRuntimeConfig(config)).toEqual({ ...config, on: "#1A1214" });
  });
});

describe("widgetStrings", () => {
  it("returns French for fr locales and English otherwise", () => {
    expect(widgetStrings("fr")).toBe(fr.WidgetRuntime);
    expect(widgetStrings("FR-ca")).toBe(fr.WidgetRuntime);
    expect(widgetStrings("en")).toBe(en.WidgetRuntime);
    expect(widgetStrings("de")).toBe(en.WidgetRuntime);
    expect(widgetStrings(null)).toBe(en.WidgetRuntime);
  });

  it("has the same keys in English and French, and the plural templates contain {n}", () => {
    expect(Object.keys(fr.WidgetRuntime).sort()).toEqual(Object.keys(en.WidgetRuntime).sort());
    for (const s of [en.WidgetRuntime, fr.WidgetRuntime]) {
      expect(s.sealedOne).toContain("{n}");
      expect(s.sealedMany).toContain("{n}");
      expect(s.joined).toContain("{n}");
    }
  });
});
