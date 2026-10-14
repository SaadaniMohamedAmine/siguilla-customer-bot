import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";

export type DemoSite = "atelier-lune" | "ledgerline";

const PAGES: Record<DemoSite, { slug: string; title: string }[]> = {
  "atelier-lune": [
    { slug: "shipping", title: "Shipping Policy" },
    { slug: "returns", title: "Returns & Exchanges" },
    { slug: "care-guide", title: "Candle Care Guide" },
    { slug: "collections", title: "Our Collections" },
    { slug: "bespoke", title: "Bespoke & Gifting" },
    { slug: "faq", title: "FAQ" },
  ],
  ledgerline: [
    { slug: "getting-started", title: "Getting Started" },
    { slug: "invoices", title: "Invoices" },
    { slug: "bank-sync", title: "Bank Sync" },
    { slug: "vat", title: "VAT" },
    { slug: "plans-billing", title: "Plans & Billing" },
    { slug: "security", title: "Security" },
  ],
};

const AGENT_NAME: Record<DemoSite, string> = {
  "atelier-lune": "Atelier Lune — Concierge",
  ledgerline: "Ledgerline — Help Center",
};

export function getDemoPages(site: DemoSite) {
  return PAGES[site];
}

export function getDemoPageTitle(site: DemoSite, slug: string) {
  return PAGES[site].find((p) => p.slug === slug)?.title ?? slug;
}

export function getDemoContent(site: DemoSite, slug: string): string | null {
  const dir = path.join(process.cwd(), "content", "demo", site);
  const file = path.join(dir, `${slug}.md`);
  if (!file.startsWith(dir) || !fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

let cache: Partial<Record<DemoSite, { key: string; until: number }>> = {};

/** publicKey de l'agent de démo du site, caché 1h (évite une requête DB à chaque rendu). */
export async function getDemoBotKey(site: DemoSite): Promise<string | null> {
  const cached = cache[site];
  if (cached && cached.until > Date.now()) return cached.key;
  const bot = await prisma.chatbot.findFirst({
    where: { name: AGENT_NAME[site], organization: { isDemo: true } },
    select: { publicKey: true },
  });
  if (!bot) return null;
  cache = { ...cache, [site]: { key: bot.publicKey, until: Date.now() + 3_600_000 } };
  return bot.publicKey;
}
