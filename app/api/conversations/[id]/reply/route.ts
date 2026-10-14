import { NextRequest } from "next/server";
import { z } from "zod";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";
import { agentReply } from "@/lib/handoff";
import { loadOwnedConversation } from "../route";

const Body = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, org } = await requireOrgApi({ write: true });
    await loadOwnedConversation(id, org.id);
    let body: z.infer<typeof Body>;
    try {
      body = Body.parse(await request.json());
    } catch {
      throw new HttpError(400, "invalid_request");
    }
    await agentReply(id, user.name, body.content);
    return Response.json({ data: { id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
