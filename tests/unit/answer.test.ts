import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RetrievedChunk } from "@/lib/rag/types";

const state: {
  chatbot: Record<string, unknown>;
  conversation: Record<string, unknown>;
  history: { role: string; content: string }[];
  retrieved: RetrievedChunk[];
  streamPieces: string[];
  streamProvider: "groq" | "gemini";
  streamThrows: boolean;
  retrieveThrows: boolean;
} = {
  chatbot: { id: "bot1", name: "Bot", instructions: null, similarityThreshold: 0.75 },
  conversation: { id: "conv1", status: "bot", fallbackStreak: 0 },
  history: [],
  retrieved: [],
  streamPieces: [],
  streamProvider: "groq",
  streamThrows: false,
  retrieveThrows: false,
};

const messageCreate = vi.fn(async (args: { data: Record<string, unknown> }) => ({
  id: "msg1",
  ...args.data,
}));
const conversationUpdate = vi.fn(async (args: { data: Record<string, unknown> }) => {
  const { fallbackStreak, ...rest } = args.data as { fallbackStreak?: number | { increment?: number } };
  Object.assign(state.conversation, rest);
  if (fallbackStreak && typeof fallbackStreak === "object") {
    state.conversation.fallbackStreak =
      (state.conversation.fallbackStreak as number) + (fallbackStreak.increment ?? 1);
  } else if (fallbackStreak !== undefined) {
    state.conversation.fallbackStreak = fallbackStreak;
  }
  return state.conversation;
});
const analyticsEventCreate = vi.fn(async () => ({}));
const requestHandoff = vi.fn(async () => ({}));

vi.mock("@/lib/db", () => ({
  prisma: {
    chatbot: { findUniqueOrThrow: vi.fn(async () => state.chatbot) },
    conversation: {
      findFirst: vi.fn(async () => state.conversation),
      create: vi.fn(async () => state.conversation),
      update: conversationUpdate,
    },
    message: { findMany: vi.fn(async () => state.history), create: messageCreate },
    analyticsEvent: { create: analyticsEventCreate },
  },
}));
vi.mock("@/lib/rag/retrieve", () => ({
  retrieve: vi.fn(async () => {
    if (state.retrieveThrows) throw new Error("embedding service unavailable");
    return state.retrieved;
  }),
}));
vi.mock("@/lib/ai/orchestrator", () => ({
  streamAnswer: vi.fn(async () => {
    if (state.streamThrows) throw new Error("groq and gemini both down");
    async function* gen() {
      for (const p of state.streamPieces) yield p;
    }
    return { stream: gen(), provider: state.streamProvider };
  }),
}));
vi.mock("@/lib/handoff", () => ({ requestHandoff }));

async function drain(input: Parameters<typeof import("@/lib/rag/answer").answer>[0]) {
  const { answer } = await import("@/lib/rag/answer");
  const { events } = await answer(input);
  const out = [];
  for await (const e of events) out.push(e);
  return out;
}

const baseInput = {
  chatbotId: "bot1",
  question: "What's the price?",
  visitorId: "v1",
  channel: "widget" as const,
};

