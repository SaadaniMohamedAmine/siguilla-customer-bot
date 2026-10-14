import { NextRequest } from "next/server";
import { requireOrgApi, toErrorResponse } from "@/lib/session";
import {
  getKpis,
  getConversationsPerDay,
  getTopQuestions,
  getUnansweredQuestions,
  getMostCitedSources,
} from "@/lib/analytics/queries";

export async function GET(request: NextRequest) {
  try {
    const { org } = await requireOrgApi();
    const params = request.nextUrl.searchParams;
    const chatbotId = params.get("agent") || undefined;
    const days = [7, 30, 90].includes(Number(params.get("period"))) ? Number(params.get("period")) : 30;
    const scope = { organizationId: org.id, chatbotId };

    const [kpis, perDay, topQuestions, unanswered, citedSources] = await Promise.all([
      getKpis(scope, days),
      getConversationsPerDay(scope, days),
      getTopQuestions(scope, days),
      getUnansweredQuestions(scope, days),
      getMostCitedSources(scope, days),
    ]);

    return Response.json({ data: { kpis, perDay, topQuestions, unanswered, citedSources } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
