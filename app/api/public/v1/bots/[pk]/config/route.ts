import { NextRequest, NextResponse } from "next/server";
import { originAllowed, corsHeaders, loadPublicBot } from "@/lib/public/cors";
import { rateLimit } from "@/lib/rate-limit";
import { CONFIG_PER_MINUTE } from "@/lib/public/limits";
import { parseWidgetConfig } from "@/lib/widget/config";
import { getPlanLimits } from "@/lib/billing/plans";

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ pk: string }> }) {
  const origin = request.headers.get("origin");
  const { pk } = await params;
  const bot = await loadPublicBot(pk);
  if (!bot || !originAllowed(origin, bot.allowedDomains)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ pk: string }> }) {
  const origin = request.headers.get("origin");
  const { pk } = await params;
  const bot = await loadPublicBot(pk);
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL!).host;
  const isAppItself = origin ? (() => { try { return new URL(origin).host === appHost; } catch { return false; } })() : false;

  if (!bot || (bot.status !== "live" && !isAppItself)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!originAllowed(origin, bot.allowedDomains)) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "0.0.0.0";
  const limited = await rateLimit(`config:${ip}`, CONFIG_PER_MINUTE, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: corsHeaders(origin) });

  const config = parseWidgetConfig(bot.widgetConfig);
  const removeBadgeAllowed = getPlanLimits(bot.organization.plan).removeBadge;
  const badge = !removeBadgeAllowed || config.showBadge;

  return NextResponse.json(
    { config, badge, name: bot.name },
    { headers: { ...corsHeaders(origin), "cache-control": "public, max-age=60, stale-while-revalidate=600" } },
  );
}
