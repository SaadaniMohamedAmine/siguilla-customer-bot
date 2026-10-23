import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawSection } from "@/lib/ingestion/chunk";

type Ds = {
  id: string;
  type: "pdf" | "url" | "notion";
  chatbotId: string;
  name: string;
  blobUrl: string | null;
  url: string | null;
  notionPageIds: string[];
  cursor: Record<string, unknown>;
  chatbot: { organizationId: string; organization: { plan: string } };
};

const h = vi.hoisted(() => {
  const state = { ds: null as unknown, chunkCount: 3, updates: [] as { data: Record<string, unknown> }[] };
  return {
    state,
    findUniqueOrThrow: vi.fn(async () => state.ds),
    update: vi.fn(async (args: { data: Record<string, unknown> }) => {
      state.updates.push(args);
      return {};
    }),
    count: vi.fn(async () => state.chunkCount),
    notionConn: vi.fn(async () => ({ accessTokenEnc: "enc" })),
    chunkSections: vi.fn(async (sections: { text: string }[]) =>
      sections.map((s, i) => ({ content: s.text, contentHash: `${s.text}#${i}`, sourceTitle: "t", sourceUrl: null, pageNumber: null })),
    ),
    storeChunks: vi.fn(async () => 1),
    purgeOrphans: vi.fn(async () => 0),
    loadPdfSections: vi.fn(),
    discoverUrls: vi.fn(),
    crawlPage: vi.fn(),
    loadRobots: vi.fn(async () => (_path: string) => true),
    loadNotionPage: vi.fn(),
    assertGlobalChunkBudget: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    dataSource: { findUniqueOrThrow: h.findUniqueOrThrow, update: h.update },
    chunk: { count: h.count },
    notionConnection: { findUniqueOrThrow: h.notionConn },
  },
}));
vi.mock("@/lib/ingestion/chunk", () => ({ chunkSections: h.chunkSections }));
vi.mock("@/lib/ingestion/store", () => ({ storeChunks: h.storeChunks, purgeOrphans: h.purgeOrphans }));
vi.mock("@/lib/ingestion/pdf", () => ({ loadPdfSections: h.loadPdfSections }));
vi.mock("@/lib/ingestion/crawler", () => ({
  discoverUrls: h.discoverUrls,
  crawlPage: h.crawlPage,
  loadRobots: h.loadRobots,
  normalizeUrl: (u: string) => (u.startsWith("http") ? u : null),
}));
vi.mock("@/lib/ingestion/notion", () => ({ notionClient: vi.fn(() => ({})), loadNotionPage: h.loadNotionPage }));
vi.mock("@/lib/ingestion/guards", () => ({ assertGlobalChunkBudget: h.assertGlobalChunkBudget }));

import { runIngestionStep } from "@/lib/ingestion/pipeline";

const ds = (over: Partial<Ds>): Ds => ({
  id: "s1",
  type: "pdf",
  chatbotId: "b1",
  name: "Doc.pdf",
  blobUrl: "https://blob.example/doc.pdf",
  url: null,
  notionPageIds: [],
  cursor: {},
  chatbot: { organizationId: "o1", organization: { plan: "free" } },
  ...over,
});
const sections = (n: number): RawSection[] =>
  Array.from({ length: n }, (_, i) => ({ text: `page ${i + 1}`, title: "Doc.pdf", pageNumber: i + 1, url: null }));
const last = () => h.state.updates[h.state.updates.length - 1].data;

beforeEach(() => {
  vi.clearAllMocks();
  h.state.updates = [];
  h.state.chunkCount = 3;
  h.loadRobots.mockImplementation(async () => () => true);
});

describe("runIngestionStep: PDF", () => {
  it("processes 20 pages per invocation and saves a cursor for the next one", async () => {
    h.state.ds = ds({});
    h.loadPdfSections.mockResolvedValue(sections(35));
    expect(await runIngestionStep("s1")).toEqual({ done: false });
    expect(h.chunkSections).toHaveBeenCalledTimes(1);
    expect(h.chunkSections.mock.calls[0][0]).toHaveLength(20);
    expect((last().cursor as { pdfPage: number }).pdfPage).toBe(20);
    expect(last().status).toBe("processing");
  });

  it("finishes on the next invocation: purge, counters, status ready", async () => {
    h.state.ds = ds({ cursor: { pdfPage: 20, keepHashes: ["old"] } });
    h.loadPdfSections.mockResolvedValue(sections(35));
    expect(await runIngestionStep("s1")).toEqual({ done: true });
    expect(h.chunkSections.mock.calls[0][0]).toHaveLength(15);
    expect(h.purgeOrphans).toHaveBeenCalledTimes(1);
    expect(last()).toMatchObject({ status: "ready", error: null, pagesCount: 35, chunksCount: 3 });
  });

  it("marks the source failed with no_content when nothing could be extracted", async () => {
    h.state.ds = ds({});
    h.state.chunkCount = 0;
    h.loadPdfSections.mockResolvedValue(sections(2));
    expect(await runIngestionStep("s1")).toEqual({ done: true });
    expect(last()).toMatchObject({ status: "failed", error: "no_content" });
  });

  it("stops before storing when the global storage budget is exhausted", async () => {
    h.state.ds = ds({});
    h.loadPdfSections.mockResolvedValue(sections(2));
    h.assertGlobalChunkBudget.mockRejectedValueOnce(new Error("global_storage_full"));
    await expect(runIngestionStep("s1")).rejects.toThrow("global_storage_full");
    expect(h.storeChunks).not.toHaveBeenCalled();
  });
});

