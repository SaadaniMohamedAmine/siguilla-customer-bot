import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getKpis } from "@/lib/analytics/queries";
import { daysAgo } from "@/lib/time";
import { EmbedSnippet } from "@/components/widget/embed-snippet";
import { StatusPill } from "@/components/ui/status-pill";

export default async function AgentOverviewPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const t = await getTranslations("Agents.overview");
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  const [kpis, recent, sources] = await Promise.all([
    getKpis({ organizationId: org.id, chatbotId: id }, 30),
    prisma.conversation.findMany({
      where: { chatbotId: id, visitorId: { not: { startsWith: "playground:" } } },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } } },
    }),
    prisma.dataSource.findMany({ where: { chatbotId: id }, select: { status: true } }),
  ]);

  const unanswered = await prisma.analyticsEvent.count({
    where: { chatbotId: id, type: "fallback", createdAt: { gte: daysAgo(30) } },
  });

  const ready = sources.filter((s) => s.status === "ready").length;
  const processing = sources.filter((s) => s.status === "queued" || s.status === "processing").length;
  const failed = sources.filter((s) => s.status === "failed").length;

  const pct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : "—");

  return (
    <div className="flex flex-col gap-8">
      {chatbot.status === "draft" ? (
        <div className="border-warning/30 bg-warning/10 text-small text-warning rounded-sm border p-4">
          This agent is a draft. Publish it from the Widget tab to answer visitors.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Conversations" value={String(kpis.conversations)} />
        <Kpi label="Resolved without a human" value={pct(kpis.resolvedWithoutHuman)} />
        <Kpi label="Satisfaction" value={pct(kpis.satisfaction)} />
        <Kpi label="Fallback rate" value={pct(kpis.fallbackRate)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border rounded-md border p-5">
          <p className="label-caps mb-3">{t("recentConversations")}</p>
          {recent.length === 0 ? (
            <p className="text-small text-text-muted">{t("noneYet")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link href={`/conversations/${c.id}`} className="hover:text-link block">
                    <div className="flex items-center justify-between">
                      <span className="text-body text-text">
                        Visitor #{c.visitorId.slice(-4).toUpperCase()}
                      </span>
                      <StatusPill
                        tone={
                          c.status === "handoff_requested"
                            ? "warning"
                            : c.status === "human"
                              ? "accent"
                              : c.status === "resolved"
                                ? "success"
                                : "neutral"
                        }
                      >
                        {c.status}
                      </StatusPill>
                    </div>
                    <p className="text-small text-text-muted truncate">{c.messages[0]?.content ?? "—"}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-border rounded-md border p-5">
          <p className="label-caps mb-3">{t("knowledgeHealth")}</p>
          <div className="text-small grid grid-cols-3 gap-3 font-mono">
            <div>
              <p className="text-text">{ready}</p>
              <p className="text-text-muted">{t("ready")}</p>
            </div>
            <div>
              <p className="text-text">{processing}</p>
              <p className="text-text-muted">{t("processing")}</p>
            </div>
            <div>
              <p className="text-text">{failed}</p>
              <p className="text-text-muted">{t("failed")}</p>
            </div>
          </div>
          <p className="text-small text-text-muted mt-4">
            {t("unanswered30d")}: <span className="text-text font-mono">{unanswered}</span>{" "}
            <Link href={`/analytics?agent=${id}`} className="text-link hover:underline">
              {t("viewAnalytics")}
            </Link>
          </p>
        </div>
      </div>

      <div className="border-border rounded-md border p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-caps">{t("embed")}</p>
          <Link href={`/agents/${id}/widget`} className="text-small text-link hover:underline">
            {t("customizeWidget")}
          </Link>
        </div>
        <EmbedSnippet publicKey={chatbot.publicKey} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-md border p-4">
      <p className="label-caps">{label}</p>
      <p className="text-kpi text-text mt-1 font-serif">{value}</p>
    </div>
  );
}
