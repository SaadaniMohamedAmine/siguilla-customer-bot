// lib/ai/groq.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 1024,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty completion");
  return content;
}

/**
 * Streaming variant. The `await` below resolves once Groq's HTTP response headers
 * arrive — if the request is rejected (429 rate limit, 5xx, bad model name, etc.)
 * it throws HERE, before any token has streamed. That's what makes it safe for the
 * orchestrator (lib/ai/orchestrator.ts) to try Groq streaming and fall back to
 * Gemini streaming on failure without ever sending a half-started Groq response
 * to the client.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<AsyncIterable<string>> {
  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 1024,
    stream: true,
  });

  async function* generator(): AsyncGenerator<string> {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
  return generator();
}

export function isGroqRateLimitOrServerError(error: unknown): boolean {
  const err = error as { status?: number } | null | undefined;
  if (!err) return false;
  if (err.status === 429) return true;
  if (typeof err.status === "number" && err.status >= 500) return true;
  return false;
}

export { groq };
