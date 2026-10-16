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
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal } from "@/components/ui/tooltip";
import { Reveal } from "@/components/marketing/reveal";
import { AnalyticsIcon, ArrowRightIcon, InfoIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

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

type Tone = "good" | "warn" | "bad";
const TONE_TEXT: Record<Tone, string> = { good: "text-success", warn: "text-warning", bad: "text-error" };
const TONE_BG: Record<Tone, string> = { good: "bg-success", warn: "bg-warning", bad: "bg-error" };

/** Passe à true juste après le premier rendu, pour déclencher les transitions d'entrée (barres, tracés). */
function useAfterPaint() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}

/** Fait monter un nombre de 0 à `target` (easing out). */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function AnalyticsDashboard() {
  const t = useTranslations("Analytics");
  const locale = useLocale();
  const now = useNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agent = searchParams.get("agent") ?? "";
  const period = searchParams.get("period") ?? "30";
  const [showAllUnanswered, setShowAllUnanswered] = React.useState(false);

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
  const agentName = agents?.find((a) => a.id === agent)?.name ?? t("allAgents");
  const periods = ["7", "30", "90"];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text font-serif">{t("title")}</h1>
          <p className="text-body text-text-muted mt-2">{t("subtitle", { days: period, scope: agentName })}</p>
        </div>
        <div className="flex gap-2">
          <Select value={agent || "__all"} onValueChange={(v) => setParam("agent", v === "__all" ? null : v)}>
            <SelectTrigger className="text-small h-9 w-44" aria-label={t("filterByAgent")}>
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
          <div role="group" aria-label={t("period")} className="border-border bg-surface relative grid grid-cols-3 rounded-sm border p-0.5">
            <span
              aria-hidden
              className="anim-keep bg-accent absolute top-0.5 bottom-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-[3px] transition-transform duration-300 ease-[var(--ease-lux)]"
              style={{ transform: `translateX(${Math.max(0, periods.indexOf(period)) * 100}%)` }}
            />
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setParam("period", p)}
                className={cn(
                  "anim-keep text-small relative z-10 px-3.5 py-1.5 transition-colors duration-200",
                  period === p ? "text-on-accent" : "text-text-muted hover:text-text",
                )}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="anim-keep h-36 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="anim-keep h-80 w-full rounded-lg" />
        </div>
      ) : data.kpis.conversations === 0 ? (
        <EmptyState
          icon={AnalyticsIcon}
          title={t("empty")}
          description={t("emptyDesc")}
          className="mt-10"
          action={
            <Link href="/agents">
              <Button>{t("goToAgents")}</Button>
            </Link>
          }
        />
      ) : (
        <Loaded
          key={`${agent}-${period}`}
          data={data}
          agent={agent}
          period={period}
          locale={locale}
          now={now}
          showAll={showAllUnanswered}
          setShowAll={setShowAllUnanswered}
        />
      )}
    </div>
  );
}