describe("answer()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.chatbot = { id: "bot1", name: "Bot", instructions: null, similarityThreshold: 0.75 };
    state.conversation = { id: "conv1", status: "bot", fallbackStreak: 0 };
    state.history = [];
    state.retrieved = [];
    state.streamPieces = [];
    state.streamProvider = "groq";
    state.streamThrows = false;
    state.retrieveThrows = false;
  });

  it("declines below the similarity threshold without ever calling streamAnswer", async () => {
    state.retrieved = [
      { id: "c1", content: "x", sourceTitle: "A", sourceUrl: null, pageNumber: null, score: 0.3 },
    ];
    const { streamAnswer } = await import("@/lib/ai/orchestrator");
    const events = await drain(baseInput);
    expect(streamAnswer).not.toHaveBeenCalled();
    expect(events.at(-1)).toMatchObject({ type: "done", fallback: true });
  });

  it("falls back when the model emits the NO_VERIFIED_ANSWER sentinel", async () => {
    state.retrieved = [
      { id: "c1", content: "x", sourceTitle: "A", sourceUrl: null, pageNumber: null, score: 0.9 },
    ];
    state.streamPieces = ["NO_VERIFIED_ANSWER"];
    const events = await drain(baseInput);
    expect(events.at(-1)).toMatchObject({ type: "done", fallback: true });
    // Le texte brut émis par le modèle (la sentinelle) ne doit jamais fuiter en token —
    // seul le message de repli pré-écrit (finishFallback) est autorisé à en émettre un.
    expect(events.filter((e) => e.type === "token").map((e) => (e as { value: string }).value)).not.toContain(
      "NO_VERIFIED_ANSWER",
    );
  });

  it("never lets the NO_VERIFIED_ANSWER marker reach the visitor inside a partial answer", async () => {
    state.retrieved = [
      { id: "c1", content: "x", sourceTitle: "A", sourceUrl: null, pageNumber: null, score: 0.9 },
    ];
    // Flux réel vu en production : la moitié de la question reçoit une réponse, l'autre le marqueur.
    state.streamPieces = ["Sigilla is a no-code support platform [1].", "\n\nNO_VERIF", "IED_ANSWER"];
    const events = await drain(baseInput);
    const tokens = events.filter((e) => e.type === "token").map((e) => (e as { value: string }).value);
    expect(tokens.join("")).toBe("Sigilla is a no-code support platform [1].");
    expect(events.at(-1)).toMatchObject({ type: "done", fallback: false });
    // Le message enregistré (relu au rechargement, renvoyé par l'API) est nettoyé lui aussi.
    const saved = messageCreate.mock.calls.at(-1)?.[0].data as { content: string; fallback: boolean };
    expect(saved.content).toBe("Sigilla is a no-code support platform [1].");
    expect(saved.fallback).toBe(false);
  });

  it("answers with a clean unavailable error, not an exception, when the question cannot be embedded", async () => {
    state.retrieveThrows = true;
    const { streamAnswer } = await import("@/lib/ai/orchestrator");
    const events = await drain(baseInput);
    expect(events).toEqual([{ type: "error", code: "unavailable" }]);
    expect(streamAnswer).not.toHaveBeenCalled();
  });

  it("silences the bot entirely while a conversation is in human mode", async () => {
    state.conversation = { id: "conv1", status: "human", fallbackStreak: 0 };
    const { streamAnswer } = await import("@/lib/ai/orchestrator");
    const events = await drain(baseInput);
    expect(streamAnswer).not.toHaveBeenCalled();
    expect(events.at(-1)).toMatchObject({ type: "done", messageId: "" });
  });

  it("rejects a question longer than MAX_QUESTION_CHARS with too_long", async () => {
    const events = await drain({ ...baseInput, question: "x".repeat(1001) });
    expect(events).toEqual([{ type: "error", code: "too_long" }]);
  });

  it("triggers handoffSuggested on the 2nd consecutive fallback", async () => {
    state.retrieved = [
      { id: "c1", content: "x", sourceTitle: "A", sourceUrl: null, pageNumber: null, score: 0.1 },
    ];
    state.conversation.fallbackStreak = 1;
    const events = await drain(baseInput);
    expect(events.at(-1)).toMatchObject({ type: "done", fallback: true, handoffSuggested: true });
    expect(requestHandoff).toHaveBeenCalledWith("conv1", "auto");
  });

  it("does not record analytics or trigger handoff for playground conversations", async () => {
    state.retrieved = [
      { id: "c1", content: "x", sourceTitle: "A", sourceUrl: null, pageNumber: null, score: 0.1 },
    ];
    state.conversation.fallbackStreak = 1;
    await drain({ ...baseInput, channel: "playground" });
    expect(analyticsEventCreate).not.toHaveBeenCalled();
    expect(requestHandoff).not.toHaveBeenCalled();
  });
});
