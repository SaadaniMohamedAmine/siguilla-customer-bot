import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { Client } from "pg";
config({ path: ".env.local" });

async function main() {
  const [extension, index] = readFileSync("prisma/manual/pgvector.sql", "utf8").split("-- 2)");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(process.argv.includes("--index") ? `-- 2)${index}` : extension);
  await client.end();
  console.log("[db:vector] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
