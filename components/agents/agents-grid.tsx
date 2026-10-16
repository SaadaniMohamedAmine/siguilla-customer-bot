"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Reveal } from "@/components/marketing/reveal";
import { AddIcon, LockIcon } from "@/lib/icons";
import { AgentCard, type AgentCardAgent, type AgentCardHealth, type AgentCardMetrics } from "@/components/agents/agent-card";
import { cn } from "@/lib/utils";

export type AgentItem = { agent: AgentCardAgent; metrics: AgentCardMetrics; health: AgentCardHealth };

/** Grille des agents : barre d'outils (recherche / filtre / tri) au-delà de 3 agents, carte de création ou carte verrouillée en fin de grille. */
export function AgentsGrid({ items, atLimit, limit }: { items: AgentItem[]; atLimit: boolean; limit: number }) {
  const t = useTranslations("Agents");
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "live" | "draft">("all");
  const [sort, setSort] = React.useState<"recent" | "name" | "active">("recent");
  const showToolbar = items.length > 3;

  const visible = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        (filter === "all" || i.agent.status === filter) &&
        (!needle || i.agent.name.toLowerCase().includes(needle) || (i.agent.description ?? "").toLowerCase().includes(needle)),
    );
    if (sort === "name") return [...list].sort((a, b) => a.agent.name.localeCompare(b.agent.name));
    if (sort === "active") return [...list].sort((a, b) => b.metrics.conversations - a.metrics.conversations);
    return list;
  }, [items, q, filter, sort]);

  return (
    <div>
      {showToolbar ? (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
          </div>
          <div className="flex gap-1.5">
            {(["all", "live", "draft"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "anim-keep text-small rounded-full border px-3 py-1 transition-colors duration-200",
                  filter === f ? "border-accent bg-tint text-text" : "border-border text-text-muted hover:border-text-muted hover:text-text",
                )}
              >
                {t(`filter.${f}`)}
              </button>
            ))}
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="text-small h-9 w-40" aria-label={t("sortLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("sort.recent")}</SelectItem>
              <SelectItem value="name">{t("sort.name")}</SelectItem>
              <SelectItem value="active">{t("sort.active")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-body text-text-muted py-10 text-center">{t("noMatch")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((i, idx) => (
            <Reveal key={i.agent.id} delay={Math.min(idx, 6) * 70} className="h-full">
              <AgentCard agent={i.agent} metrics={i.metrics} health={i.health} />
            </Reveal>
          ))}
          <Reveal delay={Math.min(visible.length, 6) * 70} className="h-full">
            {atLimit ? (
              <div className="border-border bg-bg flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
                <span className="border-border bg-surface text-link flex size-11 items-center justify-center rounded-full border">
                  <Icon icon={LockIcon} size={20} />
                </span>
                <p className="text-h3 text-text font-serif">{t("lockedTitle")}</p>
                <p className="text-small text-text-muted max-w-xs">{t("lockedBody", { n: limit })}</p>
                <Link
                  href="/settings?tab=billing"
                  className="anim-keep text-small text-link underline underline-offset-4"
                >
                  {t("seePlans")}
                </Link>
              </div>
            ) : (
              <Link
                href="/agents/new"
                className="anim-keep group border-border text-text-muted hover:border-accent hover:text-text flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed transition-[border-color,color,transform] duration-300 hover:-translate-y-0.5"
              >
                <span className="border-border bg-surface flex size-11 items-center justify-center rounded-full border transition-colors duration-300 group-hover:border-accent group-hover:text-link">
                  <Icon icon={AddIcon} size={20} />
                </span>
                <span className="text-body">{t("createCard")}</span>
              </Link>
            )}
          </Reveal>
        </div>
      )}
    </div>
  );
}
