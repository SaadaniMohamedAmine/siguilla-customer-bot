import { prisma } from "@/lib/db";
import { generateQueryEmbedding } from "@/lib/ai/orchestrator";
import type { RetrievedChunk } from "./types";

export const TOP_K = 6;

export async function retrieve(chatbotId: string, query: string, k = TOP_K): Promise<RetrievedChunk[]> {
  const vector = await generateQueryEmbedding(query);
  const literal = `[${vector.join(",")}]`;
  // ef_search plus élevé = meilleur rappel HNSW pour un coût négligeable à cette échelle.
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL hnsw.ef_search = 80");
    return tx.$queryRaw<RetrievedChunk[]>`
      SELECT "id", "content", "sourceTitle", "sourceUrl", "pageNumber",
             1 - ("embedding" <=> ${literal}::vector) AS "score"
      FROM "Chunk"
      WHERE "chatbotId" = ${chatbotId} AND "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${literal}::vector
      LIMIT ${k}`;
  });
  return rows.map((r) => ({ ...r, score: Number(r.score) }));
}
