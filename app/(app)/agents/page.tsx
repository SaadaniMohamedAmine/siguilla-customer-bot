import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireOrgPage } from "@/lib/session";
import { getPlanLimits } from "@/lib/billing/plans";
import { daysAgo } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { AgentsGrid, type AgentItem } from "@/components/agents/agents-grid";
import { AddIcon, ArrowRightIcon, AgentIcon, CopyIcon, UploadIcon } from "@/lib/icons";
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
      dataSources: { select: { lastSyncedAt: true, status: true } },
    },
  });

  const items: AgentItem[] = await Promise.all(
    agents.map(async (agent) => {
      const convFilter = {
        chatbotId: agent.id,
        createdAt: { gte: daysAgo(30) },
        visitorId: { not: { startsWith: "playground:" as const } },
      };
      const [up, down, unanswered] = await Promise.all([
        prisma.message.count({ where: { feedback: "up", conversation: convFilter } }),
        prisma.message.count({ where: { feedback: "down", conversation: convFilter } }),
        prisma.analyticsEvent.count({
          where: { chatbotId: agent.id, type: "fallback", createdAt: { gte: daysAgo(30) } },
        }),
      ]);
      const lastSynced = agent.dataSources.reduce<Date | null>(
        (max, s) => (s.lastSyncedAt && (!max || s.lastSyncedAt > max) ? s.lastSyncedAt : max),
        null,
      );
      return {
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          publicKey: agent.publicKey,
        },
        metrics: {
          sources: agent._count.dataSources,
          conversations: agent._count.conversations,
          satisfaction: up + down > 0 ? up / (up + down) : null,
          lastSynced,
        },
        health: {
          processing: agent.dataSources.filter((s) => s.status === "queued" || s.status === "processing").length,
          failed: agent.dataSources.filter((s) => s.status === "failed").length,
          unanswered,
        },
      };
    }),
  );

  const atLimit = agents.length >= limits.agents;
  const ratio = limits.agents > 0 ? Math.min(1, agents.length / limits.agents) : 0;

  const steps = [
    { icon: AgentIcon, title: tAgents("empty.step1Title"), body: tAgents("empty.step1Body") },
    { icon: UploadIcon, title: tAgents("empty.step2Title"), body: tAgents("empty.step2Body") },
    { icon: CopyIcon, title: tAgents("empty.step3Title"), body: tAgents("empty.step3Body") },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text font-serif">{tAgents("title")}</h1>
          <p className="text-body text-text-muted mt-2 max-w-xl">{tAgents("subtitle")}</p>
        </div>
        {agents.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="hidden min-w-[150px] sm:block">
              <p className="text-small text-text-muted font-mono">
                {tAgents("usage", { used: agents.length, limit: limits.agents })}
              </p>
              <div className="bg-surface-raised mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${atLimit ? "bg-warning" : "bg-accent"}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            </div>
            {atLimit ? (
              <Link href="/settings?tab=billing">
                <Button>
                  {tAgents("upgradeMore")}
                  <Icon icon={ArrowRightIcon} size={16} />
                </Button>
              </Link>
            ) : (
              <Link href="/agents/new">
                <Button>
                  <Icon icon={AddIcon} size={16} />
                  {tAgents("newAgent")}
                </Button>
              </Link>
            )}
          </div>
        ) : null}
      </div>

      {agents.length === 0 ? (
        <div className="border-border bg-surface mx-auto mt-6 max-w-3xl rounded-lg border p-10 text-center">
          <span className="border-border bg-bg text-link mx-auto flex size-14 items-center justify-center rounded-full border">
            <Icon icon={AgentIcon} size={26} />
          </span>
          <h2 className="text-h2 text-text mt-5 font-serif">{t("agentsTitle")}</h2>
          <p className="text-body-lg text-text-muted mx-auto mt-2 max-w-md">{t("agentsBody")}</p>
          <ol className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="border-border bg-bg rounded-md border p-4">
                <p className="text-link font-serif text-[22px] italic">{String(i + 1).padStart(2, "0")}</p>
                <p className="text-body text-text mt-1 font-medium">{s.title}</p>
                <p className="text-small text-text-muted mt-1">{s.body}</p>
              </li>
            ))}
          </ol>
          <Link href="/agents/new" className="mt-8 inline-block">
            <Button size="lg">{t("agentsCta")}</Button>
          </Link>
        </div>
      ) : (
        <AgentsGrid items={items} atLimit={atLimit} limit={limits.agents} />
      )}
    </div>
  );
}
