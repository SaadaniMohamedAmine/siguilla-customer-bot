import { NextResponse } from "next/server";
import { requireOrgPage } from "@/lib/session";
import { sign } from "@/lib/crypto";

export async function GET() {
  const { org } = await requireOrgPage();
  const state = `${org.id}.${sign(org.id)}`;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`;
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", process.env.NOTION_CLIENT_ID!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
