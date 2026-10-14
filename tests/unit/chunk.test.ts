import { describe, it, expect } from "vitest";
import { chunkSections } from "@/lib/ingestion/chunk";

describe("chunkSections", () => {
  it("ignores sections shorter than 40 characters", async () => {
    const out = await chunkSections([{ text: "too short", title: "A" }]);
    expect(out).toHaveLength(0);
  });

  it("splits long sections into pieces of at most 1000 characters", async () => {
    const text = "Lorem ipsum dolor sit amet. ".repeat(200);
    const out = await chunkSections([{ text, title: "Long" }]);
    expect(out.length).toBeGreaterThan(1);
    for (const chunk of out) expect(chunk.content.length).toBeLessThanOrEqual(1000);
  });

  it("preserves pageNumber and sourceUrl on every piece", async () => {
    const text = "A".repeat(500);
    const out = await chunkSections([{ text, title: "Doc", url: "https://example.com/p", pageNumber: 3 }]);
    expect(out[0].sourceUrl).toBe("https://example.com/p");
    expect(out[0].pageNumber).toBe(3);
  });

  it("produces a stable hash for identical content, and a different one if content changes", async () => {
    const text = "B".repeat(100);
    const [a] = await chunkSections([{ text, title: "Doc", url: "https://x.com" }]);
    const [b] = await chunkSections([{ text, title: "Doc", url: "https://x.com" }]);
    expect(a.contentHash).toBe(b.contentHash);
    const [c] = await chunkSections([{ text: text + " changed", title: "Doc", url: "https://x.com" }]);
    expect(c.contentHash).not.toBe(a.contentHash);
  });
});
