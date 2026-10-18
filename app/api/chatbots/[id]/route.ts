import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { ChatbotUpdate } from "@/lib/validation/chatbot";
import { parseWidgetConfig } from "@/lib/widget/config";
import { avatarUrlOf, deleteBlobs } from "@/lib/blob-cleanup";

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
    const existing = await loadOwnedChatbot(id, org.id);
    const body = ChatbotUpdate.parse(await request.json());
    const data = body.widgetConfig
      ? { ...body, widgetConfig: parseWidgetConfig({ ...parseWidgetConfig(existing.widgetConfig), ...body.widgetConfig }) }
      : body;
    const chatbot = await prisma.chatbot.update({ where: { id }, data });
    return Response.json({ data: chatbot });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi({ write: true });
    const chatbot = await loadOwnedChatbot(id, org.id);
    const sources = await prisma.dataSource.findMany({
      where: { chatbotId: id, blobUrl: { not: null } },
      select: { blobUrl: true },
    });
    await prisma.chatbot.delete({ where: { id } });
    // Après la suppression en base : un échec de nettoyage ne doit jamais laisser un agent à moitié supprimé.
    await deleteBlobs([...sources.map((s) => s.blobUrl), avatarUrlOf(chatbot.widgetConfig)]);
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
