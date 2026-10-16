import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDemoSiteByAgentName } from "@/lib/demo-sites";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon, GlobeIcon, WarningIcon } from "@/lib/icons";
import { getKpis } from "@/lib/analytics/queries";
import { daysAgo } from "@/lib/time";
import { EmbedSnippet } from "@/components/widget/embed-snippet";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "bad";
const TONE_TEXT: Record<Tone, string> = { good: "text-success", warn: "text-warning", bad: "text-error" };
const TONE_BG: Record<Tone, string> = { good: "bg-success", warn: "bg-warning", bad: "bg-error" };
const STATUS_DOT = {
  bot: "bg-text-muted",
  handoff_requested: "bg-warning",
  human: "bg-accent",
  resolved: "bg-success",
} as const;

export default async function AgentOverviewPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const t = await getTranslations("Agents.overview");
  const tAgents = await getTranslations("Agents");
  const ta = await getTranslations("Analytics");
  const tc = await getTranslations("Conversations");
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  const [kpis, recent, sources] = await Promise.all([
    getKpis({ organizationId: org.id, chatbotId: id }, 30),
    prisma.conversation.findMany({
      where: { chatbotId: id, visitorId: { not: { startsWith: "playground:" } } },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, role: true } } },
    }),
    prisma.dataSource.findMany({ where: { chatbotId: id }, select: { status: true } }),
  ]);

  const unanswered = await prisma.analyticsEvent.count({
    where: { chatbotId: id, type: "fallback", createdAt: { gte: daysAgo(30) } },
  });

  const ready = sources.filter((s) => s.status === "ready").length;
  const processing = sources.filter((s) => s.status === "queued" || s.status === "processing").length;
  const failed = sources.filter((s) => s.status === "failed").length;
  const demoSite = org.isDemo ? getDemoSiteByAgentName(chatbot.name) : null;

  const pct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : null);
  const toneFor = (v: number | null, good: number, warn: number, invert = false): Tone | undefined => {
    if (v == null) return undefined;
    if (invert) return v <= good ? "good" : v <= warn ? "warn" : "bad";
    return v >= good ? "good" : v >= warn ? "warn" : "bad";
  };

  const kpiTiles: { label: string; help: string; value: string | null; tone?: Tone; empty: string }[] = [
    { label: ta("kpi.conversations"), help: ta("help.conversations"), value: String(kpis.conversations), empty: "—" },
    {
      label: ta("kpi.resolvedWithoutHuman"),
      help: ta("help.resolved"),
      value: pct(kpis.resolvedWithoutHuman),
      tone: toneFor(kpis.resolvedWithoutHuman, 0.8, 0.5),
      empty: ta("noData"),
    },
    {
      label: ta("kpi.satisfaction"),
      help: ta("help.satisfaction"),
      value: pct(kpis.satisfaction),
      tone: toneFor(kpis.satisfaction, 0.8, 0.6),
      empty: ta("notEnoughRatings"),
    },
    {
      label: ta("kpi.fallbackRate"),
      help: ta("help.fallback"),
      value: pct(kpis.fallbackRate),
      tone: toneFor(kpis.fallbackRate, 0.2, 0.4, true),
      empty: ta("noData"),
    },
  ];

  const health = [
    { label: t("ready"), value: ready, tone: "good" as Tone },
    { label: t("processing"), value: processing, tone: "warn" as Tone },
    { label: t("failed"), value: failed, tone: "bad" as Tone },
  ];

  const preview = (m?: { content: string; role: string }) => {
    if (!m) return "—";
    if (m.role !== "system") return m.content;
    if (m.content === "handoff_requested") return tc("system.handoff_requested");
    if (m.content === "resolved") return tc("system.resolved");
    if (m.content.startsWith("agent_joined:")) return tc("system.agent_joined", { name: m.content.slice(13) });
    return m.content;
  };

  return (
    <div className="flex flex-col gap-6">
      {demoSite ? (
        <a
          href={`/${demoSite}`}
          target="_blank"
          rel="noreferrer"
          className="anim-keep group border-link/40 bg-link/10 hover:border-link flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors duration-200"
        >
          <span className="flex items-center gap-3">
            <Icon icon={GlobeIcon} size={20} className="text-link" />
            <span>
              <span className="text-body text-text block font-medium">{tAgents("overview.viewOnSite")}</span>
              <span className="text-small text-text-muted block">{tAgents("overview.viewOnSiteBody")}</span>
            </span>
          </span>
          <Icon
            icon={ArrowRightIcon}
            size={18}
            className="anim-keep text-link transition-transform duration-200 group-hover:translate-x-1"
          />
        </a>
      ) : null}

      {chatbot.status === "draft" ? (
        <div className="border-warning/30 bg-warning/10 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <p className="text-body text-warning flex items-center gap-2">
            <Icon icon={WarningIcon} size={16} />
            {tAgents("draftBanner")}
          </p>
          <Link href={`/agents/${id}/widget`}>
            <Button size="sm">{t("goToWidget")}</Button>
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiTiles.map((k, i) => (
          <Reveal key={k.label} delay={i * 80} className="h-full">
            <div className="border-border bg-surface hover:border-text-muted h-full rounded-lg border p-5 transition-colors duration-300">
              <p className="label-caps flex items-center gap-2">
                {k.tone ? <span aria-hidden className={cn("size-1.5 rounded-full", TONE_BG[k.tone])} /> : null}
                {k.label}
              </p>
              {k.value == null ? (
                <p className="text-body text-text-muted mt-3">{k.empty}</p>
              ) : (
                <p className={cn("text-kpi mt-1 font-serif", k.tone ? TONE_TEXT[k.tone] : "text-text")}>{k.value}</p>
              )}
              <p className="text-small text-text-muted mt-2">{k.help}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal className="h-full">
          <section className="border-border bg-surface h-full rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h3 text-text font-serif">{t("recentConversations")}</h2>
              <Link
                href={`/conversations?agent=${id}`}
                className="group text-small text-link inline-flex items-center gap-1.5"
              >
                {t("viewAll")}
                <Icon
                  icon={ArrowRightIcon}
                  size={13}
                  className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-small text-text-muted">{t("noneYet")}</p>
            ) : (
              <ul className="divide-border divide-y">
                {recent.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/conversations/${c.id}`}
                      className="anim-keep hover:bg-surface-raised -mx-3 flex items-center gap-3 rounded-md px-3 py-3 transition-colors duration-200"
                    >
                      <span className="bg-tint text-link flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px]">
                        {c.visitorId.slice(-4).toUpperCase().slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-body text-text truncate">
                            {tc("visitor", { id: c.visitorId.slice(-4).toUpperCase() })}
                          </span>
                          <span className="text-small text-text-muted flex shrink-0 items-center gap-1.5">
                            <span className={cn("size-2 rounded-full", STATUS_DOT[c.status as keyof typeof STATUS_DOT])} />
                            {tc(`status.${(c.status === "handoff_requested" ? "needsHuman" : c.status) as "bot" | "needsHuman" | "human" | "resolved"}`)}
                          </span>
                        </div>
                        <p className="text-small text-text-muted truncate">{preview(c.messages[0])}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>

        <Reveal delay={100} className="h-full">
          <section className="border-border bg-surface flex h-full flex-col rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-h3 text-text font-serif">{t("knowledgeHealth")}</h2>
              <Link href={`/agents/${id}/sources`} className="group text-small text-link inline-flex items-center gap-1.5">
                {t("manageSources")}
                <Icon
                  icon={ArrowRightIcon}
                  size={13}
                  className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {health.map((h) => (
                <div key={h.label} className="border-border bg-bg rounded-md border p-3">
                  <p className="text-text-muted text-small flex items-center gap-1.5">
                    <span aria-hidden className={cn("size-1.5 rounded-full", h.value > 0 ? TONE_BG[h.tone] : "bg-border")} />
                    {h.label}
                  </p>
                  <p className="text-text mt-1 font-serif text-[28px] leading-none">{h.value}</p>
                </div>
              ))}
            </div>
            <div
              className={cn(
                "mt-4 flex flex-1 flex-wrap items-center justify-between gap-3 rounded-md border p-4",
                unanswered > 0 ? "border-warning/30 bg-warning/10" : "border-border bg-bg",
              )}
            >
              <div>
                <p className="text-small text-text-muted">{t("unanswered30d")}</p>
                <p className={cn("font-serif text-[28px] leading-none", unanswered > 0 ? "text-warning" : "text-text")}>
                  {unanswered}
                </p>
              </div>
              <Link
                href={`/analytics?agent=${id}`}
                className="group text-small text-link inline-flex items-center gap-1.5"
              >
                {t("viewAnalytics")}
                <Icon
                  icon={ArrowRightIcon}
                  size={13}
                  className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </section>
        </Reveal>
      </div>

      <Reveal>
        <section className="border-border bg-surface rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-h3 text-text font-serif">{t("embed")}</h2>
              <p className="text-small text-text-muted mt-1">{t("embedHint")}</p>
            </div>
            <Link href={`/agents/${id}/widget`} className="group text-small text-link inline-flex items-center gap-1.5">
              {t("customizeWidget")}
              <Icon
                icon={ArrowRightIcon}
                size={13}
                className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
          <EmbedSnippet publicKey={chatbot.publicKey} />
        </section>
      </Reveal>
    </div>
  );
}
