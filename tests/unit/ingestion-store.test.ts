import { describe, it, expect, vi, beforeEach } from "vitest";

const { state, embed, findMany, executeRaw, deleteMany } = vi.hoisted(() => {
  const state: { existing: string[]; inserted: unknown[][] } = { existing: [], inserted: [] };
  return {
    state,
    embed: vi.fn(async (texts: string[]) => texts.map((_, i) => [i, i + 0.5])),
    findMany: vi.fn(async () => state.existing.map((contentHash) => ({ contentHash }))),
    executeRaw: vi.fn(async (_strings: TemplateStringsArray, ...values: unknown[]) => {
      state.inserted.push(values);
      return 1;
    }),
    deleteMany: vi.fn(async () => ({ count: 3 })),
  };
});

vi.mock("@/lib/db", () => ({ prisma: { chunk: { findMany, deleteMany }, $executeRaw: executeRaw } }));
vi.mock("@/lib/ai/orchestrator", () => ({ generateEmbeddingsBatch: embed }));

import { storeChunks, purgeOrphans } from "@/lib/ingestion/store";

const chunk = (n: number) => ({
  content: `content ${n}`,
  contentHash: `hash${n}`,
  sourceTitle: "Doc",
  sourceUrl: null,
  pageNumber: n,
});

beforeEach(() => {
  vi.clearAllMocks();
  state.existing = [];
  state.inserted = [];
});

describe("storeChunks", () => {
  it("does nothing, and calls no model, for an empty list", async () => {
    expect(await storeChunks("b1", "s1", [])).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
    expect(embed).not.toHaveBeenCalled();
  });

  it("embeds and inserts every chunk the first time", async () => {
    expect(await storeChunks("b1", "s1", [chunk(1), chunk(2)])).toBe(2);
    expect(embed).toHaveBeenCalledWith(["content 1", "content 2"]);
    expect(executeRaw).toHaveBeenCalledTimes(2);
  });

  it("costs zero embeddings when nothing changed (incremental re-sync)", async () => {
    state.existing = ["hash1", "hash2"];
    expect(await storeChunks("b1", "s1", [chunk(1), chunk(2)])).toBe(0);
    expect(embed).not.toHaveBeenCalled();
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("embeds only the new chunks when part of the content changed", async () => {
    state.existing = ["hash1"];
    expect(await storeChunks("b1", "s1", [chunk(1), chunk(2), chunk(3)])).toBe(2);
    expect(embed).toHaveBeenCalledWith(["content 2", "content 3"]);
    expect(executeRaw).toHaveBeenCalledTimes(2);
  });

  it("writes the vector as a pgvector literal with the chunk metadata", async () => {
    await storeChunks("b1", "s1", [chunk(7)]);
    const values = state.inserted[0];
    expect(values).toContain("s1");
    expect(values).toContain("b1");
    expect(values).toContain("[0,0.5]");
    expect(values).toContain("hash7");
  });
});

describe("purgeOrphans", () => {
  it("deletes the chunks that left the current content and returns how many", async () => {
    expect(await purgeOrphans("s1", ["hash1"])).toBe(3);
    expect(deleteMany).toHaveBeenCalledWith({ where: { dataSourceId: "s1", contentHash: { notIn: ["hash1"] } } });
  });
});
