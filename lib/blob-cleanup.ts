import { del } from "@vercel/blob";

// Seules les URL de notre store Vercel Blob peuvent être supprimées : `blobUrl` et `avatarUrl`
// viennent du client, un `del()` aveugle ne doit jamais viser autre chose.
const BLOB_HOST = /^[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com$/i;

export function isBlobUrl(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && BLOB_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

/** URL de l'avatar stockée dans le JSON `widgetConfig` d'un agent (ou null). */
export function avatarUrlOf(widgetConfig: unknown): string | null {
  const url = (widgetConfig as { avatarUrl?: unknown } | null | undefined)?.avatarUrl;
  return typeof url === "string" ? url : null;
}

/** Supprime les blobs en un lot. Best-effort : ne lève jamais (la suppression en base prime). */
export async function deleteBlobs(urls: unknown[]): Promise<void> {
  const unique = [...new Set(urls.filter(isBlobUrl))];
  if (unique.length === 0) return;
  try {
    await del(unique);
  } catch (error) {
    console.error("[blob] cleanup failed", error);
  }
}
