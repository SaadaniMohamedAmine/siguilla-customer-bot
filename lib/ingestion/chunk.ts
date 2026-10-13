import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { sha256 } from "@/lib/hash";
import { cleanText } from "@/lib/text";

export type RawSection = { text: string; title: string; url?: string | null; pageNumber?: number | null };
export type PreparedChunk = {
  content: string;
  sourceTitle: string;
  sourceUrl: string | null;
  pageNumber: number | null;
  contentHash: string;
};

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 150 });

/** Découpe section par section (une page PDF, une page web, une page Notion) pour garder une attribution exacte. */
export async function chunkSections(sections: RawSection[]): Promise<PreparedChunk[]> {
  const out: PreparedChunk[] = [];
  for (const s of sections) {
    const text = cleanText(s.text);
    if (text.length < 40) continue;
    for (const piece of await splitter.splitText(text)) {
      out.push({
        content: piece,
        sourceTitle: s.title,
        sourceUrl: s.url ?? null,
        pageNumber: s.pageNumber ?? null,
        contentHash: sha256(`${s.url ?? ""}|${s.pageNumber ?? ""}|${piece}`),
      });
    }
  }
  return out;
}
