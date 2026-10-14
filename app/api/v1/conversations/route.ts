import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey, apiError, ApiError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { org } = await authenticateApiKey(request);
    const params = request.nextUrl.searchParams;
    const botId = params.get("botId");
    if (!botId) throw new ApiError(400, "invalid_request", "botId is required.");
    const bot = await prisma.chatbot.findFirst({ where: { id: botId, organizationId: org.id } });
    if (!bot) throw new ApiError(404, "not_found", "Bot not found.");

    const limit = Math.min(100, Number(params.get("limit")) || 30);
    const cursor = params.get("cursor");

    const rows = await prisma.conversation.findMany({
      where: { chatbotId: botId, visitorId: { not: { startsWith: "playground:" } } },
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        status: true,
        createdAt: true,
        lastMessageAt: true,
        _count: { select: { messages: true } },
      },
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    return Response.json({
      data: page.map((c) => ({
        id: c.id,
        status: c.status,
        createdAt: c.createdAt,
        lastMessageAt: c.lastMessageAt,
        messageCount: c._count.messages,
      })),
      nextCursor: hasMore ? page[page.length - 1]?.id : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
