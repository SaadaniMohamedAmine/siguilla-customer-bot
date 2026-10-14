import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey, apiError, ApiError } from "@/lib/api-auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { org } = await authenticateApiKey(_request);
    const { id } = await params;
    const conversation = await prisma.conversation.findFirst({
      where: { id, chatbot: { organizationId: org.id } },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true, citations: true, createdAt: true },
        },
      },
    });
    if (!conversation) throw new ApiError(404, "not_found", "Conversation not found.");
    return Response.json({
      data: { id: conversation.id, status: conversation.status, messages: conversation.messages },
    });
  } catch (error) {
    return apiError(error);
  }
}
