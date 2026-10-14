import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";

export async function loadOwnedConversation(id: string, organizationId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id, chatbot: { organizationId } },
    include: { chatbot: { select: { id: true, name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new HttpError(404, "not_found");
  return conversation;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi();
    const conversation = await loadOwnedConversation(id, org.id);
    return Response.json({ data: conversation });
  } catch (error) {
    return toErrorResponse(error);
  }
}
