import { prisma } from "@/lib/db";
import { getPlanLimits } from "./plans";

const isNewMonth = (start: Date, now: Date) =>
  now.getUTCFullYear() !== start.getUTCFullYear() || now.getUTCMonth() !== start.getUTCMonth();

export class QuotaExceededError extends Error {
  constructor() {
    super("quota_exceeded");
  }
}

export async function getUsage(orgId: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const now = new Date();
  let used = org.messageCount;
  if (isNewMonth(org.usagePeriodStart, now)) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { messageCount: 0, usagePeriodStart: now },
    });
    used = 0;
  }
  const limits = getPlanLimits(org.plan);
  const [agents, sources, members] = await Promise.all([
    prisma.chatbot.count({ where: { organizationId: orgId } }),
    prisma.dataSource.count({ where: { chatbot: { organizationId: orgId } } }),
    prisma.member.count({ where: { organizationId: orgId } }),
  ]);
  return {
    plan: org.plan,
    limits,
    messages: { used, limit: limits.messagesPerMonth },
    agents: { used: agents, limit: limits.agents },
    sources: { used: sources, limit: limits.sourcesPerAgent * limits.agents },
    members: { used: members, limit: limits.members },
    periodStart: isNewMonth(org.usagePeriodStart, now) ? now : org.usagePeriodStart,
  };
}

export async function assertWithinQuota(orgId: string) {
  const { messages } = await getUsage(orgId);
  if (messages.used >= messages.limit) throw new QuotaExceededError();
}

/** Incrément atomique (pas de lecture-écriture concurrente). */
export async function incrementMessageUsage(orgId: string) {
  await prisma.organization.update({ where: { id: orgId }, data: { messageCount: { increment: 1 } } });
}
