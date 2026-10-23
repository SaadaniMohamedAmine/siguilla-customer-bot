import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const destroy = vi.fn(async () => {});
const getText = vi.fn();

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getText = getText;
    destroy = destroy;
  },
}));
vi.mock("@/lib/crypto", () => ({ sign: vi.fn(() => "signed-body") }));

import { extractPdfText, loadPdfSections } from "@/lib/ingestion/pdf";
import { triggerIngestion } from "@/lib/ingestion/trigger";

const NUL = String.fromCharCode(0);

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractPdfText", () => {
  it("returns per-page text and the page count, and always frees the parser", async () => {
    getText.mockResolvedValue({ total: 2, pages: [{ num: 1, text: "Page one" }, { num: 2, text: "Page two" }] });
    const out = await extractPdfText(Buffer.from("pdf"));
    expect(out).toEqual({ pageCount: 2, pages: [{ pageNumber: 1, text: "Page one" }, { pageNumber: 2, text: "Page two" }] });
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("strips NUL bytes that Postgres UTF8 would reject", async () => {
    getText.mockResolvedValue({ total: 1, pages: [{ num: 1, text: `a${NUL}b${NUL}c` }] });
    const out = await extractPdfText(Buffer.from("pdf"));
    expect(out.pages[0].text).toBe("abc");
  });

  it("frees the parser even when extraction fails", async () => {
    getText.mockRejectedValue(new Error("corrupt"));
    await expect(extractPdfText(Buffer.from("junk"))).rejects.toThrow("corrupt");
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});

describe("loadPdfSections", () => {
  it("downloads the blob and maps each page to a section with its page number", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })));
    getText.mockResolvedValue({ total: 2, pages: [{ num: 1, text: "A" }, { num: 2, text: "B" }] });
    const sections = await loadPdfSections("https://blob.example/x.pdf", "Shipping.pdf");
    expect(sections).toEqual([
      { text: "A", title: "Shipping.pdf", pageNumber: 1, url: null },
      { text: "B", title: "Shipping.pdf", pageNumber: 2, url: null },
    ]);
  });

  it("fails with a precise code when the blob cannot be downloaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    await expect(loadPdfSections("https://blob.example/gone.pdf", "x")).rejects.toThrow("blob_download_failed_404");
  });
});

describe("triggerIngestion", () => {
  it("posts the signed payload to the internal workflow route", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await triggerIngestion("source-42");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://app.example/api/workflows/ingest");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-sigilla-signature"]).toBe("signed-body");
    expect(JSON.parse(init.body as string).dataSourceId).toBe("source-42");
  });
});
