import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { getPlanLimits } from "@/lib/billing/plans";
import { ChatbotCreate } from "@/lib/validation/chatbot";

export async function GET() {
  try {
    const { org } = await requireOrgApi();
    const chatbots = await prisma.chatbot.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: chatbots });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { org } = await requireOrgApi({ write: true });
    const body = ChatbotCreate.parse(await request.json());

    const limits = getPlanLimits(org.plan);
    const count = await prisma.chatbot.count({ where: { organizationId: org.id } });
    if (count >= limits.agents) throw new HttpError(403, "agents_limit");

    const chatbot = await prisma.chatbot.create({
      data: {
        organizationId: org.id,
        name: body.name,
        publicKey: `pk_${randomBytes(12).toString("base64url")}`,
      },
    });
    return Response.json({ data: chatbot }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
