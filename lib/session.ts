import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { APIError } from "better-auth/api";
import { StripeNotConfiguredError } from "@/lib/stripe/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Résout l'organisation active de la session. Fallback sur la première organisation
 * de l'utilisateur (par date de création) si `activeOrganizationId` n'est pas encore
 * posé — le hook `session.create.before` (lib/auth.ts) peut s'exécuter avant que le
 * hook `user.create.after` ait fini de créer l'organisation personnelle.
 */
async function resolveActiveMembership(userId: string, activeOrganizationId: string | null | undefined) {
  if (activeOrganizationId) {
    const member = await prisma.member.findFirst({ where: { organizationId: activeOrganizationId, userId } });
    if (member) return member;
  }
  return prisma.member.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
}

/** Pages : redirige vers /sign-in si non connecté. Retourne user + organisation active. */
export async function requireOrgPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  const member = await resolveActiveMembership(session.user.id, session.session.activeOrganizationId);
  if (!member) redirect("/sign-in");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: member.organizationId } });
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
  const member = await resolveActiveMembership(session.user.id, session.session.activeOrganizationId);
  if (!member) throw new HttpError(403, "No active organization");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: member.organizationId } });
  if (opts?.write && org.isDemo) throw new HttpError(403, "The demo is read-only.");
  return { user: session.user, org, role: member.role as "owner" | "admin" | "member" };
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  // Stripe non configuré (variables absentes) : indisponibilité claire, pas une panne.
  if (error instanceof StripeNotConfiguredError) return Response.json({ error: "billing_unavailable" }, { status: 503 });
  // Erreur renvoyée par Better Auth (droits insuffisants, etc.) : on garde son statut au lieu d’un 500.
  if (error instanceof APIError) return Response.json({ error: error.message }, { status: error.statusCode });
  // Corps de requête invalide (Zod) : erreur du client, pas du serveur.
  if (error instanceof ZodError) return Response.json({ error: "invalid_request" }, { status: 400 });
  console.error("[api]", error);
  return Response.json({ error: "Internal error" }, { status: 500 });
}
