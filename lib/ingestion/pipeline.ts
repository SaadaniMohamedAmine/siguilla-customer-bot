import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { chunkSections, type RawSection } from "./chunk";
import { storeChunks, purgeOrphans } from "./store";
import { loadPdfSections } from "./pdf";
import { discoverUrls, crawlPage, loadRobots, normalizeUrl } from "./crawler";
import { notionClient, loadNotionPage } from "./notion";
import { assertGlobalChunkBudget } from "./guards";
import { getPlanLimits } from "@/lib/billing/plans";

type Cursor = {
  phase?: "discover" | "process" | "finalize";
  queue?: string[]; // url: URLs restantes ; notion: pageIds restants
  seen?: string[]; // url: URLs déjà vues
  pdfPage?: number; // pdf: prochaine page
  pdfTotal?: number;
  keepHashes?: string[]; // hashes du contenu courant (pour purger les orphelins en fin de sync)
  pagesDone?: number;
};

const BUDGET_MS = 240_000;

export async function runIngestionStep(dataSourceId: string): Promise<{ done: boolean }> {
  const started = Date.now();
  const ds = await prisma.dataSource.findUniqueOrThrow({
    where: { id: dataSourceId },
    include: { chatbot: { include: { organization: true } } },
  });
  const cursor: Cursor = (ds.cursor as Cursor) ?? {};
  const keep = new Set(cursor.keepHashes ?? []);
  let pagesDone = cursor.pagesDone ?? 0;

  const save = async (patch: Partial<Cursor>, progress: Record<string, unknown>) =>
    prisma.dataSource.update({
      where: { id: ds.id },
      data: {
        status: "processing",
        cursor: { ...cursor, ...patch, keepHashes: [...keep], pagesDone } as Prisma.InputJsonValue,
        progress: progress as Prisma.InputJsonValue,
      },
    });

  const ingest = async (sections: RawSection[]) => {
    const chunks = await chunkSections(sections);
    chunks.forEach((c) => keep.add(c.contentHash));
    await assertGlobalChunkBudget(chunks.length);
    await storeChunks(ds.chatbotId, ds.id, chunks);
  };

  if (ds.type === "pdf") {
    const sections = await loadPdfSections(ds.blobUrl!, ds.name);
    const from = cursor.pdfPage ?? 0;
    const STEP = 20;
    await ingest(sections.slice(from, from + STEP));
    pagesDone = Math.min(sections.length, from + STEP);
    if (pagesDone < sections.length) {
      await save({ pdfPage: pagesDone, pdfTotal: sections.length }, { done: pagesDone, total: sections.length, phase: "embedding" });
      return { done: false };
    }
  }

  if (ds.type === "url") {
    const max = getPlanLimits(ds.chatbot.organization.plan).pagesPerSite;
    let queue = cursor.queue;
    const seen = new Set(cursor.seen ?? []);
    if (!queue) {
      queue = await discoverUrls(ds.url!, max);
      queue.forEach((u) => seen.add(u));
    }
    const allowed = await loadRobots(new URL(ds.url!).origin);
    while (queue.length && pagesDone < max && Date.now() - started < BUDGET_MS) {
      const url = queue.shift()!;
      if (!allowed(new URL(url).pathname)) continue;
      const page = await crawlPage(url).catch(() => null);
      if (!page) continue;
      pagesDone++;
      await ingest([{ text: page.text, title: page.title, url: page.url }]);
      for (const l of page.links) {
        const n = normalizeUrl(l);
        if (n && !seen.has(n) && seen.size < max * 3) {
          seen.add(n);
          queue.push(n);
        }
      }
      if (pagesDone % 8 === 0) {
        await save({ queue, seen: [...seen] }, { done: pagesDone, total: Math.min(max, pagesDone + queue.length), phase: "crawling" });
        return { done: false }; // rend la main : prochaine invocation
      }
    }
    if (queue.length && pagesDone < max) {
      await save({ queue, seen: [...seen] }, { done: pagesDone, total: Math.min(max, pagesDone + queue.length), phase: "crawling" });
      return { done: false };
    }
  }

  if (ds.type === "notion") {
    const conn = await prisma.notionConnection.findUniqueOrThrow({ where: { organizationId: ds.chatbot.organizationId } });
    const client = notionClient(conn.accessTokenEnc);
    const queue = cursor.queue ?? [...ds.notionPageIds];
    let n = 0;
    while (queue.length && n < 5 && Date.now() - started < BUDGET_MS) {
      const pageId = queue.shift()!;
      await ingest([await loadNotionPage(client, pageId)]);
      pagesDone++;
      n++;
    }
    if (queue.length) {
      await save({ queue }, { done: pagesDone, total: ds.notionPageIds.length, phase: "reading" });
      return { done: false };
    }
  }

  // Finalisation : purge des chunks obsolètes (re-sync), compteurs, statut.
  await purgeOrphans(ds.id, [...keep]);
  const chunksCount = await prisma.chunk.count({ where: { dataSourceId: ds.id } });
  await prisma.dataSource.update({
    where: { id: ds.id },
    data: {
      status: chunksCount > 0 ? "ready" : "failed",
      error: chunksCount > 0 ? null : "no_content",
      pagesCount: pagesDone,
      chunksCount,
      cursor: {},
      progress: { done: pagesDone, total: pagesDone, phase: "ready" },
      lastSyncedAt: new Date(),
    },
  });
  return { done: true };
}
