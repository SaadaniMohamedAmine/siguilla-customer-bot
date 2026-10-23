import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authenticateApiKey, apiError, ApiError } from "@/lib/api-auth";
import { answer } from "@/lib/rag/answer";
import { sseResponse } from "@/lib/rag/sse";
import { assertWithinQuota, incrementMessageUsage } from "@/lib/billing/usage";
import { isAgentPaused } from "@/lib/billing/paused";
import type { StreamEvent, Citation } from "@/lib/rag/types";

export const maxDuration = 60;

const Body = z.object({
  botId: z.string(),
  question: z.string().min(1).max(1000),
  conversationId: z.string().nullish(),
  visitorId: z.string().min(3).max(64).optional(),
  stream: z.boolean().optional().default(true),
  locale: z.string().max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { org, keyId } = await authenticateApiKey(request);
    let body: z.infer<typeof Body>;
    try {
      body = Body.parse(await request.json());
    } catch (e) {
      const issue = e instanceof z.ZodError ? e.issues[0] : null;
      throw new ApiError(
        400,
        "invalid_request",
        issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request body.",
      );
    }

    const bot = await prisma.chatbot.findFirst({ where: { id: body.botId, organizationId: org.id } });
    if (!bot) throw new ApiError(404, "not_found", "Bot not found.");

    if (await isAgentPaused(org.id, org.plan, bot.id))
      throw new ApiError(403, "agent_paused", "This agent is paused: your plan allows fewer agents. Upgrade or delete some.");

    try {
      await assertWithinQuota(org.id);
    } catch {
      throw new ApiError(429, "quota_exceeded", "Monthly message quota exceeded.");
    }

    const { events } = await answer({
      chatbotId: bot.id,
      question: body.question,
      visitorId: body.visitorId ?? `api:${keyId}`,
      conversationId: body.conversationId,
      locale: body.locale,
      channel: "api",
    });

    async function* withUsage(): AsyncGenerator<StreamEvent> {
      for await (const e of events) {
        if (e.type === "done" && !e.fallback && e.messageId)
          await incrementMessageUsage(org.id).catch(() => {});
        yield e;
      }
    }

    if (body.stream) return sseResponse(withUsage());

    let answerText = "";
    let citations: Citation[] = [];
    let fallback = false;
    let conversationId = body.conversationId ?? "";
    for await (const e of withUsage()) {
      if (e.type === "meta") conversationId = e.conversationId;
      if (e.type === "token") answerText += e.value;
      if (e.type === "done") {
        citations = e.citations;
        fallback = e.fallback;
      }
      if (e.type === "error") throw new ApiError(429, e.code, "Request failed.");
    }
    return Response.json({ data: { conversationId, answer: answerText, citations, fallback } });
  } catch (error) {
    return apiError(error);
  }
}
