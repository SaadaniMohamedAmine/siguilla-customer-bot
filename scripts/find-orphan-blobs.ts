// npx tsx scripts/find-orphan-blobs.ts [--min-age-minutes=60] [--delete]
//
// Liste les fichiers du store Vercel Blob que plus rien ne référence en base
// (sources PDF + avatars des agents). LECTURE SEULE par défaut : rien n'est supprimé sans --delete.
// Les fichiers récents sont ignorés (upload en cours, avatar pas encore sauvegardé).
// Attention : il lit .env.local, donc la base et le store ciblés sont ceux de ce fichier.
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  // Import après dotenv : lib/db lit DATABASE_URL dès son chargement.
  const { prisma } = await import("../lib/db");
  const { list } = await import("@vercel/blob");
  const { avatarUrlOf, deleteBlobs } = await import("../lib/blob-cleanup");

  const minAge = Number(process.argv.find((a) => a.startsWith("--min-age-minutes="))?.split("=")[1] ?? 60);
  const shouldDelete = process.argv.includes("--delete");

  const [sources, chatbots] = await Promise.all([
    prisma.dataSource.findMany({ where: { blobUrl: { not: null } }, select: { blobUrl: true } }),
    prisma.chatbot.findMany({ select: { widgetConfig: true } }),
  ]);
  const referenced = new Set<string>(
    [...sources.map((s) => s.blobUrl), ...chatbots.map((c) => avatarUrlOf(c.widgetConfig))].filter(
      (u): u is string => !!u,
    ),
  );

  const orphans: { url: string; pathname: string; size: number; uploadedAt: Date }[] = [];
  let total = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    for (const b of page.blobs) {
      total++;
      const ageMin = (Date.now() - new Date(b.uploadedAt).getTime()) / 60_000;
      if (!referenced.has(b.url) && ageMin >= minAge) orphans.push(b);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  console.log(`[orphans] ${total} blobs, ${referenced.size} referenced in DB, ${orphans.length} orphan(s) older than ${minAge} min`);
  for (const o of orphans) console.log(`  ${o.pathname}  ${(o.size / 1024).toFixed(1)} KB  ${new Date(o.uploadedAt).toISOString()}`);

  if (orphans.length && shouldDelete) {
    for (let i = 0; i < orphans.length; i += 100) await deleteBlobs(orphans.slice(i, i + 100).map((o) => o.url));
    console.log(`[orphans] deleted ${orphans.length}`);
  } else if (orphans.length) {
    console.log("[orphans] dry run — re-run with --delete to remove them");
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
