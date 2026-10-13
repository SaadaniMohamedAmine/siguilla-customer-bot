import { sign } from "@/lib/crypto";

export async function triggerIngestion(dataSourceId: string) {
  const body = JSON.stringify({ dataSourceId, ts: Date.now() });
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sigilla-signature": sign(body) },
    body,
  });
}
