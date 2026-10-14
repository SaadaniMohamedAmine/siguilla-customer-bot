import { CitationSeal, SealedBy, type CitationSource } from "@/components/ui/citation-seal";
import type { Citation } from "@/lib/rag/types";

function toSource(c: Citation): CitationSource {
  return { index: c.index, title: c.title, locator: c.pageNumber ? `p. ${c.pageNumber}` : null, url: c.url };
}

// Certains modèles répondent avec des crochets pleine-largeur 【n】 au lieu de [n] : on
// reconnaît les deux pour ne jamais laisser un marqueur de citation s'afficher brut.
const MARKER = /(\[\d{1,2}\]|【\d{1,2}】)/g;
const MARKER_EXACT = /^\[(\d{1,2})\]$|^【(\d{1,2})】$/;

/** Découpe le texte sur les marqueurs [n] / 【n】 et les remplace par des CitationSeal cliquables. */
export function AnswerText({ text, citations }: { text: string; citations: Citation[] }) {
  const byIndex = new Map(citations.map((c) => [c.index, c]));
  const parts = text.split(MARKER);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(MARKER_EXACT);
        if (m) {
          const citation = byIndex.get(Number(m[1] ?? m[2]));
          if (citation) return <CitationSeal key={i} source={toSource(citation)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export { SealedBy };
export function sealedSources(citations: Citation[]): CitationSource[] {
  return citations.map(toSource);
}
