import { prisma } from "@/lib/db";
import { generateEmbeddingsBatch } from "@/lib/ai/orchestrator";
import type { PreparedChunk } from "./chunk";

const toVector = (v: number[]) => `[${v.join(",")}]`;

/**
 * Insère uniquement les chunks dont le hash n'existe pas encore pour cette source
 * (re-sync incrémentale). Retourne le nombre de chunks créés.
 */
export async function storeChunks(chatbotId: string, dataSourceId: string, chunks: PreparedChunk[]): Promise<number> {
  if (chunks.length === 0) return 0;
  const existing = await prisma.chunk.findMany({
    where: { dataSourceId, contentHash: { in: chunks.map((c) => c.contentHash) } },
    select: { contentHash: true },
  });
  const known = new Set(existing.map((e) => e.contentHash));
  const fresh = chunks.filter((c) => !known.has(c.contentHash));
  if (fresh.length === 0) return 0;

  const vectors = await generateEmbeddingsBatch(fresh.map((c) => c.content));

  // Insertion en SQL brut (le type vector n'est pas supporté par le client Prisma).
  for (let i = 0; i < fresh.length; i++) {
    const c = fresh[i];
    await prisma.$executeRaw`
      INSERT INTO "Chunk" ("id","dataSourceId","chatbotId","content","embedding","sourceTitle","sourceUrl","pageNumber","contentHash","createdAt")
      VALUES (${crypto.randomUUID()}, ${dataSourceId}, ${chatbotId}, ${c.content}, ${toVector(vectors[i])}::vector,
              ${c.sourceTitle}, ${c.sourceUrl}, ${c.pageNumber}, ${c.contentHash}, now())
      ON CONFLICT ("dataSourceId","contentHash") DO NOTHING`;
  }
  return fresh.length;
}

/** Supprime les chunks de la source qui ne font plus partie du contenu courant. */
export async function purgeOrphans(dataSourceId: string, keepHashes: string[]): Promise<number> {
  const res = await prisma.chunk.deleteMany({ where: { dataSourceId, contentHash: { notIn: keepHashes } } });
  return res.count;
}
