import type { Citation, RetrievedChunk } from "./types";

// Les modèles (Groq notamment) retombent parfois sur des crochets pleine-largeur 【1】
// façon ponctuation CJK au lieu des crochets ASCII [1] demandés par le prompt — on
// normalise avant de matcher pour ne jamais perdre une citation à cause de ça.
const CITE = /\[(\d{1,2})\]|【(\d{1,2})】/g;

function citeIndex(m: RegExpMatchArray): number {
  return Number(m[1] ?? m[2]);
}

/** Extrait les ids cités, ignore ceux qui n'existent pas, conserve l'ordre d'apparition. */
export function extractCitations(answer: string, chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<number>();
  const out: Citation[] = [];
  for (const m of answer.matchAll(CITE)) {
    const idx = citeIndex(m);
    if (seen.has(idx) || idx < 1 || idx > chunks.length) continue;
    seen.add(idx);
    const c = chunks[idx - 1];
    out.push({
      index: idx,
      chunkId: c.id,
      title: c.sourceTitle,
      url: c.sourceUrl,
      pageNumber: c.pageNumber,
      score: c.score,
    });
  }
  return out;
}

/** Retire les marqueurs invalides (ids hors contexte) pour ne jamais afficher un sceau orphelin. */
export function sanitizeAnswer(answer: string, chunks: RetrievedChunk[]): string {
  return answer
    .replace(CITE, (full, a, b) =>
      Number(a ?? b) >= 1 && Number(a ?? b) <= chunks.length ? `[${a ?? b}]` : "",
    )
    .trim();
}
