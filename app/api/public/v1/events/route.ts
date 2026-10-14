import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { originAllowed, corsHeaders, loadPublicBot, clientIp, effectiveOrigin } from "@/lib/public/cors";
import { rateLimit } from "@/lib/rate-limit";
import { MISC_PER_MINUTE } from "@/lib/public/limits";

const Body = z.object({ pk: z.string(), type: z.literal("widget_open") });

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

  const limited = await rateLimit(`events:${clientIp(request)}`, MISC_PER_MINUTE, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: corsHeaders(origin) });

  await prisma.analyticsEvent.create({ data: { chatbotId: bot.id, type: body.type } });
  return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
}
