import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const MAX_AVATAR_BYTES = 512 * 1024;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orgId = session.session.activeOrganizationId;
  const chatbot = orgId ? await prisma.chatbot.findFirst({ where: { id, organizationId: orgId } }) : null;
  if (!chatbot) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],
        maximumSizeInBytes: MAX_AVATAR_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[avatar/upload] token generation failed:", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 400 });
  }
}
