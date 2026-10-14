"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnswerText, sealedSources } from "@/components/chat/answer-text";
import { SealedBy } from "@/components/ui/citation-seal";
import { streamChat } from "@/components/chat/use-sse-chat";
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
            setMessages((m) => m.map((msg) => (msg.id === streamingId ? { ...msg, content: "Something went wrong.", fallback: true } : msg)));
          }
        },
      );
      const inspectorHeader = headers.get("x-sigilla-retrieval");
      if (inspectorHeader) setRetrieval(JSON.parse(decodeBase64(inspectorHeader)));
    } catch {
      setMessages((m) => m.map((msg) => (msg.id === streamingId ? { ...msg, content: "Connection issue. Please try again.", fallback: true } : msg)));
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

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6">
      <div className="flex w-[60%] flex-col rounded-md border border-border">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-serif text-h3 text-text">Playground</h2>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset conversation
          </Button>
        </div>
        <div ref={feedRef} className="flex-1 overflow-y-auto p-4" role="log" aria-live="polite">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-md px-3 py-2 text-body",
                  m.role === "visitor" ? "ml-auto bg-surface-raised text-text" : "border border-border bg-surface text-text",
                  m.fallback && "italic text-text-muted",
                )}
              >
                <AnswerText text={m.content} citations={m.citations ?? []} />
                {m.role === "bot" && m.citations?.length ? (
                  <SealedBy sources={sealedSources(m.citations)} label="Sealed by sources —" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            rows={1}
            placeholder="Ask a question…"
            className="max-h-24 flex-1 resize-none"
          />
          <Button onClick={ask} loading={busy} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </div>

      <div className="flex w-[40%] flex-col gap-4 overflow-y-auto rounded-md border border-border p-4">
        <h3 className="font-serif text-h3 text-text">Retrieval inspector</h3>

        <div>
          <label className="label-caps">Similarity threshold</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0.5}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-raised accent-accent"
            />
            <span className="w-12 text-right font-mono text-body text-text">{threshold.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-small text-text-muted">Below the threshold, your agent declines and offers a human.</p>
        </div>

        {(provider || latencyMs !== null) && (
          <div className="flex items-center gap-3 font-mono text-small text-text-muted">
            {provider ? <span>{provider === "groq" ? "Groq" : "Gemini fallback"}</span> : null}
            {latencyMs !== null ? <span>{latencyMs}ms to first token</span> : null}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {retrieval.length === 0 ? (
            <p className="text-small text-text-muted">Ask a question to see the matched sources.</p>
          ) : (
            retrieval.map((r) => (
              <details key={r.index} className="rounded-sm border border-border p-2">
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-small text-text-muted">#{r.index}</span>
                    <span className="truncate text-small text-text">{r.title}</span>
                  </span>
                  <span className="font-mono text-small text-text-muted">{r.score.toFixed(4)}</span>
                </summary>
                <div className="mt-2 h-0.5 w-full bg-surface-raised">
                  <div
                    className={cn("h-0.5", r.score >= threshold ? "bg-accent" : "bg-text-muted")}
                    style={{ width: `${Math.min(100, r.score * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-small text-text-muted">{r.page ? `Page ${r.page}` : r.url}</p>
                <p className="mt-1 text-small text-text">{r.excerpt}</p>
              </details>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
