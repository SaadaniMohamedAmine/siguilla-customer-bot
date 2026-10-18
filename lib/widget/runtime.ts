import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { WidgetConfig } from "./config";

/**
 * Ce qui est calculé côté serveur pour garder le widget sous 5 KB gzip :
 * la couleur du texte sur le bouton (contraste WCAG) et les textes du widget (EN/FR).
 */
const DARK = "#1A1214";
const LIGHT = "#FFFFFF";

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (l1: number, l2: number) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

/** Couleur de texte la plus lisible (ratio de contraste le plus élevé) sur un fond hex `#RRGGBB`. */
export function onColor(hex: string): string {
  const bg = luminance(hex);
  return contrast(bg, luminance(DARK)) >= contrast(bg, luminance(LIGHT)) ? DARK : LIGHT;
}

export type WidgetStrings = typeof en.WidgetRuntime;

export function widgetStrings(lang: string | null | undefined): WidgetStrings {
  return lang?.toLowerCase().startsWith("fr") ? fr.WidgetRuntime : en.WidgetRuntime;
}

/** Config envoyée au widget : la config sauvegardée + la couleur de texte calculée. */
export const toRuntimeConfig = (config: WidgetConfig) => ({ ...config, on: onColor(config.color) });
