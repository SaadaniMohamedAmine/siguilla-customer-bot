import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey, apiError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { org } = await authenticateApiKey(request);
    const bots = await prisma.chatbot.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true, status: true, publicKey: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: bots });
  } catch (error) {
    return apiError(error);
  }
}
