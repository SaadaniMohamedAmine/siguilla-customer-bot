import { describe, it, expect, afterEach, vi } from "vitest";

// Pas de vrai DNS en test : tout nom de domaine résout vers une IP publique.
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

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

  it("refuses private or local start URLs without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(crawlPage("http://127.0.0.1/admin")).rejects.toThrow("invalid_url");
    await expect(crawlPage("http://169.254.169.254/latest/meta-data")).rejects.toThrow("invalid_url");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a redirect to a private address", async () => {
    const fetchMock = vi.fn(
      async () => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(crawlPage("https://example.com/redirect")).rejects.toThrow("invalid_url");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows a public redirect but stops after 3 hops", async () => {
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 302, headers: { location: `https://example.com/hop${++n}` } })),
    );
    await expect(crawlPage("https://example.com/loop")).rejects.toThrow("too_many_redirects");
    expect(n).toBe(4);
  });
});
