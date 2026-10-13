import { prisma } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing/plans";

export class LimitError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function assertCanAddSource(orgId: string, chatbotId: string, type: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const limits = getPlanLimits(org.plan);
  const count = await prisma.dataSource.count({ where: { chatbotId } });
  if (count >= limits.sourcesPerAgent) throw new LimitError("sources_limit");
  if (type === "notion" && !limits.notion) throw new LimitError("notion_requires_pro");
}

export async function assertGlobalChunkBudget(extra: number) {
  const total = await prisma.chunk.count();
  const max = Number(process.env.MAX_TOTAL_CHUNKS ?? 60000);
  if (total + extra > max) throw new LimitError("global_storage_full");
}
