import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { getPlanLimits } from "@/lib/billing/plans";

export async function GET() {
  try {
    const { org } = await requireOrgApi();
    const { apiKeys } = await auth.api.listApiKeys({
      query: { organizationId: org.id },
      headers: await headers(),
    });
    return Response.json({
      data: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        start: k.start,
        prefix: k.prefix,
        createdAt: k.createdAt,
        lastRequest: k.lastRequest,
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

const Body = z.object({ name: z.string().trim().min(1).max(60) });

export async function POST(request: NextRequest) {
  try {
    const { org, user, role } = await requireOrgApi({ write: true });
    if (role === "member") throw new HttpError(403, "Only owners and admins can manage API keys.");
    if (!getPlanLimits(org.plan).api) throw new HttpError(403, "api_requires_pro");
    const body = Body.parse(await request.json());
    const key = await auth.api.createApiKey({
      body: { name: body.name, prefix: "sk_live_", organizationId: org.id, userId: user.id } as never,
    });
    return Response.json({ data: { id: key.id, key: key.key, start: key.start } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { role } = await requireOrgApi({ write: true });
    if (role === "member") throw new HttpError(403, "Only owners and admins can manage API keys.");
    const id = request.nextUrl.searchParams.get("id");
    if (!id) throw new HttpError(400, "invalid_request");
    await auth.api.deleteApiKey({ body: { keyId: id }, headers: await headers() });
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
