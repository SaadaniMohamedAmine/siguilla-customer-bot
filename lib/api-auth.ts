import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing/plans";
import { rateLimit } from "@/lib/rate-limit";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function authenticateApiKey(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!key) throw new ApiError(401, "missing_api_key", "Provide an API key in the Authorization header.");
  const result = await auth.api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key)
    throw new ApiError(401, "invalid_api_key", "This API key is invalid or revoked.");
  const orgId = result.key.referenceId;
  if (!orgId) throw new ApiError(401, "invalid_api_key", "This API key is not linked to an organization.");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  if (!getPlanLimits(org.plan).api)
    throw new ApiError(403, "api_requires_pro", "API access requires the Pro or Team plan.");
  const rl = await rateLimit(`api:${result.key.id}`, 60, 60_000);
  if (!rl.ok)
    throw new ApiError(429, "rate_limited", `Too many requests. Retry in ${rl.retryAfterSeconds}s.`);
  return { org, keyId: result.key.id };
}

export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  console.error("[api/v1]", error);
  return Response.json({ error: { code: "internal", message: "Internal error." } }, { status: 500 });
}
