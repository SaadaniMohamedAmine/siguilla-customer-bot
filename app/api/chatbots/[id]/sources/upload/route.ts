import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/db";
import { requireOrgApi, HttpError } from "@/lib/session";
import { assertCanAddSource, LimitError } from "@/lib/ingestion/guards";

const MAX_PDF_MB = Number(process.env.MAX_PDF_MB ?? 10);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let org;
  try {
    ({ org } = await requireOrgApi({ write: true }));
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }

  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await assertCanAddSource(org.id, chatbot.id, "pdf");
        if (!pathname.toLowerCase().endsWith(".pdf")) throw new Error("unsupported_type");
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_PDF_MB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const code = error instanceof LimitError ? error.code : error instanceof Error ? error.message : "upload_failed";
    console.error("[sources/upload] token generation failed:", error);
    return NextResponse.json({ error: code }, { status: code === "sources_limit" ? 403 : 400 });
  }
}
