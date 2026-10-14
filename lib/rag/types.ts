export type RetrievedChunk = {
  id: string;
  content: string;
  sourceTitle: string;
  sourceUrl: string | null;
  pageNumber: number | null;
  score: number; // similarité cosinus 0..1
};

export type Citation = {
  index: number; // numéro affiché dans le sceau (= position dans le contexte, 1-based)
  chunkId: string;
  title: string;
  url: string | null;
  pageNumber: number | null;
  score: number;
};

/** Protocole SSE commun (widget, playground, API v1). Un événement = une ligne `data: <json>\n\n`. */
export type StreamEvent =
  | { type: "meta"; conversationId: string; fallback: boolean; topScore: number | null }
  | { type: "token"; value: string }
  | {
      type: "done";
      messageId: string;
      citations: Citation[];
      fallback: boolean;
      provider: "groq" | "gemini" | null;
      handoffSuggested: boolean;
    }
  | { type: "error"; code: "quota_exceeded" | "rate_limited" | "too_long" | "unavailable" | "internal" };
