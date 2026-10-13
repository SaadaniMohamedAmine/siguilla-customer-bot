import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { ChatbotUpdate } from "@/lib/validation/chatbot";

async function loadOwnedChatbot(id: string, organizationId: string) {
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId } });
  if (!chatbot) throw new HttpError(404, "not_found");
  return chatbot;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi();
    const chatbot = await loadOwnedChatbot(id, org.id);
    return Response.json({ data: chatbot });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi({ write: true });
    await loadOwnedChatbot(id, org.id);
    const body = ChatbotUpdate.parse(await request.json());
    const chatbot = await prisma.chatbot.update({ where: { id }, data: body });
    return Response.json({ data: chatbot });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi({ write: true });
    await loadOwnedChatbot(id, org.id);
    await prisma.chatbot.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