describe("runIngestionStep: website", () => {
  const page = (n: number, links: string[] = []) => ({ url: `https://site.example/p${n}`, title: `P${n}`, text: `text ${n}`, links });

  it("discovers the URLs, crawls each allowed page and completes", async () => {
    h.state.ds = ds({ type: "url", url: "https://site.example/", blobUrl: null });
    h.discoverUrls.mockResolvedValue(["https://site.example/p1", "https://site.example/p2"]);
    h.crawlPage.mockImplementation(async (u: string) => page(Number(u.slice(-1))));
    expect(await runIngestionStep("s1")).toEqual({ done: true });
    expect(h.crawlPage).toHaveBeenCalledTimes(2);
    expect(last()).toMatchObject({ status: "ready", pagesCount: 2 });
  });

  it("skips pages disallowed by robots.txt and pages that fail to load", async () => {
    h.state.ds = ds({ type: "url", url: "https://site.example/", blobUrl: null });
    h.discoverUrls.mockResolvedValue(["https://site.example/private", "https://site.example/broken", "https://site.example/p3"]);
    h.loadRobots.mockImplementation(async () => (path: string) => !path.startsWith("/private"));
    h.crawlPage.mockImplementation(async (u: string) => (u.endsWith("broken") ? Promise.reject(new Error("500")) : page(3)));
    expect(await runIngestionStep("s1")).toEqual({ done: true });
    expect(h.crawlPage).toHaveBeenCalledTimes(2);
    expect(last()).toMatchObject({ pagesCount: 1 });
  });

  it("follows links found on a page and gives control back every 8 pages", async () => {
    h.state.ds = ds({ type: "url", url: "https://site.example/", blobUrl: null, chatbot: { organizationId: "o1", organization: { plan: "pro" } } });
    h.discoverUrls.mockResolvedValue(Array.from({ length: 10 }, (_, i) => `https://site.example/p${i}`));
    h.crawlPage.mockImplementation(async (u: string) => page(Number(u.slice(-1)), ["https://site.example/extra", "mailto:x"]));
    expect(await runIngestionStep("s1")).toEqual({ done: false });
    expect(h.crawlPage).toHaveBeenCalledTimes(8);
    const cursor = last().cursor as { queue: string[]; seen: string[] };
    expect(cursor.queue.length).toBeGreaterThan(0);
    expect(cursor.seen).toContain("https://site.example/extra");
  });

  it("never crawls beyond the page limit of the plan (25 on Free)", async () => {
    h.state.ds = ds({ type: "url", url: "https://site.example/", blobUrl: null, cursor: { queue: ["https://site.example/z"], seen: [], pagesDone: 25 } });
    expect(await runIngestionStep("s1")).toEqual({ done: true });
    expect(h.crawlPage).not.toHaveBeenCalled();
  });
});

describe("runIngestionStep: Notion", () => {
  it("reads 5 pages per invocation, then finishes with the rest", async () => {
    h.loadNotionPage.mockImplementation(async (_c: unknown, id: string) => ({ text: `notion ${id}`, title: id, url: null }));
    h.state.ds = ds({ type: "notion", blobUrl: null, notionPageIds: ["a", "b", "c", "d", "e", "f", "g"] });
    expect(await runIngestionStep("s1")).toEqual({ done: false });
    expect(h.loadNotionPage).toHaveBeenCalledTimes(5);
    expect((last().cursor as { queue: string[] }).queue).toEqual(["f", "g"]);

    h.state.ds = ds({ type: "notion", blobUrl: null, notionPageIds: ["a", "b", "c", "d", "e", "f", "g"], cursor: { queue: ["f", "g"], pagesDone: 5 } });
    expect(await runIngestionStep("s1")).toEqual({ done: true });
    expect(last()).toMatchObject({ status: "ready", pagesCount: 7 });
  });
});
