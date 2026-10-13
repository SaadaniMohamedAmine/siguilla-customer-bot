import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, sign } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const [orgId, signature] = (state ?? "").split(".");
  if (!orgId || !signature || sign(orgId) !== signature || !code) {
    return NextResponse.redirect(new URL("/settings?tab=integrations&notion=error", appUrl));
  }

  const basic = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Basic ${basic}` },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/notion/callback`,
    }),
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL("/settings?tab=integrations&notion=error", appUrl));
  }

  const data = (await res.json()) as {
    access_token: string;
    workspace_id: string;
    workspace_name?: string;
    workspace_icon?: string;
  };

  await prisma.notionConnection.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      accessTokenEnc: encrypt(data.access_token),
      workspaceId: data.workspace_id,
      workspaceName: data.workspace_name,
      workspaceIcon: data.workspace_icon,
    },
    update: {
      accessTokenEnc: encrypt(data.access_token),
      workspaceId: data.workspace_id,
      workspaceName: data.workspace_name,
      workspaceIcon: data.workspace_icon,
    },
  });

  return NextResponse.redirect(new URL("/settings?tab=integrations&notion=connected", appUrl));
}
