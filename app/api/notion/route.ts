import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse } from "@/lib/session";

export async function DELETE() {
  try {
    const { org } = await requireOrgApi({ write: true });
    await prisma.notionConnection.deleteMany({ where: { organizationId: org.id } });
    return Response.json({ data: { organizationId: org.id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
