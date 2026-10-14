import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { originAllowed, corsHeaders, loadPublicBot, clientIp, effectiveOrigin } from "@/lib/public/cors";
import { rateLimit } from "@/lib/rate-limit";
import { MISC_PER_MINUTE } from "@/lib/public/limits";

const Body = z.object({
  pk: z.string(),
  messageId: z.string(),
  visitorId: z.string().min(8).max(64),
  value: z.enum(["up", "down"]),
});

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(effectiveOrigin(request)) });
}

export async function POST(request: NextRequest) {
  const origin = effectiveOrigin(request);
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: corsHeaders(origin) });
  }

  const bot = await loadPublicBot(body.pk);
  if (!bot) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!originAllowed(origin, bot.allowedDomains)) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });

  const limited = await rateLimit(`feedback:${clientIp(request)}`, MISC_PER_MINUTE, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: corsHeaders(origin) });

  // N'autorise que si le message appartient à une conversation de CE bot et de CE visiteur.
  const message = await prisma.message.findFirst({
    where: { id: body.messageId, conversation: { chatbotId: bot.id, visitorId: body.visitorId } },
  });
  if (!message) return NextResponse.json({ error: "not_found" }, { status: 404, headers: corsHeaders(origin) });

  await prisma.message.update({ where: { id: message.id }, data: { feedback: body.value } });
  await prisma.analyticsEvent.create({ data: { chatbotId: bot.id, type: "feedback", metadata: { value: body.value } } });

  return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
}
