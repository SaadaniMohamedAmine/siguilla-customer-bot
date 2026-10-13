import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { verifySignature } from "@/lib/crypto";
import { runIngestionStep } from "@/lib/ingestion/pipeline";
import { triggerIngestion } from "@/lib/ingestion/trigger";
import { LimitError } from "@/lib/ingestion/guards";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-sigilla-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const { dataSourceId, ts } = JSON.parse(raw) as { dataSourceId: string; ts: number };
  if (Date.now() - ts > 5 * 60_000) return NextResponse.json({ error: "Expired" }, { status: 401 });

  try {
    const { done } = await runIngestionStep(dataSourceId);
    if (!done) after(() => triggerIngestion(dataSourceId)); // maintient l'invocation vivante jusqu'à l'envoi
    return NextResponse.json({ done });
  } catch (error) {
    const code = error instanceof LimitError ? error.code : "processing_failed";
    console.error(`[ingest] ${dataSourceId}`, error);
    await prisma.dataSource
      .update({ where: { id: dataSourceId }, data: { status: "failed", error: code, cursor: {} } })
      .catch(() => {});
    return NextResponse.json({ done: true, error: code }, { status: 200 });
  }
}
