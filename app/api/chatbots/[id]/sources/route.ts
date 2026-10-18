import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { SourceCreate } from "@/lib/validation/chatbot";
import { assertCanAddSource, LimitError } from "@/lib/ingestion/guards";
import { triggerIngestion } from "@/lib/ingestion/trigger";
import { normalizeUrl } from "@/lib/ingestion/crawler";
import { assertPublicUrl, UnsafeUrlError } from "@/lib/ingestion/safe-url";

async function loadOwnedChatbot(id: string, organizationId: string) {
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId } });
  if (!chatbot) throw new HttpError(404, "not_found");
  return chatbot;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi();
    await loadOwnedChatbot(id, org.id);
    const sources = await prisma.dataSource.findMany({ where: { chatbotId: id }, orderBy: { createdAt: "desc" } });
    return Response.json({ data: sources });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi({ write: true });
    const chatbot = await loadOwnedChatbot(id, org.id);
    const body = SourceCreate.parse(await request.json());

    try {
      await assertCanAddSource(org.id, chatbot.id, body.type);
    } catch (error) {
      if (error instanceof LimitError) return Response.json({ error: error.code }, { status: 403 });
      throw error;
    }

    let source;
    if (body.type === "pdf") {
      source = await prisma.dataSource.create({
        data: { chatbotId: chatbot.id, type: "pdf", name: body.name, blobUrl: body.blobUrl, blobPathname: body.blobPathname },
      });
    } else if (body.type === "url") {
      const normalized = normalizeUrl(body.url);
      if (!normalized) return Response.json({ error: "invalid_url" }, { status: 400 });
      try {
        await assertPublicUrl(normalized);
      } catch (error) {
        if (error instanceof UnsafeUrlError) return Response.json({ error: "invalid_url" }, { status: 400 });
        throw error;
      }
      source = await prisma.dataSource.create({
        data: { chatbotId: chatbot.id, type: "url", name: new URL(normalized).hostname, url: normalized },
      });
    } else {
      source = await prisma.dataSource.create({
        data: { chatbotId: chatbot.id, type: "notion", name: "Notion", notionPageIds: body.pageIds },
      });
    }

    after(() => triggerIngestion(source.id));
    return Response.json({ data: source }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
