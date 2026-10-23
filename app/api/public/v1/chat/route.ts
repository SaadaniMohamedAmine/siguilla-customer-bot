import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { originAllowed, corsHeaders, loadPublicBot, clientIp, effectiveOrigin } from "@/lib/public/cors";
import { rateLimit } from "@/lib/rate-limit";
import { CHAT_PER_MINUTE, CHAT_PER_DAY } from "@/lib/public/limits";
import { answer } from "@/lib/rag/answer";
import { sseResponse } from "@/lib/rag/sse";
import { assertWithinQuota, incrementMessageUsage } from "@/lib/billing/usage";
import { isAgentPaused } from "@/lib/billing/paused";
import type { StreamEvent } from "@/lib/rag/types";

export const maxDuration = 60;

const Body = z.object({
  pk: z.string(),
  question: z.string().min(1).max(1000),
  visitorId: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[\w-]+$/),
  conversationId: z.string().nullish(),
  locale: z.string().max(10).optional(),
  pageUrl: z.string().max(500).optional(),
});

function errorStream(code: "quota_exceeded" | "rate_limited") {
  async function* gen(): AsyncGenerator<StreamEvent> {
    yield { type: "error", code };
  }
  return gen();
}

export async function OPTIONS(request: NextRequest) {
  const origin = effectiveOrigin(request);
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = effectiveOrigin(request);
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const bot = await loadPublicBot(body.pk);
  if (!bot || bot.status !== "live") return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!originAllowed(origin, bot.allowedDomains)) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });

  const ip = clientIp(request);
  const perMinute = await rateLimit(`chat:${body.pk}:${ip}`, CHAT_PER_MINUTE, 60_000);
  if (!perMinute.ok) {
    return sseResponse(errorStream("rate_limited"), { headers: corsHeaders(origin) });
  }
  const perDay = await rateLimit(`chat:day:${body.pk}:${ip}`, CHAT_PER_DAY, 24 * 60 * 60_000);
  if (!perDay.ok) {
    return sseResponse(errorStream("rate_limited"), { headers: corsHeaders(origin) });
  }

  // Agent au-delà de la limite de l'offre (rétrogradation) : même état « resting » que le quota dépassé, sans changer le widget.
  if (await isAgentPaused(bot.organizationId, bot.organization.plan, bot.id)) {
    return sseResponse(errorStream("quota_exceeded"), { headers: corsHeaders(origin) });
  }

  try {
    await assertWithinQuota(bot.organizationId);
  } catch {
    return sseResponse(errorStream("quota_exceeded"), { headers: corsHeaders(origin) });
  }

  const { events } = await answer({
    chatbotId: bot.id,
    question: body.question,
    visitorId: body.visitorId,
    conversationId: body.conversationId,
    locale: body.locale,
    pageUrl: body.pageUrl,
    country: request.headers.get("x-vercel-ip-country"),
    channel: "widget",
  });

  const organizationId = bot.organizationId;
  async function* withUsageTracking(): AsyncGenerator<StreamEvent> {
    for await (const e of events) {
      if (e.type === "done" && !e.fallback && e.messageId) await incrementMessageUsage(organizationId).catch(() => {});
      yield e;
    }
  }

  return sseResponse(withUsageTracking(), { headers: corsHeaders(origin) });
}
