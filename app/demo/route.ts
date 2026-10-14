import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/public/cors";

export async function GET(request: NextRequest) {
  const rl = await rateLimit(`demo:${clientIp(request)}`, 10, 60 * 60_000);
  if (!rl.ok) return NextResponse.redirect(new URL("/?demo=busy", request.url));
  const res = await auth.api.signInEmail({
    body: { email: process.env.DEMO_USER_EMAIL!, password: process.env.DEMO_USER_PASSWORD! },
    asResponse: true,
  });
  const redirect = NextResponse.redirect(new URL("/agents", request.url));
  res.headers.getSetCookie().forEach((c) => redirect.headers.append("set-cookie", c));
  return redirect;
}
