"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { AnswerText, sealedSources } from "@/components/chat/answer-text";
import { SealedBy } from "@/components/ui/citation-seal";
import { streamChat } from "@/components/chat/use-sse-chat";
import { ConversationIcon, RefreshIcon, SendIcon, WarningIcon, SearchIcon } from "@/lib/icons";
import type { Citation, StreamEvent } from "@/lib/rag/types";
import { cn } from "@/lib/utils";

/** atob() only handles Latin-1; titles/excerpts can contain multi-byte UTF-8. */
function decodeBase64(value: string): string {
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

type Message = {
  id: string;
  role: "visitor" | "bot";
  content: string;
  citations?: Citation[];
  fallback?: boolean;
};

type RetrievalRow = { index: number; score: number; title: string; url: string | null; page: number | null; excerpt: string };

export function PlaygroundClient({ chatbotId, defaultThreshold }: { chatbotId: string; defaultThreshold: number }) {
  const t = useTranslations("Playground");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [threshold, setThreshold] = React.useState(defaultThreshold);
  const [retrieval, setRetrieval] = React.useState<RetrievalRow[]>([]);
  const [provider, setProvider] = React.useState<"groq" | "gemini" | null>(null);
  const [latencyMs, setLatencyMs] = React.useState<number | null>(null);
  const feedRef = React.useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
    });
  }

  async function ask() {
    const question = input.trim();
    if (!question || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { id: `visitor-${Date.now()}`, role: "visitor", content: question }]);
    scrollToBottom();

    const streamingId = `bot-${Date.now()}`;
    setMessages((m) => [...m, { id: streamingId, role: "bot", content: "" }]);
    let text = "";
    let firstTokenAt: number | null = null;
    const startedAt = performance.now();

    try {
      const headers = await streamChat(
        `/api/chatbots/${chatbotId}/playground`,
        { question, conversationId, threshold },
        (e: StreamEvent) => {
          if (e.type === "meta") setConversationId(e.conversationId);
          if (e.type === "token") {
            if (firstTokenAt === null) {
              firstTokenAt = performance.now();
              setLatencyMs(Math.round(firstTokenAt - startedAt));
            }
            text += e.value;
            setMessages((m) => m.map((msg) => (msg.id === streamingId ? { ...msg, content: text } : msg)));
            scrollToBottom();
          }
          if (e.type === "done") {
            setProvider(e.provider);
            setMessages((m) =>
              m.map((msg) => (msg.id === streamingId ? { ...msg, content: text, citations: e.citations, fallback: e.fallback } : msg)),
            );
          }
          if (e.type === "error") {
            setMessages((m) => m.map((msg) => (msg.id === streamingId ? { ...msg, content: t("errorGeneric"), fallback: true } : msg)));
          }
        },
      );
      const inspectorHeader = headers.get("x-sigilla-retrieval");
      if (inspectorHeader) setRetrieval(JSON.parse(decodeBase64(inspectorHeader)));
    } catch {
      setMessages((m) => m.map((msg) => (msg.id === streamingId ? { ...msg, content: t("errorConn"), fallback: true } : msg)));
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  function reset() {
    setMessages([]);
    setConversationId(null);
    setRetrieval([]);
    setProvider(null);
    setLatencyMs(null);
  }

  const pctThreshold = ((threshold - 0.5) / 0.45) * 100;

  return (
    <div className="grid h-[calc(100vh-290px)] min-h-[520px] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="border-border bg-surface flex min-h-0 flex-col rounded-lg border">
        <div className="border-border flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-serif text-h3 text-text">{t("title")}</h2>
            <p className="text-small text-text-muted">{t("subtitle")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} disabled={messages.length === 0}>
            <Icon icon={RefreshIcon} size={14} />
            {t("reset")}
          </Button>
        </div>
        <div ref={feedRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="border-border bg-bg text-link flex size-14 items-center justify-center rounded-full border">
                <Icon icon={ConversationIcon} size={24} />
              </span>
              <p className="text-h3 text-text font-serif">{t("emptyTitle")}</p>
              <p className="text-body text-text-muted max-w-sm">{t("emptyBody")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) => {
                const isVisitor = m.role === "visitor";
                const typing = !isVisitor && !m.content && busy;
                return (
                  <div key={m.id} className={cn("page-in anim-keep flex gap-2.5", isVisitor ? "justify-end" : "justify-start")}>
                    {!isVisitor ? (
                      <span
                        aria-hidden
                        className="bg-accent text-on-accent mt-1 flex size-7 shrink-0 items-center justify-center rounded-full font-serif text-[14px]"
                      >
                        S
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-4 py-3 text-body",
                        isVisitor && "border-accent/20 bg-tint rounded-br-sm border text-text",
                        !isVisitor && !m.fallback && "border-border bg-bg rounded-bl-sm border text-text",
                        m.fallback && "border-warning/40 bg-warning/5 rounded-bl-sm border text-text-muted",
                      )}
                    >
                      {m.fallback ? (
                        <p className="text-small text-warning mb-1.5 flex items-center gap-1.5 font-medium">
                          <Icon icon={WarningIcon} size={13} />
                          {t("noVerified")}
                        </p>
                      ) : null}
                      {typing ? (
                        <span className="flex items-center gap-1 py-1" aria-label={t("thinking")}>
                          {[0, 150, 300].map((d) => (
                            <span
                              key={d}
                              className="anim-keep bg-text-muted size-1.5 rounded-full"
                              style={{ animation: `mock-dot 700ms ease-in-out ${d}ms infinite` }}
                            />
                          ))}
                        </span>
                      ) : (
                        <AnswerText text={m.content} citations={m.citations ?? []} />
                      )}
                      {m.role === "bot" && m.citations?.length ? (
                        <SealedBy sources={sealedSources(m.citations)} label={t("sealedBy")} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-border border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              rows={Math.min(4, Math.max(1, input.split("\n").length))}
              placeholder={t("placeholder")}
              className="flex-1 resize-none"
            />
            <Button onClick={ask} loading={busy} disabled={!input.trim()}>
              <Icon icon={SendIcon} size={16} />
              {t("send")}
            </Button>
          </div>
          <p className="text-small text-text-muted mt-2">{t("hint")}</p>
        </div>
      </div>

      <div className="scroll-thin flex min-h-0 flex-col gap-4 overflow-y-auto">
        <section className="border-border bg-surface rounded-lg border p-5">
          <h3 className="font-serif text-h3 text-text">{t("inspectorTitle")}</h3>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="threshold" className="label-caps">
                {t("threshold")}
              </label>
              <span className="border-border bg-bg text-text rounded-full border px-2.5 py-0.5 font-mono text-[13px]">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              id="threshold"
              type="range"
              min={0.5}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-accent"
              style={{
                background: `linear-gradient(to right, var(--accent) ${pctThreshold}%, var(--surface-raised) ${pctThreshold}%)`,
              }}
            />
            <div className="text-small text-text-muted mt-1 flex justify-between font-mono text-[11px]">
              <span>0.50</span>
              <span>0.95</span>
            </div>
            <p className="mt-2 text-small text-text-muted">{t("thresholdHelp")}</p>
          </div>

          {(provider || latencyMs !== null) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {provider ? (
                <span className="border-border text-text-muted rounded-full border px-2.5 py-0.5 font-mono text-[12px]">
                  {provider === "groq" ? "Groq" : t("geminiFallback")}
                </span>
              ) : null}
              {latencyMs !== null ? (
                <span className="border-border text-text-muted rounded-full border px-2.5 py-0.5 font-mono text-[12px]">
                  {t("firstToken", { ms: latencyMs })}
                </span>
              ) : null}
            </div>
          )}
        </section>

        <section className="border-border bg-surface rounded-lg border p-5">
          <h3 className="font-serif text-h3 text-text">{t("matchedSources")}</h3>
          {retrieval.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
              <span className="border-border bg-bg text-text-muted flex size-10 items-center justify-center rounded-full border">
                <Icon icon={SearchIcon} size={18} />
              </span>
              <p className="text-small text-text-muted max-w-[220px]">{t("askToSee")}</p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {retrieval.map((r) => {
                const above = r.score >= threshold;
                return (
                  <li key={r.index}>
                    <details className="border-border bg-bg group rounded-md border p-3 open:border-text-muted">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-link font-serif text-[16px] italic">{String(r.index).padStart(2, "0")}</span>
                          <span className="truncate text-small text-text">{r.title}</span>
                        </span>
                        <span className={cn("font-mono text-small", above ? "text-success" : "text-text-muted")}>
                          {Math.round(r.score * 100)}%
                        </span>
                      </summary>
                      <div className="relative mt-3 h-1.5 w-full rounded-full bg-surface-raised">
                        <div
                          className={cn("h-1.5 rounded-full", above ? "bg-accent" : "bg-text-muted")}
                          style={{ width: `${Math.min(100, r.score * 100)}%` }}
                        />
                        <span
                          aria-hidden
                          className="bg-text absolute -top-1 h-3.5 w-px"
                          style={{ left: `${Math.min(100, threshold * 100)}%` }}
                        />
                      </div>
                      <p className={cn("mt-2 text-small", above ? "text-success" : "text-text-muted")}>
                        {above ? t("aboveThreshold") : t("belowThreshold")}
                      </p>
                      <p className="mt-2 text-small text-text-muted">{r.page ? t("page", { n: r.page }) : r.url}</p>
                      <p className="mt-1 text-small text-text">{r.excerpt}</p>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
