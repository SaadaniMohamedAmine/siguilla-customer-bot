import { prisma } from "@/lib/db";

export function originAllowed(origin: string | null, allowedDomains: string[]): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const app = new URL(process.env.NEXT_PUBLIC_APP_URL!).host;
  if (host === app) return true; // landing, preview, page démo
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1"))
    return process.env.NODE_ENV !== "production" || allowedDomains.some((d) => d.startsWith("localhost"));
  if (allowedDomains.length === 0) return true; // non restreint (le dashboard affiche un avertissement)
  const hostname = host.split(":")[0];
  return allowedDomains.some((d) => (d.startsWith("*.") ? hostname === d.slice(2) || hostname.endsWith(d.slice(1)) : hostname === d));
}

export function corsHeaders(origin: string | null): HeadersInit {
  return origin
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        vary: "Origin",
      }
    : {};
}

export async function loadPublicBot(publicKey: string) {
  return prisma.chatbot.findUnique({
    where: { publicKey },
    include: { organization: { select: { id: true, plan: true, isDemo: true } } },
  });
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0.0.0.0";
}
