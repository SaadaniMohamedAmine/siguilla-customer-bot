"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import { formatRelative, useNow } from "@/lib/time";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AnalyticsIcon } from "@/lib/icons";

type Agent = { id: string; name: string };
type Data = {
  kpis: {
    conversations: number;
    conversationsDelta: number;
    resolvedWithoutHuman: number | null;
    resolvedWithoutHumanDelta: number | null;
    satisfaction: number | null;
    satisfactionDelta: number | null;
    fallbackRate: number | null;
    fallbackRateDelta: number | null;
  };
  perDay: { date: string; count: number }[];
  topQuestions: { label: string; count: number }[];
  unanswered: { label: string; count: number; firstSeen: string }[];
  citedSources: { title: string; count: number; share: number }[];
};

export function AnalyticsDashboard() {
  const t = useTranslations("Analytics");
  const locale = useLocale();
  const now = useNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agent = searchParams.get("agent") ?? "";
  const period = searchParams.get("period") ?? "30";

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/analytics?${params.toString()}`);
  }

  const { data: agents } = useQuery({ queryKey: ["chatbots"], queryFn: () => api<Agent[]>("/api/chatbots") });
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", agent, period],
    queryFn: () => api<Data>(`/api/analytics?${agent ? `agent=${agent}&` : ""}period=${period}`),
  });

  const delta = (v: number | null, invert = false) => {
    if (v == null) return null;
    const good = invert ? v <= 0 : v >= 0;
    const pct = Math.round(Math.abs(v) * 100);
    return (
      <span className={good ? "text-success" : "text-error"}>
        {v >= 0 ? "+" : "-"}
        {pct}pp
      </span>
    );
  };
  const pct = (v: number | null) => (v != null ? `${Math.round(v * 100)}%` : "—");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1 text-text font-serif">{t("title")}</h1>
        <div className="flex gap-2">
          <Select value={agent || "__all"} onValueChange={(v) => setParam("agent", v === "__all" ? null : v)}>
            <SelectTrigger className="text-small h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("allAgents")}</SelectItem>
              {(agents ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border-border flex overflow-hidden rounded-sm border">
            {["7", "30", "90"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setParam("period", p)}
                className={`text-small px-3 py-1.5 ${period === p ? "bg-accent text-on-accent" : "text-text-muted hover:text-text"}`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : data.kpis.conversations === 0 ? (
        <EmptyState icon={AnalyticsIcon} title={t("empty")} className="mt-10" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label={t("kpi.conversations")}
              value={String(data.kpis.conversations)}
              d={
                <span className={data.kpis.conversationsDelta >= 0 ? "text-success" : "text-error"}>
                  {data.kpis.conversationsDelta >= 0 ? "+" : ""}
                  {data.kpis.conversationsDelta}
                </span>
              }
            />
            <KpiCard
              label={t("kpi.resolvedWithoutHuman")}
              value={pct(data.kpis.resolvedWithoutHuman)}
              d={delta(data.kpis.resolvedWithoutHumanDelta)}
            />
            <KpiCard
              label={t("kpi.satisfaction")}
              value={pct(data.kpis.satisfaction)}
              d={delta(data.kpis.satisfactionDelta)}
            />
            <KpiCard
              label={t("kpi.fallbackRate")}
              value={pct(data.kpis.fallbackRate)}
              d={delta(data.kpis.fallbackRateDelta, true)}
            />
          </div>

          <div className="border-border rounded-md border p-5">
            <p className="label-caps mb-4">{t("perDay")}</p>
            <ConversationsChart data={data.perDay} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-border rounded-md border p-5">
              <p className="label-caps mb-3">{t("citedSources")}</p>
              {data.citedSources.length === 0 ? (
                <p className="text-small text-text-muted">—</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.citedSources.map((s) => (
                    <li key={s.title}>
                      <p className="text-small text-text truncate" title={s.title}>
                        {s.title}
                      </p>
                      <div className="bg-surface-raised mt-1 h-1 w-full rounded-full">
                        <div
                          className="bg-accent h-1 rounded-full"
                          style={{ width: `${Math.round(s.share * 100)}%` }}
                        />
                      </div>
                      <p className="text-small text-text-muted mt-0.5 font-mono">
                        {Math.round(s.share * 100)}% · {s.count}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-border rounded-md border p-5">
              <p className="label-caps mb-3">{t("topQuestions")}</p>
              {data.topQuestions.length === 0 ? (
                <p className="text-small text-text-muted">—</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {data.topQuestions.map((q, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-small text-text flex items-center gap-2 truncate">
                        <span className="text-text-muted font-mono">{String(i + 1).padStart(2, "0")}</span>
                        {q.label}
                      </span>
                      <span className="text-small text-text-muted font-mono">{q.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="border-border rounded-md border p-5">
            <p className="label-caps mb-3">{t("unanswered")}</p>
            {data.unanswered.length === 0 ? (
              <p className="text-small text-text-muted">—</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {data.unanswered.map((q, i) => (
                  <li
                    key={i}
                    className="border-border flex items-center justify-between gap-4 border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-body-lg text-text font-serif">&ldquo;{q.label}&rdquo;</p>
                      <p className="text-small text-text-muted">
                        {t("firstSeen", { date: formatRelative(q.firstSeen, locale, now) ?? "" })} · {q.count}
                      </p>
                    </div>
                    <Link
                      href={`/agents/${agent}/sources`}
                      className="text-small text-link shrink-0 hover:underline"
                    >
                      {t("addSource")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, d }: { label: string; value: string; d: React.ReactNode }) {
  return (
    <div className="border-border rounded-md border p-4">
      <p className="label-caps">{label}</p>
      <p className="text-kpi text-text mt-1 font-serif">{value}</p>
      {d ? <p className="text-small mt-1 font-mono">{d}</p> : null}
    </div>
  );
}

function ConversationsChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-32 items-end gap-[2px]">
      {data.map((d) => (
        <div key={d.date} className="group flex h-full flex-1 items-end" title={`${d.date}: ${d.count}`}>
          <div
            className="bg-accent/70 group-hover:bg-accent w-full rounded-t-[2px] transition-colors"
            style={{ height: `${Math.max(2, Math.round((d.count / max) * 100))}%` }}
          />
        </div>
      ))}
    </div>
  );
}
