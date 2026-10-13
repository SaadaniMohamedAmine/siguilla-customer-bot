import { CitationSeal, SealedBy, type CitationSource } from "@/components/ui/citation-seal";
import type { Citation } from "@/lib/rag/types";

function toSource(c: Citation): CitationSource {
  return { index: c.index, title: c.title, locator: c.pageNumber ? `p. ${c.pageNumber}` : null, url: c.url };
}

/** Découpe le texte sur les marqueurs [n] et les remplace par des CitationSeal cliquables. */
export function AnswerText({ text, citations }: { text: string; citations: Citation[] }) {
  const byIndex = new Map(citations.map((c) => [c.index, c]));
  const parts = text.split(/(\[\d{1,2}\])/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d{1,2})\]$/);
        if (m) {
          const citation = byIndex.get(Number(m[1]));
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
