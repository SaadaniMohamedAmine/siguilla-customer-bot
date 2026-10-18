import * as cheerio from "cheerio";
import { Agent } from "undici";
import { assertPublicUrl, safeLookup } from "./safe-url";

const UA = "SigillaBot/1.0 (+https://sigilla.app/bot)";
const PAGE_TIMEOUT_MS = 10_000;
const POLITENESS_MS = 250;
const MAX_REDIRECTS = 3;

// Revalide l'IP au moment de la connexion (anti DNS rebinding), en plus de assertPublicUrl.
const dispatcher = new Agent({ connect: { lookup: safeLookup } });

export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const u = new URL(raw, base);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"].forEach((p) =>
      u.searchParams.delete(p),
    );
    if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return null;
  }
}

const SKIP_EXT = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|mp3|css|js|json|xml|woff2?)$/i;

/** Anti-SSRF : chaque URL (y compris chaque redirection) est validée comme publique avant d'être fetchée. */
async function fetchText(url: string): Promise<{ status: number; type: string; body: string }> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PAGE_TIMEOUT_MS);
    try {
      const res = await fetch(current, {
        headers: { "user-agent": UA, accept: "text/html,application/xml" },
        redirect: "manual",
        signal: ctrl.signal,
        dispatcher,
      } as RequestInit);
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return { status: res.status, type: "", body: "" };
        current = new URL(location, current).toString();
        continue;
      }
      return { status: res.status, type: res.headers.get("content-type") ?? "", body: res.ok ? await res.text() : "" };
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error("too_many_redirects");
}

/** Règles Disallow pour User-agent: * (simplifié, suffisant ici). */
export async function loadRobots(origin: string): Promise<(path: string) => boolean> {
  const { body } = await fetchText(`${origin}/robots.txt`).catch(() => ({ body: "" }) as { body: string });
  const disallow: string[] = [];
  let applies = false;
  for (const line of body.split("\n")) {
    const [k, ...rest] = line.split(":");
    const v = rest.join(":").trim();
    if (/^user-agent$/i.test(k.trim())) applies = v === "*" || /sigilla/i.test(v);
    else if (applies && /^disallow$/i.test(k.trim()) && v) disallow.push(v);
  }
  return (path) => !disallow.some((d) => path.startsWith(d));
}

/** Découverte initiale : sitemap.xml (et sitemap index, 1 niveau) sinon la page d'entrée. */
export async function discoverUrls(startUrl: string, max: number): Promise<string[]> {
  const origin = new URL(startUrl).origin;
  const found = new Set<string>();
  const { body } = await fetchText(`${origin}/sitemap.xml`).catch(() => ({ body: "" }) as { body: string });
  if (body.includes("<loc>")) {
    const $ = cheerio.load(body, { xmlMode: true });
    const locs = $("loc")
      .map((_, el) => $(el).text().trim())
      .get();
    const nested = locs
      .filter((l) => l.endsWith(".xml") && normalizeUrl(l) !== null && new URL(l).origin === origin)
      .slice(0, 5);
    for (const l of locs) if (!l.endsWith(".xml")) found.add(l);
    for (const n of nested) {
      const sub = await fetchText(n).catch(() => ({ body: "" }) as { body: string });
      const $$ = cheerio.load(sub.body, { xmlMode: true });
      $$("loc").each((_, el) => {
        found.add($$(el).text().trim());
      });
    }
  }
  const list = [...found].map((u) => normalizeUrl(u)).filter((u): u is string => !!u && new URL(u).origin === origin);
  return list.length ? list.slice(0, max) : [normalizeUrl(startUrl)!];
}

export type CrawledPage = { url: string; title: string; text: string; links: string[] };

export async function crawlPage(url: string): Promise<CrawledPage | null> {
  await new Promise((r) => setTimeout(r, POLITENESS_MS));
  const { status, type, body } = await fetchText(url);
  if (status >= 400 || !type.includes("text/html") || !body) return null;
  const $ = cheerio.load(body);
  $("script,style,noscript,svg,iframe,nav,header,footer,form,aside,[role=navigation],[aria-hidden=true],.cookie,#cookie-banner").remove();
  const title = ($("meta[property='og:title']").attr("content") || $("title").text() || url).trim().slice(0, 200);
  const main = $("main").length ? $("main") : $("article").length ? $("article") : $("body");
  const text = main
    .find("h1,h2,h3,h4,p,li,td,th,blockquote,pre,dt,dd")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join("\n");
  const origin = new URL(url).origin;
  const links = $("a[href]")
    .map((_, el) => normalizeUrl($(el).attr("href")!, url))
    .get()
    .filter((u): u is string => !!u && new URL(u).origin === origin && !SKIP_EXT.test(new URL(u).pathname));
  return { url, title, text, links: [...new Set(links)] };
}
