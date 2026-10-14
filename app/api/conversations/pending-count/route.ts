import { requireOrgApi, toErrorResponse } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { org } = await requireOrgApi();
    const count = await prisma.conversation.count({
      where: {
        status: "handoff_requested",
        visitorId: { not: { startsWith: "playground:" } },
        chatbot: { organizationId: org.id },
      },
    });
    return Response.json({ data: { count } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
