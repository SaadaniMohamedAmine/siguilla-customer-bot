import { describe, it, expect, vi, beforeEach } from "vitest";

const state = { plan: "free", sources: 0, chunks: 0 };

vi.mock("@/lib/db", () => ({
  prisma: {
    organization: { findUniqueOrThrow: vi.fn(async () => ({ plan: state.plan })) },
    dataSource: { count: vi.fn(async () => state.sources) },
    chunk: { count: vi.fn(async () => state.chunks) },
  },
}));

import { assertCanAddSource, assertGlobalChunkBudget, LimitError } from "@/lib/ingestion/guards";

beforeEach(() => {
  state.plan = "free";
  state.sources = 0;
  state.chunks = 0;
  delete process.env.MAX_TOTAL_CHUNKS;
});

describe("assertCanAddSource", () => {
  it("lets a Free agent add sources until the 5th", async () => {
    state.sources = 4;
    await expect(assertCanAddSource("o1", "b1", "pdf")).resolves.toBeUndefined();
  });

  it("refuses the 6th source on Free with sources_limit", async () => {
    state.sources = 5;
    await expect(assertCanAddSource("o1", "b1", "pdf")).rejects.toMatchObject({ code: "sources_limit" });
    await expect(assertCanAddSource("o1", "b1", "pdf")).rejects.toBeInstanceOf(LimitError);
  });

  it("applies the larger Pro limit (25 per agent)", async () => {
    state.plan = "pro";
    state.sources = 24;
    await expect(assertCanAddSource("o1", "b1", "url")).resolves.toBeUndefined();
    state.sources = 25;
    await expect(assertCanAddSource("o1", "b1", "url")).rejects.toMatchObject({ code: "sources_limit" });
  });

  it("reserves Notion for paid plans", async () => {
    await expect(assertCanAddSource("o1", "b1", "notion")).rejects.toMatchObject({ code: "notion_requires_pro" });
    state.plan = "pro";
    await expect(assertCanAddSource("o1", "b1", "notion")).resolves.toBeUndefined();
  });
});

describe("assertGlobalChunkBudget", () => {
  it("accepts an insertion that stays under the global ceiling", async () => {
    state.chunks = 59_000;
    await expect(assertGlobalChunkBudget(500)).resolves.toBeUndefined();
  });

  it("refuses an insertion that would pass the ceiling (60 000 by default)", async () => {
    state.chunks = 59_900;
    await expect(assertGlobalChunkBudget(200)).rejects.toMatchObject({ code: "global_storage_full" });
  });

  it("reads the ceiling from MAX_TOTAL_CHUNKS", async () => {
    process.env.MAX_TOTAL_CHUNKS = "100";
    state.chunks = 90;
    await expect(assertGlobalChunkBudget(11)).rejects.toMatchObject({ code: "global_storage_full" });
    await expect(assertGlobalChunkBudget(10)).resolves.toBeUndefined();
  });
});
