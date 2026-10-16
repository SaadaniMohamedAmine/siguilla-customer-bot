"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import { useNow, formatRelative } from "@/lib/time";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal } from "@/components/ui/tooltip";
import { AnswerText, sealedSources } from "@/components/chat/answer-text";
import { SealedBy } from "@/components/ui/citation-seal";
import {
  ConversationIcon,
  UserAddIcon,
  CheckIcon,
  CopyIcon,
  WarningIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  SendIcon,
  InfoIcon,
} from "@/lib/icons";
import type { Citation } from "@/lib/rag/types";
import { cn } from "@/lib/utils";

type ListItem = {
  id: string;
  visitorId: string;
  status: "bot" | "handoff_requested" | "human" | "resolved";
  country: string | null;
  lastMessageAt: string;
  createdAt: string;
  messages: { content: string; role: string }[];
  chatbot: { id: string; name: string };
};

type Message = {
  id: string;
  role: "visitor" | "bot" | "agent" | "system";
  content: string;
  citations: Citation[];
  topScore: number | null;
  fallback: boolean;
  provider: string | null;
  feedback: string | null;
  createdAt: string;
};

type Detail = {
  id: string;
  status: "bot" | "handoff_requested" | "human" | "resolved";
  visitorId: string;
  visitorEmail: string | null;
  pageUrl: string | null;
  locale: string | null;
  country: string | null;
  agentName: string | null;
  createdAt: string;
  lastMessageAt: string;
  chatbot: { id: string; name: string };
  messages: Message[];
};

type Agent = { id: string; name: string };
type T = ReturnType<typeof useTranslations<"Conversations">>;

const FILTERS = ["all", "needsHuman", "negativeFeedback", "unanswered", "resolved"] as const;
const FILTER_TO_PARAM: Record<(typeof FILTERS)[number], string | null> = {
  all: null,
  needsHuman: "handoff_requested",
  negativeFeedback: "negative_feedback",
  unanswered: "unanswered",
  resolved: "resolved",
};
const STATUS_TONE = {
  bot: "neutral",
  handoff_requested: "warning",
  human: "accent",
  resolved: "success",
} as const;
const STATUS_DOT = {
  bot: "bg-text-muted",
  handoff_requested: "bg-warning",
  human: "bg-accent",
  resolved: "bg-success",
} as const;
const AVATAR_TONES = [
  "bg-tint text-link",
  "bg-surface-raised text-text-muted",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
  "bg-accent/20 text-link",
];

function visitorLabel(id: string) {
  return id.slice(-4).toUpperCase();
}

function VisitorAvatar({ id, size = 40 }: { id: string; size?: number }) {
  const tone = AVATAR_TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-mono text-[11px]", tone)}
      style={{ width: size, height: size }}
    >
      {visitorLabel(id).slice(0, 2)}
    </span>
  );
}

function systemLabel(code: string, t: T) {
  if (code === "handoff_requested") return t("system.handoff_requested");
  if (code === "resolved") return t("system.resolved");
  if (code.startsWith("agent_joined:")) return t("system.agent_joined", { name: code.slice("agent_joined:".length) });
  return code;
}

