// lib/ai/orchestrator.ts
import {
  generateChatCompletion as groqGenerate,
  streamChatCompletion as groqStream,
  isGroqRateLimitOrServerError,
  type ChatMessage,
} from "./groq";
import {
  generateChatCompletion as geminiGenerate,
  streamChatCompletion as geminiStream,
  generateEmbedding as geminiEmbedding,
  generateEmbeddingsBatch as geminiEmbeddingsBatch,
  generateQueryEmbedding as geminiQueryEmbedding,
} from "./gemini";

export type { ChatMessage };

export type GenerateOptions = { temperature?: number; maxTokens?: number };

/** Embeddings always go through Gemini — Groq has no embeddings endpoint. */
export async function getEmbedding(text: string): Promise<number[]> {
  return geminiEmbedding(text);
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  return geminiEmbeddingsBatch(texts);
}

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  return geminiQueryEmbedding(text);
}

/** Non-streaming chat generation with automatic Groq -> Gemini fallback. */
export async function generateAnswer(
  messages: ChatMessage[],
  options?: GenerateOptions,
): Promise<{ text: string; provider: "groq" | "gemini" }> {
  try {
    const text = await groqGenerate(messages, options);
    return { text, provider: "groq" };
  } catch (error) {
    const rateLimited = isGroqRateLimitOrServerError(error);
    console.warn(
      `[orchestrator] Groq generation failed (${rateLimited ? "rate-limit/server error" : "other error"}), falling back to Gemini:`,
      error,
    );
    const text = await geminiGenerate(messages);
    return { text, provider: "gemini" };
  }
}

export type StreamAnswerResult = {
  stream: AsyncIterable<string>;
  provider: "groq" | "gemini";
};

/**
 * Streaming chat generation with automatic Groq -> Gemini fallback. The fallback
 * decision happens BEFORE any bytes reach the caller (see the comment on
 * `streamChatCompletion` in lib/ai/groq.ts for why this is safe) — callers never
 * see a stream that starts with one provider and silently switches mid-answer.
 */
export async function streamAnswer(messages: ChatMessage[], options?: GenerateOptions): Promise<StreamAnswerResult> {
  try {
    const stream = await groqStream(messages, options);
    return { stream, provider: "groq" };
  } catch (error) {
    const rateLimited = isGroqRateLimitOrServerError(error);
    console.warn(
      `[orchestrator] Groq streaming failed to start (${rateLimited ? "rate-limit/server error" : "other error"}), falling back to Gemini:`,
      error,
    );
    const stream = geminiStream(messages);
    return { stream, provider: "gemini" };
  }
}
