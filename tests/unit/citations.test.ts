import { describe, it, expect } from "vitest";
import { extractCitations, sanitizeAnswer } from "@/lib/rag/citations";
import type { RetrievedChunk } from "@/lib/rag/types";

function chunk(i: number): RetrievedChunk {
  return {
    id: `c${i}`,
    content: "x",
    sourceTitle: `Source ${i}`,
    sourceUrl: null,
    pageNumber: null,
    score: 0.8,
  };
}

describe("extractCitations", () => {
  it("keeps the order of first appearance and de-duplicates", () => {
    const chunks = [chunk(1), chunk(2), chunk(3)];
    const out = extractCitations("See [2] and again [2], also [1].", chunks);
    expect(out.map((c) => c.index)).toEqual([2, 1]);
  });

  it("ignores ids out of bounds", () => {
    const chunks = [chunk(1), chunk(2)];
    const out = extractCitations("Cites [1] and [9] and [0].", chunks);
    expect(out.map((c) => c.index)).toEqual([1]);
  });

  it("recognizes fullwidth CJK brackets as well as ASCII", () => {
    const chunks = [chunk(1)];
    const out = extractCitations("Answer【1】.", chunks);
    expect(out.map((c) => c.index)).toEqual([1]);
  });
});

describe("sanitizeAnswer", () => {
  it("removes a marker referencing an id beyond the number of sources", () => {
    const chunks = Array.from({ length: 6 }, (_, i) => chunk(i + 1));
    const out = sanitizeAnswer("Text [6] and [9].", chunks);
    expect(out).toBe("Text [6] and .");
  });

  it("normalizes fullwidth brackets to ASCII in the stored text", () => {
    const chunks = [chunk(1)];
    const out = sanitizeAnswer("Answer【1】.", chunks);
    expect(out).toBe("Answer[1].");
  });
});
