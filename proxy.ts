import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
const DEFAULT_APP_ROUTE = "/agents";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (!sessionCookie && !isAuthRoute) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  if (sessionCookie && isAuthRoute && !pathname.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL(DEFAULT_APP_ROUTE, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/agents/:path*",
    "/conversations/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
  ],
};
