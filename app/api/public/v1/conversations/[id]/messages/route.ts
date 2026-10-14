import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { originAllowed, corsHeaders, loadPublicBot } from "@/lib/public/cors";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  const { id } = await params;
  const pk = request.nextUrl.searchParams.get("pk");
  const visitorId = request.nextUrl.searchParams.get("visitorId");
  const after = request.nextUrl.searchParams.get("after") ?? "";
  if (!pk || !visitorId) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const bot = await loadPublicBot(pk);
  if (!bot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!originAllowed(origin, bot.allowedDomains)) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });

  const conversation = await prisma.conversation.findFirst({ where: { id, chatbotId: bot.id, visitorId } });
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404, headers: corsHeaders(origin) });

  const afterDate = after ? new Date(after) : new Date(0);
  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      role: { in: ["visitor", "bot", "agent"] },
      createdAt: isNaN(afterDate.getTime()) ? undefined : { gt: afterDate },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, citations: true, fallback: true, createdAt: true },
  });

  return NextResponse.json(
    { status: conversation.status, agentName: conversation.agentName, messages },
    { headers: { ...corsHeaders(origin), "cache-control": "no-store" } },
  );
}
