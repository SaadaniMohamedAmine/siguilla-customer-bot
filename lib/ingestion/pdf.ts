import { PDFParse } from "pdf-parse";
import type { RawSection } from "./chunk";

export type ExtractedPage = { pageNumber: number; text: string };
export type PdfExtraction = { pages: ExtractedPage[]; pageCount: number };

// Postgres' UTF8 encoding rejects the NUL byte outright (`invalid byte
// sequence for encoding "UTF8": 0x00`), which pdf-parse occasionally emits
// for PDFs with unusual embedded font/CID mappings — the chunk insert then
// crashes the whole workflow. Strip it at the extraction boundary so no
// downstream stage (chunking, storage) ever sees it.
function stripNulBytes(text: string): string {
  const NUL = String.fromCharCode(0);
  return text.indexOf(NUL) === -1 ? text : text.split(NUL).join("");
}

/**
 * PDF extraction, PER PAGE. pdf-parse v2 rewrote its API around a `PDFParse`
 * class (the old v1 default-export function + `pagerender` hook override no
 * longer exists) — `getText()` returns per-page text natively, so no hook
 * override is needed at all.
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtraction> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages: ExtractedPage[] = result.pages.map((p) => ({ pageNumber: p.num, text: stripNulBytes(p.text) }));
    return { pages, pageCount: result.total };
  } finally {
    await parser.destroy();
  }
}

export async function loadPdfSections(blobUrl: string, title: string): Promise<RawSection[]> {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`blob_download_failed_${res.status}`);
  const { pages } = await extractPdfText(Buffer.from(await res.arrayBuffer()));
  return pages.map((p) => ({ text: p.text, title, pageNumber: p.pageNumber, url: null }));
}
