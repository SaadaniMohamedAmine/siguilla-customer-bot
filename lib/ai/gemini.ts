// lib/ai/gemini.ts
//
// Uses @google/genai (the current unified Google Gen AI SDK), not the
// deprecated @google/generative-ai.
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.7-flash";

// gemini-embedding-2 outputs 3072 dimensions by default (Matryoshka
// representation learning). Pinned to 768 to match Chunk.embedding's
// vector(768) column (prisma/schema.prisma) — if one changes, the other must too.
export const EMBEDDING_OUTPUT_DIMENSIONALITY = 768;

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number })?.status;
      if (status && status < 500 && status !== 429) throw error; // erreur non transitoire
      await new Promise((r) => setTimeout(r, 500 * 2 ** i + Math.random() * 250));
    }
  }
  throw lastError;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await withRetry(() =>
    genAI.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY, taskType: "RETRIEVAL_DOCUMENT" },
    }),
  );
  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("Gemini returned no embedding values");
  return values;
}

/** Jusqu'à 50 textes par appel (à ajuster si l'API impose une autre limite — lire l'erreur). */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  const BATCH = 50;
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const res = await withRetry(() =>
      genAI.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: slice,
        config: { outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY, taskType: "RETRIEVAL_DOCUMENT" },
      }),
    );
    const vectors = res.embeddings?.map((e) => e.values ?? []) ?? [];
    if (vectors.length !== slice.length) throw new Error("Gemini batch embedding size mismatch");
    out.push(...vectors);
  }
  return out;
}

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const response = await withRetry(() =>
    genAI.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY, taskType: "RETRIEVAL_QUERY" },
    }),
  );
  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("Gemini returned no embedding values");
  return values;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * @google/genai's chats.create() takes a real `config.systemInstruction`
 * option, so system messages don't need to be hacked into a prefix on the
 * last user turn. This splits the conversation into a joined
 * system-instruction string, a `history` array (every turn except the last,
 * mapped to Gemini's {role: "user"|"model", parts} shape), and the final
 * turn's raw text to send.
 */
function toGeminiChatInput(messages: ChatMessage[]): {
  systemInstruction: string | undefined;
  history: { role: string; parts: { text: string }[] }[];
  lastText: string;
} {
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const conversational = messages.filter((m) => m.role !== "system");

  const history = conversational.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const last = conversational[conversational.length - 1];

  return {
    systemInstruction: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    history,
    lastText: last?.content ?? "",
  };
}

export async function generateChatCompletion(messages: ChatMessage[]): Promise<string> {
  const { systemInstruction, history, lastText } = toGeminiChatInput(messages);
  const chat = genAI.chats.create({
    model: GEMINI_CHAT_MODEL,
    config: systemInstruction ? { systemInstruction } : undefined,
    history,
  });
  const response = await chat.sendMessage({ message: lastText });
  return response.text ?? "";
}

export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  const { systemInstruction, history, lastText } = toGeminiChatInput(messages);
  const chat = genAI.chats.create({
    model: GEMINI_CHAT_MODEL,
    config: systemInstruction ? { systemInstruction } : undefined,
    history,
  });
  const stream = await chat.sendMessageStream({ message: lastText });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

export { genAI };
