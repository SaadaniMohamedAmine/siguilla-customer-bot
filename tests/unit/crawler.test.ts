import { describe, it, expect, afterEach, vi } from "vitest";
import { normalizeUrl, loadRobots, crawlPage } from "@/lib/ingestion/crawler";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeUrl", () => {
  it("strips the hash, utm params and a trailing slash", () => {
    expect(normalizeUrl("https://example.com/path/?utm_source=x&a=1#section")).toBe(
      "https://example.com/path?a=1",
    );
    expect(normalizeUrl("https://example.com/path/")).toBe("https://example.com/path");
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("rejects non-http(s) protocols and invalid URLs", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("not a url", undefined)).toBeNull();
  });
});

describe("loadRobots", () => {
  it("blocks paths disallowed for * or for sigilla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response("User-agent: *\nDisallow: /private\nDisallow: /admin\n", { status: 200 }),
      ),
    );
    const allowed = await loadRobots("https://example.com");
    expect(allowed("/private/page")).toBe(false);
    expect(allowed("/admin")).toBe(false);
    expect(allowed("/public")).toBe(true);
  });
});

describe("crawlPage", () => {
  it("strips nav/footer/script and keeps only same-origin links", async () => {
    const html = `<html><head><title>Page</title></head><body>
      <nav>Nav</nav>
      <main><h1>Hello</h1><p>World</p><a href="/other">Other</a><a href="https://external.com/x">Ext</a></main>
      <footer>Footer</footer>
      <script>evil()</script>
    </body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(html, { status: 200, headers: { "content-type": "text/html" } })),
    );
    const page = await crawlPage("https://example.com/page");
    expect(page).not.toBeNull();
    expect(page!.text).toContain("Hello");
    expect(page!.text).not.toContain("Nav");
    expect(page!.text).not.toContain("Footer");
    expect(page!.links).toEqual(["https://example.com/other"]);
  });

  it("returns null for a non-HTML or error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );
    expect(await crawlPage("https://example.com/missing")).toBeNull();
  });
});
