import { NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";

async function loadOwnedSource(id: string, organizationId: string) {
  const source = await prisma.dataSource.findFirst({ where: { id, chatbot: { organizationId } } });
  if (!source) throw new HttpError(404, "not_found");
  return source;
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi({ write: true });
    const source = await loadOwnedSource(id, org.id);
    if (source.blobUrl) await del(source.blobUrl).catch(() => {});
    await prisma.dataSource.delete({ where: { id } });
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
