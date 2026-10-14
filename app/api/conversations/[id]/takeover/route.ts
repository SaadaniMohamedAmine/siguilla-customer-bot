import { NextRequest } from "next/server";
import { requireOrgApi, toErrorResponse } from "@/lib/session";
import { takeOver } from "@/lib/handoff";
import { loadOwnedConversation } from "../route";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, org } = await requireOrgApi({ write: true });
    await loadOwnedConversation(id, org.id);
    await takeOver(id, user.name);
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
