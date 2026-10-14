import fs from "node:fs";
import path from "node:path";

export const DOCS_ORDER = [
  "getting-started",
  "sources",
  "embed",
  "customize",
  "answers",
  "citations",
  "handoff",
  "analytics",
  "api",
  "plans",
] as const;

const TITLES: Record<string, string> = {
  "getting-started": "Getting started",
  sources: "Sources",
  embed: "Embedding the widget",
  customize: "Customizing the widget",
  answers: "How answers work",
  citations: "Citations",
  handoff: "Human handoff",
  analytics: "Analytics",
  api: "API reference",
  plans: "Plans and limits",
};

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export function getDocTitle(slug: string) {
  return TITLES[slug] ?? slug;
}

export function getDocNav() {
  return DOCS_ORDER.map((slug) => ({ slug, title: getDocTitle(slug) }));
}

export function getDocContent(slug: string): string | null {
  const file = path.join(DOCS_DIR, `${slug}.md`);
  if (!file.startsWith(DOCS_DIR) || !fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

/** Titres `##` pour la colonne "On this page". */
export function getDocHeadings(markdown: string): { text: string; id: string }[] {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  return matches.map((m) => ({ text: m[1], id: slugifyHeading(m[1]) }));
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
