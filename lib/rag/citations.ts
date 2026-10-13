import type { Citation, RetrievedChunk } from "./types";

const CITE = /\[(\d{1,2})\]/g;

/** Extrait les ids cités, ignore ceux qui n'existent pas, conserve l'ordre d'apparition. */
export function extractCitations(answer: string, chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<number>();
  const out: Citation[] = [];
  for (const m of answer.matchAll(CITE)) {
    const idx = Number(m[1]);
    if (seen.has(idx) || idx < 1 || idx > chunks.length) continue;
    seen.add(idx);
    const c = chunks[idx - 1];
    out.push({ index: idx, chunkId: c.id, title: c.sourceTitle, url: c.sourceUrl, pageNumber: c.pageNumber, score: c.score });
  }
  return out;
}

/** Retire les marqueurs invalides (ids hors contexte) pour ne jamais afficher un sceau orphelin. */
export function sanitizeAnswer(answer: string, chunks: RetrievedChunk[]): string {
  return answer.replace(CITE, (full, n) => (Number(n) >= 1 && Number(n) <= chunks.length ? full : "")).trim();
}
