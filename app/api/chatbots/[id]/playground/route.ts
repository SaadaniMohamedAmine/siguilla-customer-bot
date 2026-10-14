import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse } from "@/lib/session";
import { answer } from "@/lib/rag/answer";
import { sseResponse } from "@/lib/rag/sse";

export const maxDuration = 60;
const Body = z.object({
  question: z.string().min(1).max(1000),
  conversationId: z.string().nullish(),
  threshold: z.number().min(0).max(1).optional(),
  locale: z.string().max(10).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org, user } = await requireOrgApi();
    const bot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
    if (!bot) return Response.json({ error: "not_found" }, { status: 404 });
    const body = Body.parse(await request.json());
    const { events, retrieved } = await answer({
      chatbotId: bot.id,
      question: body.question,
      visitorId: `playground:${user.id}`,
      conversationId: body.conversationId,
      locale: body.locale,
      channel: "playground",
      thresholdOverride: body.threshold,
    });
    // Le playground reçoit aussi l'inspecteur de retrieval dans un en-tête (JSON compact, base64).
    const inspector = Buffer.from(
      JSON.stringify(
        retrieved.map((r, i) => ({
          index: i + 1,
          score: Number(r.score.toFixed(4)),
          title: r.sourceTitle,
          url: r.sourceUrl,
          page: r.pageNumber,
          excerpt: r.content.slice(0, 280),
        })),
      ),
    ).toString("base64");
    return sseResponse(events, { headers: { "x-sigilla-retrieval": inspector } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
