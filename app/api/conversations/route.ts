import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgApi, toErrorResponse } from "@/lib/session";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 30;
const PERIOD_DAYS = new Set([7, 30, 90]);

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireOrgApi();
    const params = request.nextUrl.searchParams;
    const agent = params.get("agent");
    const status = params.get("status"); // handoff_requested | resolved | negative_feedback | unanswered | null (all)
    const q = params.get("q")?.trim();
    const periodParam = Number(params.get("period"));
    const period = PERIOD_DAYS.has(periodParam) ? periodParam : null;
    const cursor = params.get("cursor");

    const base: Prisma.ConversationWhereInput = {
      chatbot: { organizationId: org.id, ...(agent ? { id: agent } : {}) },
      visitorId: { not: { startsWith: "playground:" } },
      ...(period ? { createdAt: { gte: new Date(Date.now() - period * 86_400_000) } } : {}),
      ...(q ? { messages: { some: { content: { contains: q, mode: "insensitive" } } } } : {}),
      ...(status === "resolved" ? { status: "resolved" } : {}),
      ...(status === "negative_feedback" ? { messages: { some: { feedback: "down" } } } : {}),
      ...(status === "unanswered" ? { messages: { some: { fallback: true } } } : {}),
    };

    const select = {
      id: true,
      visitorId: true,
      status: true,
      country: true,
      lastMessageAt: true,
      createdAt: true,
      messages: { orderBy: { createdAt: "desc" as const }, take: 1, select: { content: true, role: true } },
      chatbot: { select: { id: true, name: true } },
    } satisfies Prisma.ConversationSelect;

    // Explicit "Needs human" filter: skip the two-bucket prioritization, it's already a single status.
    if (status === "handoff_requested") {
      const rows = await prisma.conversation.findMany({
        where: { ...base, status: "handoff_requested" },
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select,
      });
      const hasMore = rows.length > PAGE_SIZE;
      const page = rows.slice(0, PAGE_SIZE);
      return Response.json({ data: page, nextCursor: hasMore ? page[page.length - 1]?.id : null });
    }

    // All / negative feedback / unanswered: handoff_requested conversations always surface first.
    // The handoff bucket is fetched in full on the first page only (realistically small — a human
    // needs to see every one of them, not page through them) and the rest uses normal keyset paging.
    const restWhere: Prisma.ConversationWhereInput = { ...base, status: { not: "handoff_requested" } };

    const handoffRows = cursor
      ? []
      : await prisma.conversation.findMany({
          where: { ...base, status: "handoff_requested" },
          orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
          take: PAGE_SIZE,
          select,
        });

    const remaining = PAGE_SIZE - handoffRows.length;
    const restRows =
      remaining > 0
        ? await prisma.conversation.findMany({
            where: restWhere,
            orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
            take: remaining + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select,
          })
        : [];

    const hasMore = restRows.length > remaining;
    const restPage = restRows.slice(0, remaining);
    const data = [...handoffRows, ...restPage];

    return Response.json({ data, nextCursor: hasMore ? restPage[restPage.length - 1]?.id : null });
  } catch (error) {
    return toErrorResponse(error);
  }
}
