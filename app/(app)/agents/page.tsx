import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireOrgPage } from "@/lib/session";
import { getPlanLimits } from "@/lib/billing/plans";
import { daysAgo } from "@/lib/time";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentIcon, AddIcon } from "@/lib/icons";
import { Icon } from "@/components/ui/icon";

export default async function AgentsPage() {
  const t = await getTranslations("Empty");
  const tAgents = await getTranslations("Agents");
  const { org } = await requireOrgPage();
  const limits = getPlanLimits(org.plan);

  const agents = await prisma.chatbot.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          dataSources: true,
          conversations: {
            where: { createdAt: { gte: daysAgo(30) }, visitorId: { not: { startsWith: "playground:" } } },
          },
        },
      },
      dataSources: { select: { lastSyncedAt: true } },
    },
  });

  const metrics = await Promise.all(
    agents.map(async (agent) => {
      const convFilter = {
        chatbotId: agent.id,
        createdAt: { gte: daysAgo(30) },
        visitorId: { not: { startsWith: "playground:" as const } },
      };
      const [up, down] = await Promise.all([
        prisma.message.count({ where: { feedback: "up", conversation: convFilter } }),
        prisma.message.count({ where: { feedback: "down", conversation: convFilter } }),
      ]);
      const lastSynced = agent.dataSources.reduce<Date | null>(
        (max, s) => (s.lastSyncedAt && (!max || s.lastSyncedAt > max) ? s.lastSyncedAt : max),
        null,
      );
      return {
        id: agent.id,
        sources: agent._count.dataSources,
        conversations: agent._count.conversations,
        satisfaction: up + down > 0 ? up / (up + down) : null,
        lastSynced,
      };
    }),
  );
  const metricsById = new Map(metrics.map((m) => [m.id, m]));

  const atLimit = agents.length >= limits.agents;

  const newAgentButton = (
    <Link href={atLimit ? "#" : "/agents/new"} aria-disabled={atLimit} tabIndex={atLimit ? -1 : undefined}>
      <Button disabled={atLimit}>
        <Icon icon={AddIcon} size={16} />
        {tAgents("newAgent")}
      </Button>
    </Link>
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-h1 text-text font-serif">{tAgents("title")}</h1>
        {agents.length > 0 ? (
          atLimit ? (
            <Tooltip>
              <TooltipTrigger asChild>{newAgentButton}</TooltipTrigger>
              <TooltipContent className="border-border bg-surface-raised text-small text-text z-50 max-w-xs rounded-sm border px-3 py-2 shadow-[var(--shadow-lift)]">
                {tAgents("planLimit", { n: limits.agents })}
              </TooltipContent>
            </Tooltip>
          ) : (
            newAgentButton
          )
        ) : null}
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={AgentIcon}
          title={t("agentsTitle")}
          description={t("agentsBody")}
          action={
            <Link href="/agents/new">
              <Button>{t("agentsCta")}</Button>
            </Link>
          }
          className="mt-10"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={{
                id: agent.id,
                name: agent.name,
                description: agent.description,
                status: agent.status,
                publicKey: agent.publicKey,
              }}
              metrics={metricsById.get(agent.id)!}
            />
          ))}
          {!atLimit ? (
            <Link
              href="/agents/new"
              className="border-border text-body text-text-muted hover:border-focus hover:text-text flex h-full min-h-[160px] items-center justify-center rounded-md border border-dashed transition-colors"
            >
              <span className="flex items-center gap-2">
                <Icon icon={AddIcon} size={16} />
                {tAgents("createCard")}
              </span>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
