import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Pages : redirige vers /sign-in si non connecté. Retourne user + organisation active. */
export async function requireOrgPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect("/sign-in");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const member = await prisma.member.findFirstOrThrow({ where: { organizationId: orgId, userId: session.user.id } });
  return { user: session.user, org, role: member.role as "owner" | "admin" | "member" };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Routes API : lève HttpError 401/403. Chaque requête métier DOIT filtrer par org.id. */
export async function requireOrgApi(opts?: { write?: boolean }) {
  const session = await getSession();
  if (!session?.user) throw new HttpError(401, "Unauthorized");
  const orgId = session.session.activeOrganizationId;
  if (!orgId) throw new HttpError(403, "No active organization");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const member = await prisma.member.findFirst({ where: { organizationId: orgId, userId: session.user.id } });
  if (!member) throw new HttpError(403, "Forbidden");
  if (opts?.write && org.isDemo) throw new HttpError(403, "The demo is read-only.");
  return { user: session.user, org, role: member.role as "owner" | "admin" | "member" };
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error("[api]", error);
  return Response.json({ error: "Internal error" }, { status: 500 });
}
