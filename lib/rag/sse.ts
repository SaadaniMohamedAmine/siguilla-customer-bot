import type { StreamEvent } from "./types";

export function sseResponse(events: AsyncGenerator<StreamEvent>, init?: { headers?: HeadersInit }): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const e of events) controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      } catch (error) {
        console.error("[sse]", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", code: "internal" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      ...init?.headers,
    },
  });
}
