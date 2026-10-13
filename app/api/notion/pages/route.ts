import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { notionClient, searchNotionPages } from "@/lib/ingestion/notion";

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireOrgApi();
    const conn = await prisma.notionConnection.findUnique({ where: { organizationId: org.id } });
    if (!conn) throw new HttpError(404, "notion_not_connected");
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const pages = await searchNotionPages(notionClient(conn.accessTokenEnc), query);
    return Response.json({ data: pages });
  } catch (error) {
    return toErrorResponse(error);
  }
}