function Loaded({
  data,
  agent,
  period,
  locale,
  now,
  showAll,
  setShowAll,
}: {
  data: Data;
  agent: string;
  period: string;
  locale: string;
  now: number;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}) {
  const t = useTranslations("Analytics");
  const k = data.kpis;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const pp = (v: number | null, invert = false) => {
    if (v == null) return null;
    const good = invert ? v <= 0 : v >= 0;
    return { text: `${v >= 0 ? "+" : "-"}${Math.round(Math.abs(v) * 100)}pp`, tone: (good ? "good" : "bad") as Tone };
  };
  const tone = {
    resolved: k.resolvedWithoutHuman == null ? undefined : k.resolvedWithoutHuman >= 0.8 ? "good" : k.resolvedWithoutHuman >= 0.5 ? "warn" : "bad",
    satisfaction: k.satisfaction == null ? undefined : k.satisfaction >= 0.8 ? "good" : k.satisfaction >= 0.6 ? "warn" : "bad",
    fallback: k.fallbackRate == null ? undefined : k.fallbackRate <= 0.2 ? "good" : k.fallbackRate <= 0.4 ? "warn" : "bad",
  } as const;
  const unanswered = showAll ? data.unanswered : data.unanswered.slice(0, 5);
  const maxQ = Math.max(1, ...data.topQuestions.map((q) => q.count));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Reveal delay={0} className="h-full">
          <KpiCard
            label={t("kpi.conversations")}
            help={t("help.conversations")}
            value={k.conversations}
            format={(n) => String(Math.round(n))}
            delta={{
              text: `${k.conversationsDelta >= 0 ? "+" : ""}${k.conversationsDelta}`,
              tone: k.conversationsDelta >= 0 ? "good" : "bad",
              note: t("vsPrev", { days: period }),
            }}
            spark={data.perDay.map((d) => d.count)}
          />
        </Reveal>
        <Reveal delay={80} className="h-full">
          <KpiCard
            label={t("kpi.resolvedWithoutHuman")}
            help={t("help.resolved")}
            value={k.resolvedWithoutHuman}
            format={(n) => pct(n / 100)}
            scale={100}
            tone={tone.resolved}
            delta={pp(k.resolvedWithoutHumanDelta)}
            empty={t("noData")}
          />
        </Reveal>
        <Reveal delay={160} className="h-full">
          <KpiCard
            label={t("kpi.satisfaction")}
            help={t("help.satisfaction")}
            value={k.satisfaction}
            format={(n) => pct(n / 100)}
            scale={100}
            tone={tone.satisfaction}
            delta={pp(k.satisfactionDelta)}
            empty={t("notEnoughRatings")}
          />
        </Reveal>
        <Reveal delay={240} className="h-full">
          <KpiCard
            label={t("kpi.fallbackRate")}
            help={t("help.fallback")}
            value={k.fallbackRate}
            format={(n) => pct(n / 100)}
            scale={100}
            tone={tone.fallback}
            delta={pp(k.fallbackRateDelta, true)}
            note={t("lowerIsBetter")}
            empty={t("noData")}
          />
        </Reveal>
      </div>

      <Reveal>
        <section className="border-border bg-surface rounded-lg border p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-h3 text-text font-serif">{t("perDay")}</h2>
            <p className="text-small text-text-muted font-mono">
              {t("chartTotal", { count: data.perDay.reduce((a, d) => a + d.count, 0) })}
            </p>
          </div>
          <ConversationsChart data={data.perDay} locale={locale} />
        </section>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal className="h-full">
          <section className="border-border bg-surface h-full rounded-lg border p-6">
            <h2 className="text-h3 text-text mb-5 font-serif">{t("citedSources")}</h2>
            {data.citedSources.length === 0 ? (
              <p className="text-small text-text-muted">{t("noData")}</p>
            ) : (
              <RankList
                items={data.citedSources.map((s) => ({
                  label: s.title,
                  value: s.count,
                  share: s.share,
                  meta: `${Math.round(s.share * 100)}%`,
                }))}
              />
            )}
          </section>
        </Reveal>
        <Reveal delay={100} className="h-full">
          <section className="border-border bg-surface h-full rounded-lg border p-6">
            <h2 className="text-h3 text-text mb-5 font-serif">{t("topQuestions")}</h2>
            {data.topQuestions.length === 0 ? (
              <p className="text-small text-text-muted">{t("noData")}</p>
            ) : (
              <RankList
                items={data.topQuestions.map((q) => ({ label: q.label, value: q.count, share: q.count / maxQ }))}
              />
            )}
          </section>
        </Reveal>
      </div>

      <Reveal>
        <section className="border-border bg-surface rounded-lg border p-6">
          <h2 className="text-h3 text-text font-serif">{t("unanswered")}</h2>
          <p className="text-small text-text-muted mt-1">{t("unansweredDesc")}</p>
          {data.unanswered.length === 0 ? (
            <p className="text-small text-text-muted mt-5">{t("noData")}</p>
          ) : (
            <>
              <ul className="divide-border mt-5 flex flex-col divide-y">
                {unanswered.map((q, i) => (
                  <li key={`${q.label}-${i}`} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-body-lg text-text truncate font-serif">&ldquo;{q.label}&rdquo;</p>
                      <p className="text-small text-text-muted mt-0.5">
                        {t("firstSeen", { date: formatRelative(q.firstSeen, locale, now) ?? "" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="border-border text-text-muted rounded-full border px-2.5 py-0.5 font-mono text-[12px]">
                        {q.count}×
                      </span>
                      {agent ? (
                        <Link
                          href={`/agents/${agent}/sources`}
                          className="anim-keep group text-small text-link inline-flex items-center gap-1.5"
                        >
                          {t("addSource")}
                          <Icon
                            icon={ArrowRightIcon}
                            size={14}
                            className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {data.unanswered.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="anim-keep text-small text-link mt-3 underline underline-offset-4"
                >
                  {showAll ? t("showLess") : t("showAll", { count: data.unanswered.length })}
                </button>
              ) : null}
            </>
          )}
        </section>
      </Reveal>
    </>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const ready = useAfterPaint();
  const max = Math.max(1, ...values);
  const n = values.length;
  if (n < 2) return null;
  const pts = values.map((v, i) => `${(i / (n - 1)) * 100},${30 - (v / max) * 28}`);
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-3 h-8 w-full" aria-hidden>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        className="anim-keep"
        style={{ strokeDasharray: 1, strokeDashoffset: ready ? 0 : 1, transition: "stroke-dashoffset 1200ms var(--ease-lux)" }}
      />
    </svg>
  );
}

function KpiCard({
  label,
  help,
  value,
  format,
  scale = 1,
  tone,
  delta,
  note,
  empty,
  spark,
}: {
  label: string;
  help: string;
  value: number | null;
  format: (n: number) => string;
  scale?: number;
  tone?: Tone;
  delta: { text: string; tone: Tone; note?: string } | null;
  note?: string;
  empty?: string;
  spark?: number[];
}) {
  const animated = useCountUp(value == null ? 0 : value * scale);
  return (
    <div className="border-border bg-surface hover:border-text-muted flex h-full flex-col rounded-lg border p-5 transition-colors duration-300">
      <div className="flex items-center justify-between gap-2">
        <p className="label-caps flex items-center gap-2">
          {tone ? <span aria-hidden className={cn("size-1.5 rounded-full", TONE_BG[tone])} /> : null}
          {label}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={help} className="text-text-muted hover:text-text transition-colors">
              <Icon icon={InfoIcon} size={15} />
            </button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent
              sideOffset={6}
              className="border-border bg-surface-raised text-small text-text z-50 max-w-[240px] rounded-sm border px-3 py-2 shadow-[var(--shadow-lift)]"
            >
              {help}
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </div>
      {value == null ? (
        <p className="text-body text-text-muted mt-3">{empty ?? "—"}</p>
      ) : (
        <p className={cn("text-kpi mt-1 font-serif", tone ? TONE_TEXT[tone] : "text-text")}>
          {format(animated)}
        </p>
      )}
      <div className="text-small mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2">
        {delta ? (
          <span className={cn("rounded-full px-2 py-0.5 font-mono text-[12px]", delta.tone === "good" ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
            {delta.text}
          </span>
        ) : null}
        {delta?.note ? <span className="text-text-muted">{delta.note}</span> : null}
        {!delta?.note && note ? <span className="text-text-muted">{note}</span> : null}
      </div>
      {spark ? <Sparkline values={spark} /> : null}
    </div>
  );
}

function RankList({ items }: { items: { label: string; value: number; share: number; meta?: string }[] }) {
  const ready = useAfterPaint();
  return (
    <ol className="flex flex-col gap-4">
      {items.map((it, i) => (
        <li key={`${it.label}-${i}`}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-body text-text flex min-w-0 items-baseline gap-3">
              <span className="text-link w-6 shrink-0 font-serif text-[18px] italic">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate" title={it.label}>
                {it.label}
              </span>
            </p>
            <p className="text-small text-text-muted shrink-0 font-mono">
              {it.meta ? `${it.meta} · ` : ""}
              <span className="text-text">{it.value}</span>
            </p>
          </div>
          <div className="bg-surface-raised mt-2 ml-9 h-1.5 overflow-hidden rounded-full">
            <div
              className="anim-keep bg-accent h-full rounded-full transition-[width] duration-1000 ease-[var(--ease-lux)]"
              style={{ width: ready ? `${Math.max(3, Math.round(it.share * 100))}%` : "0%", transitionDelay: `${i * 70}ms` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function ConversationsChart({ data, locale }: { data: { date: string; count: number }[]; locale: string }) {
  const t = useTranslations("Analytics");
  const ready = useAfterPaint();
  const gradId = React.useId().replace(/:/g, "");
  const ref = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<number | null>(null);

  const W = 1000;
  const H = 240;
  const padL = 44;
  const padR = 10;
  const padT = 12;
  const padB = 28;
  const n = data.length;
  const rawMax = Math.max(1, ...data.map((d) => d.count));
  const yMax = Math.max(4, Math.ceil(rawMax / 4) * 4);
  const step = n > 1 ? (W - padL - padR) / (n - 1) : 0;
  const x = (i: number) => padL + i * step;
  const y = (v: number) => padT + (1 - v / yMax) * (H - padT - padB);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.count)}`).join(" ");
  const area = n > 0 ? `${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const label = (i: number) => fmt.format(new Date(`${data[i].date}T12:00:00`));
  const xTicks = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : n === 2 ? [0, 1] : [0];
  const peakIdx = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0);

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    const i = step > 0 ? Math.round((vx - padL) / step) : 0;
    setHover(Math.min(n - 1, Math.max(0, i)));
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      role="img"
      aria-label={t("chartTotal", { count: data.reduce((a, d) => a + d.count, 0) })}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.4 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((g) => {
          const v = (yMax / 4) * g;
          return (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} style={{ stroke: "var(--border)" }} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray={g === 0 ? undefined : "3 4"} />
              <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" className="font-mono" style={{ fill: "var(--text-muted)" }}>
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="11" className="font-mono" style={{ fill: "var(--text-muted)" }}>
            {label(i)}
          </text>
        ))}
        <path d={area} fill={`url(#${gradId})`} className="anim-keep" style={{ opacity: ready ? 1 : 0, transition: "opacity 900ms var(--ease-lux) 300ms" }} />
        <path
          d={line}
          fill="none"
          style={{ stroke: "var(--accent)", strokeDasharray: 1, strokeDashoffset: ready ? 0 : 1, transition: "stroke-dashoffset 1400ms var(--ease-lux)" }}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          className="anim-keep"
        />
        {hover != null ? (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={y(0)} style={{ stroke: "var(--text-muted)" }} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
        ) : null}
      </svg>
      {/* repères HTML (hors SVG déformé) : point de survol et pic */}
      {n > 0 && data[peakIdx].count > 0 && hover == null ? (
        <span
          aria-hidden
          className="bg-accent ring-bg pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
          style={{ left: `${(x(peakIdx) / W) * 100}%`, top: `${(y(data[peakIdx].count) / H) * 100}%` }}
        />
      ) : null}
      {hover != null ? (
        <>
          <span
            aria-hidden
            className="bg-accent ring-bg pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover].count) / H) * 100}%` }}
          />
          <div
            className="border-border bg-surface-raised text-small text-text pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm border px-3 py-2 whitespace-nowrap shadow-[var(--shadow-lift)]"
            style={{ left: `${Math.min(92, Math.max(8, (x(hover) / W) * 100))}%`, top: `calc(${(y(data[hover].count) / H) * 100}% - 12px)` }}
          >
            <p className="text-text-muted font-mono text-[11px]">{label(hover)}</p>
            <p>{t("chartTip", { count: data[hover].count })}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
