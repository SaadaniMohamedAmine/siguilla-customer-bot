import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/ai/groq", () => ({
  streamChatCompletion: vi.fn(async () => {
    throw new Error("groq is down");
  }),
  generateChatCompletion: vi.fn(),
  isGroqRateLimitOrServerError: () => true,
}));
vi.mock("@/lib/ai/gemini", () => ({
  streamChatCompletion: vi.fn(async function* () {
    yield "from gemini";
  }),
  generateChatCompletion: vi.fn(),
  generateEmbedding: vi.fn(),
  generateEmbeddingsBatch: vi.fn(),
  generateQueryEmbedding: vi.fn(),
}));

describe("streamAnswer", () => {
  it("falls back to Gemini when Groq throws", async () => {
    const { streamAnswer } = await import("@/lib/ai/orchestrator");
    const res = await streamAnswer([{ role: "user", content: "hi" }]);
    expect(res.provider).toBe("gemini");
    const pieces: string[] = [];
    for await (const p of res.stream) pieces.push(p);
    expect(pieces).toEqual(["from gemini"]);
  });
});
