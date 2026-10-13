import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { triggerIngestion } from "@/lib/ingestion/trigger";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { org } = await requireOrgApi({ write: true });
    const source = await prisma.dataSource.findFirst({ where: { id, chatbot: { organizationId: org.id } } });
    if (!source) throw new HttpError(404, "not_found");

    await prisma.dataSource.update({ where: { id }, data: { status: "queued", cursor: {}, error: null } });
    after(() => triggerIngestion(id));
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
