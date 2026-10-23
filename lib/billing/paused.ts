import { prisma } from "@/lib/db";
import { getPlanLimits } from "./plans";

/**
 * Agents « en pause » : quand une organisation repasse sur une offre qui autorise moins d'agents (résiliation, rétrogradation),
 * rien n'est supprimé. Les N agents les plus anciens (N = limite de l'offre) restent actifs ; les autres sont en pause :
 * leur widget et l'API répondent comme à quota dépassé, et le tableau de bord les signale.
 */
export function splitByPlanLimit<T>(agentsOldestFirst: T[], limit: number): { active: T[]; paused: T[] } {
  const n = Math.max(0, limit);
  return { active: agentsOldestFirst.slice(0, n), paused: agentsOldestFirst.slice(n) };
}

export async function pausedAgentIds(organizationId: string, plan: string): Promise<Set<string>> {
  const limit = getPlanLimits(plan).agents;
  const rows = await prisma.chatbot.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
    skip: limit,
  });
  return new Set(rows.map((r) => r.id));
}

export async function isAgentPaused(organizationId: string, plan: string, chatbotId: string): Promise<boolean> {
  return (await pausedAgentIds(organizationId, plan)).has(chatbotId);
}
