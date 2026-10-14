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
import { AnswerText, sealedSources } from "@/components/chat/answer-text";
import { SealedBy } from "@/components/ui/citation-seal";
import {
  ConversationIcon,
  UserAddIcon,
  CheckIcon,
  CopyIcon,
  WarningIcon,
  ArrowLeftIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  SendIcon,
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

function visitorLabel(id: string) {
  return id.slice(-4).toUpperCase();
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
    <div className="flex h-[calc(100vh-180px)] min-h-[520px] flex-col">
      <h1 className="text-h1 text-text mb-6 font-serif">{t("title")}</h1>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[340px_1fr_320px]">
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
                className={cn(
                  "text-small rounded-full border px-2.5 py-1 transition-colors",
                  status === f
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border text-text-muted hover:text-text",
                )}
              >
                {t(`filters.${f}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Select
              value={agent || "__all"}
              onValueChange={(v) => setParam("agent", v === "__all" ? null : v)}
            >
              <SelectTrigger className="text-small h-8 flex-1">
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
            <Select
              value={period || "__all"}
              onValueChange={(v) => setParam("period", v === "__all" ? null : v)}
            >
              <SelectTrigger className="text-small h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">—</SelectItem>
                <SelectItem value="7">{t("period7")}</SelectItem>
                <SelectItem value="30">{t("period30")}</SelectItem>
                <SelectItem value="90">{t("period90")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-border min-h-0 flex-1 overflow-y-auto rounded-md border">
            {list.isLoading ? (
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon={ConversationIcon} title={t("noneFound")} className="p-8" />
            ) : (
              <ul>
                {rows.map((c) => {
                  const last = c.messages[0];
                  const params = new URLSearchParams(searchParams.toString());
                  return (
                    <li key={c.id} className="border-border border-b last:border-0">
                      <Link
                        href={`/conversations/${c.id}?${params.toString()}`}
                        className={cn(
                          "hover:bg-surface block px-3 py-3 transition-colors",
                          selectedId === c.id && "bg-surface-raised",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-body text-text">
                            {t("visitor", { id: visitorLabel(c.visitorId) })}
                          </span>
                          <StatusPill tone={STATUS_TONE[c.status]} className="shrink-0">
                            {t(`status.${c.status === "handoff_requested" ? "needsHuman" : c.status}`)}
                          </StatusPill>
                        </div>
                        <div className="text-small text-text-muted mt-1 flex items-center gap-2">
                          {countryName(c.country) ? <span>{countryName(c.country)}</span> : null}
                          <span>{formatRelative(c.lastMessageAt, locale, now)}</span>
                        </div>
                        {last ? (
                          <p className="text-small text-text-muted mt-1 truncate">{last.content}</p>
                        ) : null}
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
          <div className="border-border hidden min-h-0 items-center justify-center rounded-md border xl:col-span-2 xl:flex">
            <p className="text-body text-text-muted">{t("selectOne")}</p>
          </div>
        ) : (
          <>
            <div className="border-border flex min-h-0 flex-col rounded-md border">
              {detail.isLoading || !detail.data ? (
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
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
            <div className="border-border hidden min-h-0 flex-col gap-4 overflow-y-auto rounded-md border p-4 xl:flex">
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
  t: ReturnType<typeof useTranslations<"Conversations">>;
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
  React.useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [conversation.messages.length]);

  const canTakeOver = conversation.status === "bot" || conversation.status === "handoff_requested";
  const canResolve = conversation.status !== "resolved";
  const canReply = conversation.status === "handoff_requested" || conversation.status === "human";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-text-muted hover:text-text xl:hidden">
            <Icon icon={ArrowLeftIcon} size={18} />
          </button>
          <div>
            <h2 className="text-h2 text-text font-serif">
              {t("visitor", { id: conversation.visitorId.slice(-4).toUpperCase() })}
            </h2>
            <p className="text-small text-text-muted">
              {conversation.chatbot.name} ·{" "}
              {t("startedAt", { date: new Date(conversation.createdAt).toLocaleString(locale) })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {canTakeOver ? (
            <Button variant="subtle" size="sm" loading={takingOver} onClick={onTakeOver}>
              <Icon icon={UserAddIcon} size={14} />
              {t("takeOver")}
            </Button>
          ) : null}
          {canResolve ? (
            <Button variant="ghost" size="sm" loading={resolving} onClick={onResolve}>
              <Icon icon={CheckIcon} size={14} />
              {t("resolve")}
            </Button>
          ) : null}
        </div>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {conversation.messages.map((m) => (
            <MessageBubble key={m.id} message={m} t={t} agentName={conversation.agentName} />
          ))}
        </div>
      </div>

      <div className="border-border border-t p-4">
        {canReply ? (
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
              rows={1}
              maxLength={2000}
              placeholder={t("composerPlaceholder", { name: currentUserName })}
              className="flex-1 resize-none"
            />
            <Button loading={sendingReply} onClick={onSendReply} disabled={!reply.trim()}>
              <Icon icon={SendIcon} size={16} />
              {t("send")}
            </Button>
          </div>
        ) : conversation.status === "bot" ? (
          <Button variant="subtle" loading={takingOver} onClick={onTakeOver} className="w-full">
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
  agentName,
}: {
  message: Message;
  t: ReturnType<typeof useTranslations<"Conversations">>;
  agentName: string | null;
}) {
  if (message.role === "system") {
    const code = message.content;
    let label = code;
    if (code === "handoff_requested") label = t("system.handoff_requested");
    else if (code === "resolved") label = t("system.resolved");
    else if (code.startsWith("agent_joined:"))
      label = t("system.agent_joined", { name: code.slice("agent_joined:".length) });
    return <p className="label-caps text-text-muted text-center">{label}</p>;
  }

  const isVisitor = message.role === "visitor";
  const isAgent = message.role === "agent";
  const isFallback = message.fallback;

  return (
    <div className={cn("flex", isVisitor ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-md px-4 py-3",
          isVisitor && "bg-surface-raised",
          !isVisitor && !isFallback && "border-border bg-surface border",
          isFallback && "border-warning bg-surface text-text-muted border-l-2 italic",
        )}
      >
        {isAgent && agentName ? (
          <p className="text-small text-text-muted mb-1 font-medium">{agentName}</p>
        ) : null}
        {message.role === "bot" && !isFallback ? (
          <>
            <AnswerText text={message.content} citations={message.citations ?? []} />
            <SealedBy sources={sealedSources(message.citations ?? [])} label="" />
          </>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {message.role === "bot" ? (
          <div className="text-small text-text-muted mt-2 flex items-center gap-2">
            {message.topScore != null ? (
              <span className="font-mono">{message.topScore.toFixed(2)}</span>
            ) : null}
            {message.feedback === "up" ? (
              <Icon icon={ThumbsUpIcon} size={14} className="text-success" />
            ) : null}
            {message.feedback === "down" ? (
              <Icon icon={ThumbsDownIcon} size={14} className="text-error" />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConversationContext({
  conversation,
  t,
}: {
  conversation: Detail;
  t: ReturnType<typeof useTranslations<"Conversations">>;
}) {
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

  const countryName = (() => {
    if (!conversation.country) return null;
    try {
      return (
        new Intl.DisplayNames([locale], { type: "region" }).of(conversation.country) ?? conversation.country
      );
    } catch {
      return conversation.country;
    }
  })();

  async function copyEmail() {
    if (!conversation.visitorEmail) return;
    try {
      await navigator.clipboard.writeText(conversation.visitorEmail);
      toast.success("Copied");
    } catch {}
  }

  return (
    <>
      <p className="label-caps">{t("context.title")}</p>

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-small text-text-muted">{t("context.email")}</p>
          <p className="text-body text-text">{conversation.visitorEmail ?? t("context.notProvided")}</p>
        </div>
        {conversation.visitorEmail ? (
          <Button variant="ghost" size="icon" onClick={copyEmail} aria-label={t("context.email")}>
            <Icon icon={CopyIcon} size={14} />
          </Button>
        ) : null}
      </div>

      {conversation.pageUrl ? (
        <div>
          <p className="text-small text-text-muted">{t("context.pageOrigin")}</p>
          <a
            href={conversation.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-body text-link truncate hover:underline"
          >
            {conversation.pageUrl}
          </a>
        </div>
      ) : null}

      <div className="flex gap-6">
        {conversation.locale ? (
          <div>
            <p className="text-small text-text-muted">{t("context.language")}</p>
            <p className="text-body text-text">{conversation.locale}</p>
          </div>
        ) : null}
        {countryName ? (
          <div>
            <p className="text-small text-text-muted">{t("context.country")}</p>
            <p className="text-body text-text">{countryName}</p>
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-small text-text-muted">{t("context.satisfaction")}</p>
        <div className="text-body text-text mt-1 flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1">
            <Icon icon={ThumbsUpIcon} size={14} /> {up}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon={ThumbsDownIcon} size={14} /> {down}
          </span>
        </div>
      </div>

      {lastBot ? (
        <div className="border-border border-t pt-4">
          <p className="text-small text-text-muted">{t("context.retrieval")}</p>
          {lastBot.topScore != null ? (
            <p className="text-h3 text-text mt-1 font-mono">{lastBot.topScore.toFixed(2)}</p>
          ) : (
            <p className="text-small text-text-muted mt-1">{t("context.noScore")}</p>
          )}
          <p className="text-small text-text-muted">Gemini · 768d</p>
          {lastBot.citations?.length ? (
            <ul className="mt-2 flex flex-col gap-1">
              {lastBot.citations.map((c) => (
                <li key={c.index} className="text-small flex justify-between">
                  <span className="text-text truncate">{c.title}</span>
                  <span className="text-text-muted font-mono">{c.score.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {lastBot?.fallback ? (
        <div className="border-warning/30 bg-warning/10 rounded-sm border p-3">
          <div className="text-warning flex items-center gap-2">
            <Icon icon={WarningIcon} size={14} />
            <p className="text-small font-medium">{t("context.knowledgeGap")}</p>
          </div>
          {visitorBeforeLastBot ? (
            <p className="text-small text-text-muted mt-1">“{visitorBeforeLastBot.content}”</p>
          ) : null}
          <Link
            href={`/agents/${conversation.chatbot.id}/sources?add=1`}
            className="text-small text-link mt-2 inline-block hover:underline"
          >
            {t("context.addMissingKnowledge")}
          </Link>
        </div>
      ) : null}
    </>
  );
}
