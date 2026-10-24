// Corrige les adresses de sources des agents de démonstration quand le seed a été lancé avec NEXT_PUBLIC_APP_URL=http://localhost:3000
// (chaque citation du widget de la landing, d'Atelier Lune et de Ledgerline pointait alors vers une adresse locale).
//
//   npx tsx scripts/fix-demo-urls.ts                      -> simulation : compte et liste, n'écrit rien
//   npx tsx scripts/fix-demo-urls.ts --apply              -> applique (sauvegarde des anciennes valeurs dans demo-urls-backup.json)
//   npx tsx scripts/fix-demo-urls.ts --apply --from=http://localhost:3000 --to=https://mon-domaine.app
//
// Ne touche qu'aux organisations `isDemo`, qu'aux adresses qui commencent par `--from`, et seulement le préfixe.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parse } from "dotenv";

if (existsSync(".env.local")) Object.assign(process.env, parse(readFileSync(".env.local")));

const arg = (name: string, fallback: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const FROM = arg("from", "http://localhost:3000");
const TO = arg("to", "https://siguilla-customer-bot.vercel.app");
const APPLY = process.argv.includes("--apply");

async function main() {
  const { prisma } = await import("../lib/db");
  const bots = await prisma.chatbot.findMany({ where: { organization: { isDemo: true } }, select: { id: true, name: true } });
  const ids = bots.map((b) => b.id);
  const chunks = await prisma.chunk.findMany({ where: { chatbotId: { in: ids }, sourceUrl: { startsWith: FROM } }, select: { id: true, sourceUrl: true } });
  const sources = await prisma.dataSource.findMany({ where: { chatbotId: { in: ids }, url: { startsWith: FROM } }, select: { id: true, url: true } });
  console.log(`agents de démo : ${bots.map((b) => b.name).join(" | ")}`);
  console.log(`${APPLY ? "À corriger" : "Simulation"} : ${chunks.length} passages, ${sources.length} sources (${FROM} -> ${TO})`);
  console.log("exemples :", chunks.slice(0, 3).map((c) => `${c.sourceUrl} -> ${c.sourceUrl!.replace(FROM, TO)}`).join("\n           "));
  if (!APPLY) {
    console.log("Rien n'a été modifié. Relancez avec --apply pour appliquer.");
    await prisma.$disconnect();
    return;
  }
  writeFileSync("demo-urls-backup.json", JSON.stringify({ from: FROM, to: TO, chunks, sources }, null, 1));
  // Tout ou rien : une seule transaction interactive, avec un délai large (≈ 50 écritures sur le réseau dépassent les 5 s par défaut).
  await prisma.$transaction(
    async (tx) => {
      for (const c of chunks) await tx.chunk.update({ where: { id: c.id }, data: { sourceUrl: c.sourceUrl!.replace(FROM, TO) } });
      for (const s of sources) await tx.dataSource.update({ where: { id: s.id }, data: { url: s.url!.replace(FROM, TO) } });
    },
    { timeout: 120_000, maxWait: 20_000 },
  );
  console.log(`Fait. Sauvegarde : demo-urls-backup.json (pour revenir en arrière, échangez --from et --to).`);
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error("ERREUR", e instanceof Error ? e.message : e);
  process.exit(1);
});
