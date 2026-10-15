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

const TITLES_FR: Record<string, string> = {
  "getting-started": "Démarrer",
  sources: "Sources",
  embed: "Intégrer le widget",
  customize: "Personnaliser le widget",
  answers: "Comment fonctionnent les réponses",
  citations: "Citations",
  handoff: "Passage à un humain",
  analytics: "Analytics",
  api: "Référence API",
  plans: "Offres et limites",
};

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export function getDocTitle(slug: string, locale = "en") {
  return (locale === "fr" ? TITLES_FR[slug] : undefined) ?? TITLES[slug] ?? slug;
}

export function getDocNav(locale = "en") {
  return DOCS_ORDER.map((slug) => ({ slug, title: getDocTitle(slug, locale) }));
}

/** Contenu Markdown : version localisée (content/docs/<locale>/) si elle existe, sinon la version anglaise. */
export function getDocContent(slug: string, locale = "en"): string | null {
  const candidates = locale !== "en" ? [path.join(DOCS_DIR, locale, `${slug}.md`)] : [];
  candidates.push(path.join(DOCS_DIR, `${slug}.md`));
  for (const file of candidates) {
    if (file.startsWith(DOCS_DIR) && fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  }
  return null;
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

/** Groupes de la sidebar ; `key` correspond à Docs.groups.* dans messages/. */
export const DOC_GROUPS: { key: "start" | "widget" | "concepts" | "reference"; slugs: (typeof DOCS_ORDER)[number][] }[] = [
  { key: "start", slugs: ["getting-started", "sources"] },
  { key: "widget", slugs: ["embed", "customize"] },
  { key: "concepts", slugs: ["answers", "citations", "handoff", "analytics"] },
  { key: "reference", slugs: ["api", "plans"] },
];

export type DocSearchEntry = { slug: string; page: string; heading: string | null; id: string | null; text: string };

function plain(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Index de recherche local (une entrée par page et par section `##`), calculé côté serveur à partir des .md. */
export function getDocSearchIndex(locale = "en"): DocSearchEntry[] {
  const out: DocSearchEntry[] = [];
  for (const slug of DOCS_ORDER) {
    const md = getDocContent(slug, locale);
    if (!md) continue;
    const page = getDocTitle(slug, locale);
    const parts = md.split(/^##\s+/m);
    out.push({ slug, page, heading: null, id: null, text: plain(parts[0].replace(/^#\s+.*$/m, "")).slice(0, 220) });
    for (const part of parts.slice(1)) {
      const nl = part.indexOf("\n");
      const heading = part.slice(0, nl).trim();
      out.push({ slug, page, heading, id: slugifyHeading(heading), text: plain(part.slice(nl)).slice(0, 220) });
    }
  }
  return out;
}
