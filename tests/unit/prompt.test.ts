import { describe, it, expect } from "vitest";
import { buildMessages, HISTORY_TURNS } from "@/lib/rag/prompt";
import type { RetrievedChunk } from "@/lib/rag/types";

const chunk: RetrievedChunk = {
  id: "1",
  content: "x",
  sourceTitle: 'A "quote"',
  sourceUrl: null,
  pageNumber: null,
  score: 0.9,
};

describe("buildMessages", () => {
  it("contains all 7 numbered rules in the system message", () => {
    const [system] = buildMessages({ botName: "Bot", chunks: [chunk], history: [], question: "Hi" });
    for (let i = 1; i <= 7; i++) expect(system.content).toContain(`${i}.`);
  });

  it("truncates business instructions to 2000 characters", () => {
    const long = "x".repeat(3000);
    const [system] = buildMessages({
      botName: "Bot",
      instructions: long,
      chunks: [chunk],
      history: [],
      question: "Hi",
    });
    const match = /BUSINESS INSTRUCTIONS[^:]*:\n(x+)/.exec(system.content);
    expect(match?.[1].length).toBe(2000);
  });

  it("limits history to the last HISTORY_TURNS entries", () => {
    const history = Array.from({ length: HISTORY_TURNS + 5 }, (_, i) => ({
      role: "visitor" as const,
      content: `turn ${i}`,
    }));
    const messages = buildMessages({ botName: "Bot", chunks: [chunk], history, question: "Hi" });
    const historyMessages = messages.slice(1, -1);
    expect(historyMessages).toHaveLength(HISTORY_TURNS);
    expect(historyMessages[0].content).toBe(`turn ${5}`);
  });

  it("escapes double quotes in source attributes", () => {
    const [system] = buildMessages({ botName: "Bot", chunks: [chunk], history: [], question: "Hi" });
    expect(system.content).toContain("A 'quote'");
    expect(system.content).not.toContain('A "quote"');
  });
});
