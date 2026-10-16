import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Police serif de la marque pour les images générées (satori n'accepte que ttf/otf/woff, pas woff2).
 * Lecture via process.cwd() : le tracing de Next embarque ainsi le fichier dans le déploiement.
 */
export async function loadSerifFont(): Promise<ArrayBuffer> {
  const file = await readFile(path.join(process.cwd(), "assets", "fonts", "InstrumentSerif-Regular.woff"));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
}