export function ConversationsInbox({
  selectedId,
  currentUserName,
}: {
  selectedId?: string;
  currentUserName: string;
}) {
  const t = useTranslations("Conversations");
  const locale = useLocale();
  const now = useNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const agent = searchParams.get("agent") ?? "";
  const status = searchParams.get("status") ?? "all";
  const period = searchParams.get("period") ?? "";
  const [qInput, setQInput] = React.useState(searchParams.get("q") ?? "");
  const [q, setQ] = React.useState(searchParams.get("q") ?? "");

  React.useEffect(() => {
    const id = setTimeout(() => setQ(qInput), 300);
    return () => clearTimeout(id);
  }, [qInput]);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${selectedId ? `/conversations/${selectedId}` : "/conversations"}?${params.toString()}`);
  }

  const { data: agents } = useQuery({ queryKey: ["chatbots"], queryFn: () => api<Agent[]>("/api/chatbots") });

  const listKey = ["conversations", agent, status, q, period];
  const list = useInfiniteQuery({
    queryKey: listKey,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (agent) params.set("agent", agent);
      const statusParam = FILTER_TO_PARAM[status as (typeof FILTERS)[number]] ?? null;
      if (statusParam) params.set("status", statusParam);
      if (q) params.set("q", q);
      if (period) params.set("period", period);
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/conversations?${params.toString()}`);
      const json = (await res.json()) as { data: ListItem[]; nextCursor: string | null };
      if (!res.ok) throw new Error("request_failed");
      return json;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const rows = list.data?.pages.flatMap((p) => p.data) ?? [];

  const detail = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: () => api<Detail>(`/api/conversations/${selectedId}`),
    enabled: !!selectedId,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const tErrors = useTranslations("Errors");
  const onMutationError = () => toast.error(tErrors("genericTitle"));

  const takeOver = useMutation({
    mutationFn: () => api(`/api/conversations/${selectedId}/takeover`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: onMutationError,
  });

  const resolveMutation = useMutation({
    mutationFn: () => api(`/api/conversations/${selectedId}/resolve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: onMutationError,
  });

  const [reply, setReply] = React.useState("");
  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      api(`/api/conversations/${selectedId}/reply`, { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: onMutationError,
  });

  function sendReply() {
    const value = reply.trim();
    if (!value) return;
    replyMutation.mutate(value);
  }

  const countryName = React.useCallback(
    (code: string | null) => {
      if (!code) return null;
      try {
        return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
      } catch {
        return code;
      }
    },
    [locale],
  );

  return (
    <div className="flex h-[calc(100vh-150px)] min-h-[560px] flex-col">
      <div className="mb-6">
        <h1 className="text-h1 text-text font-serif">{t("title")}</h1>
        <p className="text-body text-text-muted mt-2 max-w-xl">{t("subtitle")}</p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[340px_1fr_320px]">
        {/* Colonne gauche : liste */}
        <div className={cn("flex min-h-0 flex-col gap-3", selectedId && "hidden xl:flex")}>
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setParam("status", f === "all" ? null : f)}
                aria-pressed={status === f}
                className={cn(
                  "anim-keep text-small rounded-full border px-3 py-1 transition-colors duration-200",
                  status === f
                    ? "border-accent bg-tint text-text"
                    : "border-border text-text-muted hover:border-text-muted hover:text-text",
                )}
              >
                {t(`filters.${f}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <p className="label-caps mb-1">{t("agentLabel")}</p>
              <Select value={agent || "__all"} onValueChange={(v) => setParam("agent", v === "__all" ? null : v)}>
                <SelectTrigger className="text-small h-8 w-full" aria-label={t("filterByAgent")}>
                  <SelectValue placeholder={t("allAgents")} />
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
            </div>
            <div>
              <p className="label-caps mb-1">{t("periodLabel")}</p>
              <Select value={period || "__all"} onValueChange={(v) => setParam("period", v === "__all" ? null : v)}>
                <SelectTrigger className="text-small h-8 w-32" aria-label={t("filterByPeriod")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{t("anyTime")}</SelectItem>
                  <SelectItem value="7">{t("period7")}</SelectItem>
                  <SelectItem value="30">{t("period30")}</SelectItem>
                  <SelectItem value="90">{t("period90")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!list.isLoading ? (
            <p className="text-small text-text-muted font-mono">
              {t("results", { count: rows.length })}
              {list.hasNextPage ? "+" : ""}
            </p>
          ) : null}

          <div className="border-border bg-surface scroll-thin min-h-0 flex-1 overflow-y-auto rounded-lg border">
            {list.isLoading ? (
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="anim-keep h-16 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon={ConversationIcon} title={t("noneFound")} className="p-8" />
            ) : (
              <ul>
                {rows.map((c, i) => {
                  const last = c.messages[0];
                  const params = new URLSearchParams(searchParams.toString());
                  const selected = selectedId === c.id;
                  const preview = last ? (last.role === "system" ? systemLabel(last.content, t) : last.content) : null;
                  return (
                    <li
                      key={c.id}
                      className="page-in anim-keep border-border border-b last:border-0"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <Link
                        href={`/conversations/${c.id}?${params.toString()}`}
                        aria-current={selected ? "true" : undefined}
                        className={cn(
                          "anim-keep relative flex gap-3 px-3 py-3.5 transition-colors duration-200",
                          selected ? "bg-tint" : "hover:bg-surface-raised",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "anim-keep bg-accent absolute top-2 bottom-2 left-0 w-0.5 rounded-full transition-transform duration-300",
                            selected ? "scale-y-100" : "scale-y-0",
                          )}
                        />
                        <VisitorAvatar id={c.visitorId} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-body text-text truncate">
                              {t("visitor", { id: visitorLabel(c.visitorId) })}
                            </span>
                            <span className="text-small text-text-muted shrink-0">
                              {formatRelative(c.lastMessageAt, locale, now)}
                            </span>
                          </div>
                          {preview ? <p className="text-small text-text-muted mt-0.5 truncate">{preview}</p> : null}
                          <div className="text-small text-text-muted mt-1.5 flex items-center gap-2">
                            <span className="relative flex size-2">
                              {c.status === "handoff_requested" ? (
                                <span
                                  className="anim-keep bg-warning absolute inline-flex size-full rounded-full opacity-60"
                                  style={{ animation: "ping-soft 1.8s ease-out infinite" }}
                                />
                              ) : null}
                              <span className={cn("relative inline-flex size-2 rounded-full", STATUS_DOT[c.status])} />
                            </span>
                            <span>{t(`status.${c.status === "handoff_requested" ? "needsHuman" : c.status}`)}</span>
                            {countryName(c.country) ? <span>· {countryName(c.country)}</span> : null}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {list.hasNextPage ? (
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  loading={list.isFetchingNextPage}
                  onClick={() => list.fetchNextPage()}
                >
                  {t("loadMore")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Colonnes centre + droite : détail */}
        {!selectedId ? (
          <div className="border-border bg-surface hidden min-h-0 flex-col items-center justify-center gap-3 rounded-lg border px-6 text-center xl:col-span-2 xl:flex">
            <span className="border-border bg-bg text-link flex size-12 items-center justify-center rounded-full border">
              <Icon icon={ConversationIcon} size={22} />
            </span>
            <p className="text-h3 text-text font-serif">{t("selectOne")}</p>
            <p className="text-body text-text-muted max-w-sm">{t("selectOneDesc")}</p>
          </div>
        ) : (
          <>
            <div className="border-border bg-surface flex min-h-0 flex-col rounded-lg border">
              {detail.isLoading || !detail.data ? (
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <Skeleton className="anim-keep h-6 w-48" />
                  <Skeleton className="anim-keep h-24 w-full" />
                  <Skeleton className="anim-keep h-24 w-full" />
                </div>
              ) : (
                <ConversationThread
                  conversation={detail.data}
                  t={t}
                  locale={locale}
                  currentUserName={currentUserName}
                  onTakeOver={() => takeOver.mutate()}
                  takingOver={takeOver.isPending}
                  onResolve={() => resolveMutation.mutate()}
                  resolving={resolveMutation.isPending}
                  reply={reply}
                  setReply={setReply}
                  onSendReply={sendReply}
                  sendingReply={replyMutation.isPending}
                  onBack={() => router.push(`/conversations?${searchParams.toString()}`)}
                />
              )}
            </div>
            <div className="scroll-thin hidden min-h-0 flex-col gap-4 overflow-y-auto xl:flex">
              {detail.data ? <ConversationContext conversation={detail.data} t={t} /> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConversationThread({
  conversation,
  t,
  locale,
  currentUserName,
  onTakeOver,
  takingOver,
  onResolve,
  resolving,
  reply,
  setReply,
  onSendReply,
  sendingReply,
  onBack,
}: {
  conversation: Detail;
  t: T;
  locale: string;
  currentUserName: string;
  onTakeOver: () => void;
  takingOver: boolean;
  onResolve: () => void;
  resolving: boolean;
  reply: string;
  setReply: (v: string) => void;
  onSendReply: () => void;
  sendingReply: boolean;
  onBack: () => void;
}) {
  const feedRef = React.useRef<HTMLDivElement>(null);
  const [showContext, setShowContext] = React.useState(false);
  React.useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [conversation.messages.length]);

  const canTakeOver = conversation.status === "bot" || conversation.status === "handoff_requested";
  const canResolve = conversation.status !== "resolved";
  const canReply = conversation.status === "handoff_requested" || conversation.status === "human";
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("backToList")}
            className="text-text-muted hover:text-text xl:hidden"
          >
            <Icon icon={ArrowLeftIcon} size={18} />
          </button>
          <VisitorAvatar id={conversation.visitorId} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3 text-text font-serif">
                {t("visitor", { id: visitorLabel(conversation.visitorId) })}
              </h2>
              <StatusPill tone={STATUS_TONE[conversation.status]}>
                {t(`status.${conversation.status === "handoff_requested" ? "needsHuman" : conversation.status}`)}
              </StatusPill>
            </div>
            <p className="text-small text-text-muted truncate">
              {conversation.chatbot.name} ·{" "}
              {t("startedAt", { date: new Date(conversation.createdAt).toLocaleString(locale) })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            className="text-small text-link underline underline-offset-4 xl:hidden"
          >
            {t("details")}
          </button>
          {canResolve ? (
            <Button variant="ghost" size="sm" loading={resolving} onClick={onResolve}>
              <Icon icon={CheckIcon} size={14} />
              {t("resolve")}
            </Button>
          ) : null}
          {canTakeOver ? (
            <Button size="sm" loading={takingOver} onClick={onTakeOver}>
              <Icon icon={UserAddIcon} size={14} />
              {t("takeOver")}
            </Button>
          ) : null}
        </div>
      </div>

      {showContext ? (
        <div className="border-border bg-bg scroll-thin flex max-h-[45%] flex-col gap-4 overflow-y-auto border-b p-4 xl:hidden">
          <ConversationContext conversation={conversation} t={t} />
        </div>
      ) : null}

      <div ref={feedRef} className="scroll-thin flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-4">
          {conversation.messages.map((m, i) => {
            const prev = conversation.messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            return (
              <React.Fragment key={m.id}>
                {newDay ? (
                  <p className="text-small text-text-muted text-center capitalize">
                    {dayFmt.format(new Date(m.createdAt))}
                  </p>
                ) : null}
                <MessageBubble message={m} t={t} locale={locale} agentName={conversation.agentName} />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="border-border border-t p-4">
        {canReply ? (
          <>
            <div className="flex items-end gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSendReply();
                  }
                }}
                rows={Math.min(5, Math.max(1, reply.split("\n").length))}
                maxLength={2000}
                placeholder={t("composerPlaceholder", { name: currentUserName })}
                className="flex-1 resize-none"
              />
              <Button loading={sendingReply} onClick={onSendReply} disabled={!reply.trim()}>
                <Icon icon={SendIcon} size={16} />
                {t("send")}
              </Button>
            </div>
            <p className="text-small text-text-muted mt-2">{t("replyHint")}</p>
          </>
        ) : conversation.status === "bot" ? (
          <Button loading={takingOver} onClick={onTakeOver} className="w-full">
            <Icon icon={UserAddIcon} size={14} />
            {t("takeOver")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  t,
  locale,
  agentName,
}: {
  message: Message;
  t: T;
  locale: string;
  agentName: string | null;
}) {
  if (message.role === "system") {
    const isHandoff = message.content === "handoff_requested";
    return (
      <div className="flex justify-center">
        <span
          className={cn(
            "text-small inline-flex items-center gap-2 rounded-full border px-3 py-1",
            isHandoff ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-surface-raised text-text-muted",
          )}
        >
          <Icon icon={isHandoff ? WarningIcon : CheckIcon} size={13} />
          {systemLabel(message.content, t)}
        </span>
      </div>
    );
  }

  const isVisitor = message.role === "visitor";
  const isAgent = message.role === "agent";
  const isFallback = message.fallback;
  const time = new Date(message.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn("page-in anim-keep flex gap-2.5", isVisitor ? "justify-end" : "justify-start")}>
      {!isVisitor ? (
        <span
          aria-hidden
          className={cn(
            "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full font-serif text-[14px]",
            isAgent ? "bg-surface-raised text-text" : "bg-accent text-on-accent",
          )}
        >
          {isAgent ? (agentName ?? "T").slice(0, 1).toUpperCase() : "S"}
        </span>
      ) : null}
      <div className={cn("flex max-w-[82%] flex-col", isVisitor ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isVisitor && "border-accent/20 bg-tint rounded-br-sm border",
            isAgent && "border-accent/40 bg-surface-raised rounded-bl-sm border",
            !isVisitor && !isAgent && !isFallback && "border-border bg-bg rounded-bl-sm border",
            isFallback && "border-warning/40 bg-warning/5 rounded-bl-sm border",
          )}
        >
          {isAgent && agentName ? (
            <p className="text-small text-text-muted mb-1 font-medium">{agentName}</p>
          ) : null}
          {isFallback ? (
            <p className="text-small text-warning mb-1.5 flex items-center gap-1.5 font-medium">
              <Icon icon={WarningIcon} size={13} />
              {t("noVerified")}
            </p>
          ) : null}
          {message.role === "bot" && !isFallback ? (
            <>
              <AnswerText text={message.content} citations={message.citations ?? []} />
              <SealedBy sources={sealedSources(message.citations ?? [])} label="" />
            </>
          ) : (
            <p className={cn("whitespace-pre-wrap", isFallback && "text-text-muted")}>{message.content}</p>
          )}
        </div>
        <div className="text-small text-text-muted mt-1 flex items-center gap-2 px-1">
          <span className="font-mono text-[11px]">{time}</span>
          {message.role === "bot" && message.topScore != null ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="border-border text-text-muted inline-flex cursor-help items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px]">
                  {t("match", { pct: Math.round(message.topScore * 100) })}
                  <Icon icon={InfoIcon} size={11} />
                </span>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent
                  sideOffset={6}
                  className="border-border bg-surface-raised text-small text-text z-50 max-w-[240px] rounded-sm border px-3 py-2 shadow-[var(--shadow-lift)]"
                >
                  {t("matchHelp")}
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          ) : null}
          {message.role === "bot" && message.feedback === "up" ? (
            <Icon icon={ThumbsUpIcon} size={14} className="text-success" />
          ) : null}
          {message.role === "bot" && message.feedback === "down" ? (
            <Icon icon={ThumbsDownIcon} size={14} className="text-error" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContextCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface rounded-lg border p-4">
      <p className="label-caps mb-3">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-small text-text-muted">{label}</p>
      <div className="text-body text-text">{children}</div>
    </div>
  );
}

function ConversationContext({ conversation, t }: { conversation: Detail; t: T }) {
  const locale = useLocale();
  const lastBot = [...conversation.messages].reverse().find((m) => m.role === "bot");
  const visitorBeforeLastBot = lastBot
    ? [...conversation.messages]
        .slice(0, conversation.messages.indexOf(lastBot))
        .reverse()
        .find((m) => m.role === "visitor")
    : null;
  const up = conversation.messages.filter((m) => m.feedback === "up").length;
  const down = conversation.messages.filter((m) => m.feedback === "down").length;
  const score = lastBot?.topScore ?? null;

  const countryName = (() => {
    if (!conversation.country) return null;
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(conversation.country) ?? conversation.country;
    } catch {
      return conversation.country;
    }
  })();

  async function copyEmail() {
    if (!conversation.visitorEmail) return;
    try {
      await navigator.clipboard.writeText(conversation.visitorEmail);
      toast.success(t("context.copied"));
    } catch {
      /* presse-papiers indisponible */
    }
  }

  return (
    <>
      <ContextCard title={t("context.visitorTitle")}>
        <div className="flex items-center justify-between gap-2">
          <Field label={t("context.email")}>
            <span className="truncate">{conversation.visitorEmail ?? t("context.notProvided")}</span>
          </Field>
          {conversation.visitorEmail ? (
            <Button variant="ghost" size="icon" onClick={copyEmail} aria-label={t("context.email")}>
              <Icon icon={CopyIcon} size={14} />
            </Button>
          ) : null}
        </div>
        {conversation.pageUrl ? (
          <Field label={t("context.pageOrigin")}>
            <a
              href={conversation.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-link group inline-flex max-w-full items-center gap-1.5 hover:underline"
            >
              <span className="truncate">{conversation.pageUrl}</span>
              <Icon icon={ArrowRightIcon} size={13} className="anim-keep shrink-0 -rotate-45" />
            </a>
          </Field>
        ) : null}
        <div className="flex gap-6">
          {conversation.locale ? <Field label={t("context.language")}>{conversation.locale}</Field> : null}
          {countryName ? <Field label={t("context.country")}>{countryName}</Field> : null}
        </div>
      </ContextCard>

      <ContextCard title={t("context.qualityTitle")}>
        <Field label={t("context.satisfaction")}>
          <div className="mt-1 flex items-center gap-2">
            <span className="border-border text-success flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[13px]">
              <Icon icon={ThumbsUpIcon} size={14} /> {up}
            </span>
            <span className="border-border text-error flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[13px]">
              <Icon icon={ThumbsDownIcon} size={14} /> {down}
            </span>
          </div>
        </Field>
        {lastBot ? (
          <div className="border-border border-t pt-3">
            <p className="text-small text-text-muted">{t("context.matchLabel")}</p>
            {score != null ? (
              <>
                <p className="text-kpi text-text mt-1 font-serif">{Math.round(score * 100)}%</p>
                <div className="bg-surface-raised mt-2 h-1.5 overflow-hidden rounded-full">
                  <div className="bg-accent h-full rounded-full" style={{ width: `${Math.round(score * 100)}%` }} />
                </div>
                <p className="text-small text-text-muted mt-2">{t("context.matchExplain")}</p>
              </>
            ) : (
              <p className="text-small text-text-muted mt-1">{t("context.noScore")}</p>
            )}
            {lastBot.citations?.length ? (
              <ul className="mt-3 flex flex-col gap-1.5">
                {lastBot.citations.map((c) => (
                  <li key={c.index} className="text-small flex justify-between gap-3">
                    <span className="text-text truncate">{c.title}</span>
                    <span className="text-text-muted font-mono">{Math.round(c.score * 100)}%</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </ContextCard>

      {lastBot?.fallback ? (
        <section className="border-warning/30 bg-warning/10 rounded-lg border p-4">
          <div className="text-warning flex items-center gap-2">
            <Icon icon={WarningIcon} size={15} />
            <p className="text-small font-medium">{t("context.knowledgeGap")}</p>
          </div>
          {visitorBeforeLastBot ? (
            <p className="text-small text-text-muted mt-2">“{visitorBeforeLastBot.content}”</p>
          ) : null}
          <Link href={`/agents/${conversation.chatbot.id}/sources?add=1`} className="mt-3 block">
            <Button size="sm" className="w-full">
              {t("context.addMissingKnowledge")}
            </Button>
          </Link>
        </section>
      ) : null}
    </>
  );
}
