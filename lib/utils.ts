import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailwind Merge ne connaît pas nos tailles de texte (`--text-small`, `--text-body`…, voir styles/globals.css) : il les
// prenait pour des couleurs et supprimait la vraie couleur (`text-on-accent` perdu quand `text-small` suit).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "kpi", "body-lg", "body", "small", "label"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
