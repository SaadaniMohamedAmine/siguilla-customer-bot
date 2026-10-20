import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/public/cors";
import { busyWaitMinutes, isPrefetchRequest } from "@/lib/demo-guard";
import { DEMO_PER_HOUR } from "@/lib/public/limits";

export async function GET(request: NextRequest) {
  // Un préchargement ne doit ni ouvrir de session démo ni consommer le quota (voir isPrefetchRequest).
  if (isPrefetchRequest(request.headers)) return new Response(null, { status: 204 });
  const rl = await rateLimit(`demo:${clientIp(request)}`, DEMO_PER_HOUR, 60 * 60_000);
  if (!rl.ok) {
    // La landing affiche un message avec le délai d'attente (components/marketing/demo-busy-notice.tsx).
    return NextResponse.redirect(new URL(`/?demo=busy&wait=${busyWaitMinutes(rl.retryAfterSeconds)}`, request.url));
  }
  const res = await auth.api.signInEmail({
    body: { email: process.env.DEMO_USER_EMAIL!, password: process.env.DEMO_USER_PASSWORD! },
    asResponse: true,
  });
  const redirect = NextResponse.redirect(new URL("/agents", request.url));
  res.headers.getSetCookie().forEach((c) => redirect.headers.append("set-cookie", c));
  return redirect;
}
