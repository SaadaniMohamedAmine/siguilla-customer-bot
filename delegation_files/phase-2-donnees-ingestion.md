# Sigilla — Phase 2 : Données & ingestion

> **Fichier de délégation 2/8.** Spec complète, checklist et code de référence. Aucun aller-retour attendu. Si un point n'est pas couvert : option la plus simple compatible avec le PRD, notée dans `DECISIONS.md`.

---

## 0. À lire avant de commencer

- Règles non négociables : **§0 du fichier Phase 1** (0 $, zéro maintenance, tokens Sigilla, Hugeicons, pas de MD3/Material, copy via next-intl). Elles s'appliquent ici.
- PRD : §3 (stack), §5 (modèle de données), §6 (plans & limites), §7 F3 (ingestion).
- Repo de référence : `../excerpta-chatbot-document/` (`lib/ai/*`, `lib/documents/*`, `next.config.ts`, `app/api/workflows/process-document/route.ts`).
- Écrans Stitch : `sigilla_agent_wizard_sources_screen_9`, `sigilla_knowledge_sources_ingestion_drawer_screen_12`.

**Prérequis :** Phase 1 terminée (auth, organisations, design system, `lib/session.ts`).

---

## 1. Spec de la phase

**Objectif :** le modèle de données complet, pgvector, l'orchestrateur IA, et l'ingestion des trois types de sources (PDF, site web, Notion) vers des chunks vectorisés, avec statuts en direct, re-sync manuelle, suppression et garde-fous. À la fin, une source ajoutée sur un agent devient « Ready » avec N chunks embeddés en base.

**Hors scope :** réponses RAG (Phase 3), widget (Phase 4), wizard complet / overview (Phase 5 — ici seulement une page Sources minimale par agent et un CRUD Chatbot minimal pour pouvoir rattacher des sources), plans payants (Phase 6 — ici les limites sont lues via `getPlanLimits()` qui renvoie Free tant que la Phase 6 n'est pas faite).

---

## 2. Checklist

- [ ] Schéma Prisma complet (Chatbot, DataSource, Chunk, NotionConnection, Conversation, Message, AnalyticsEvent, RateLimitBucket + billing sur Organization)
- [ ] Extension pgvector + index HNSW cosine (SQL manuel versionné)
- [ ] Orchestrateur IA repris d'Excerpta (Groq → Gemini, modèles en env vars)
- [ ] Embeddings Gemini 768d par lots, avec retry et backoff
- [ ] Upload PDF sur Vercel Blob (10 MB max, validation MIME)
- [ ] Pipeline PDF : extraction, nettoyage, chunks avec page, hash de contenu
- [ ] Crawler URL : sitemap.xml, robots.txt, même domaine, 100 pages max, Cheerio, nettoyage nav/footer
- [ ] Traitement par lots enchaînés (curseur + auto-invocation signée HMAC, < 300 s par appel)
- [ ] Notion OAuth + token chiffré AES-GCM
- [ ] Loader Notion (sélection de pages → markdown → chunks)
- [ ] Data Sources manager (liste, ajout PDF / URL / Notion, tiroir d'ajout)
- [ ] Statuts d'ingestion en direct (polling) + messages d'erreur soignés
- [ ] Re-sync manuelle (ré-embed des seuls chunks modifiés, purge des orphelins)
- [ ] Suppression d'une source (chunks + blob nettoyés)
- [ ] Garde-fous : `MAX_TOTAL_CHUNKS`, limites par plan, taille des fichiers

---

## 3. Implémentation

### 3.1 Dépendances

```bash
npm install @google/genai groq-sdk @langchain/textsplitters pdf-parse @napi-rs/canvas @vercel/blob cheerio @notionhq/client
npm install -D @types/pdf-parse
```

`next.config.ts` — ajoute les externals PDF **exactement comme Excerpta** (ils ont été validés en prod) :

```ts
serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
outputFileTracingIncludes: {
  "/api/workflows/ingest": ["./node_modules/@napi-rs/**/*", "./node_modules/pdfjs-dist/**/*"],
},
```

### 3.2 Schéma Prisma (à ajouter sous les modèles Better Auth)

Ajoute aussi les relations inverses dans `Organization` (`chatbots Chatbot[]`, `notionConnection NotionConnection?`).

```prisma
model Chatbot {
  id                  String          @id @default(cuid())
  organizationId      String
  organization        Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  instructions        String?         @db.Text
  publicKey           String          @unique // pk_xxx — exposé dans le snippet du widget
  allowedDomains      String[]        @default([])
  similarityThreshold Float           @default(0.75)
  widgetConfig        Json            @default("{}")
  status              String          @default("draft") // draft | live
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  dataSources         DataSource[]
  chunks              Chunk[]
  conversations       Conversation[]
  events              AnalyticsEvent[]

  @@index([organizationId])
}

model DataSource {
  id             String    @id @default(cuid())
  chatbotId      String
  chatbot        Chatbot   @relation(fields: [chatbotId], references: [id], onDelete: Cascade)
  type           String    // pdf | url | notion
  name           String
  url            String?   // url: point d'entrée du crawl ; pdf: null
  blobUrl        String?   // pdf
  blobPathname   String?
  notionPageIds  String[]  @default([])
  status         String    @default("queued") // queued | processing | ready | failed
  progress       Json      @default("{}")     // { done, total, phase } pour l'UI
  cursor         Json      @default("{}")     // état interne des lots enchaînés
  pagesCount     Int       @default(0)
  chunksCount    Int       @default(0)
  contentHash    String?
  lastSyncedAt   DateTime?
  error          String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  chunks         Chunk[]

  @@index([chatbotId])
}

model Chunk {
  id           String                      @id @default(cuid())
  dataSourceId String
  dataSource   DataSource                  @relation(fields: [dataSourceId], references: [id], onDelete: Cascade)
  chatbotId    String
  chatbot      Chatbot                     @relation(fields: [chatbotId], references: [id], onDelete: Cascade)
  content      String                      @db.Text
  embedding    Unsupported("vector(768)")?
  sourceTitle  String
  sourceUrl    String?
  pageNumber   Int?
  contentHash  String
  createdAt    DateTime                    @default(now())

  @@index([chatbotId])
  @@index([dataSourceId])
  @@unique([dataSourceId, contentHash])
}

model NotionConnection {
  id              String       @id @default(cuid())
  organizationId  String       @unique
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  accessTokenEnc  String       @db.Text // AES-256-GCM (iv:tag:ciphertext, base64)
  workspaceId     String
  workspaceName   String?
  workspaceIcon   String?
  createdAt       DateTime     @default(now())
}

model Conversation {
  id            String    @id @default(cuid())
  chatbotId     String
  chatbot       Chatbot   @relation(fields: [chatbotId], references: [id], onDelete: Cascade)
  visitorId     String
  status        String    @default("bot") // bot | handoff_requested | human | resolved
  visitorEmail  String?
  pageUrl       String?
  locale        String?
  country       String?   // depuis l'en-tête x-vercel-ip-country, jamais l'IP
  agentName     String?   // nom de l'humain qui a repris
  fallbackStreak Int      @default(0)
  lastMessageAt DateTime  @default(now())
  createdAt     DateTime  @default(now())
  messages      Message[]

  @@index([chatbotId, lastMessageAt])
  @@index([chatbotId, status])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // visitor | bot | agent | system
  content        String       @db.Text
  citations      Json         @default("[]") // [{ index, chunkId, title, url, pageNumber, score }]
  topScore       Float?
  fallback       Boolean      @default(false)
  provider       String?      // groq | gemini
  feedback       String?      // up | down
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

model AnalyticsEvent {
  id        String   @id @default(cuid())
  chatbotId String
  chatbot   Chatbot  @relation(fields: [chatbotId], references: [id], onDelete: Cascade)
  type      String   // widget_open | message | feedback | handoff | fallback
  metadata  Json     @default("{}")
  createdAt DateTime @default(now())

  @@index([chatbotId, type, createdAt])
}

model RateLimitBucket {
  key     String   @id
  count   Int      @default(0)
  resetAt DateTime

  @@index([resetAt])
}
```

### 3.3 pgvector — `prisma/manual/pgvector.sql` + script

```sql
-- prisma/manual/pgvector.sql
-- 1) À exécuter AVANT le premier `prisma db push` qui contient le type vector.
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) À exécuter APRÈS `prisma db push` (idempotent).
CREATE INDEX IF NOT EXISTS chunk_embedding_hnsw
  ON "Chunk" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

`scripts/db-vector.ts` :

```ts
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

main().catch((e) => { console.error(e); process.exit(1); });
```

`package.json` : `"db:vector": "tsx scripts/db-vector.ts"`, `"db:vector:index": "tsx scripts/db-vector.ts --index"`, et installe `pg` + `@types/pg` en dev si absent (déjà tiré par `@prisma/adapter-pg`).

Ordre : `npm run db:vector` → `npm run db:push` → `npm run db:vector:index`. Documente-le dans le README (section Setup, Phase 7).

### 3.4 Orchestrateur IA — `lib/ai/`

Copie **à l'identique** depuis Excerpta : `lib/ai/groq.ts`, `lib/ai/gemini.ts`, `lib/ai/orchestrator.ts`. Puis 3 modifications dans `gemini.ts` :

1. `export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";`
2. Ajoute un **retry avec backoff** autour de `embedContent` :

```ts
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number })?.status;
      if (status && status < 500 && status !== 429) throw error; // erreur non transitoire
      await new Promise((r) => setTimeout(r, 500 * 2 ** i + Math.random() * 250));
    }
  }
  throw lastError;
}
```

et utilise `withRetry(() => genAI.models.embedContent({...}))` dans `generateEmbedding`.

3. Ajoute un **embedding batch natif** (une requête pour plusieurs textes) — beaucoup plus rapide et moins de quota :

```ts
/** Jusqu'à 50 textes par appel (à ajuster si l'API impose une autre limite — lire l'erreur). */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  const BATCH = 50;
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const res = await withRetry(() =>
      genAI.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: slice,
        config: { outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY, taskType: "RETRIEVAL_DOCUMENT" },
      }),
    );
    const vectors = res.embeddings?.map((e) => e.values ?? []) ?? [];
    if (vectors.length !== slice.length) throw new Error("Gemini batch embedding size mismatch");
    out.push(...vectors);
  }
  return out;
}
```

Et pour les requêtes (Phase 3) : `generateQueryEmbedding(text)` = même appel avec `taskType: "RETRIEVAL_QUERY"`.

> Si `taskType` n'est pas accepté par le modèle installé, retire-le (note dans `DECISIONS.md`).

`orchestrator.ts` : ajoute `export { generateEmbeddingsBatch, generateQueryEmbedding } from "./gemini";`.

### 3.5 Utilitaires

`lib/hash.ts` :

```ts
import { createHash } from "node:crypto";
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
```

`lib/crypto.ts` (tokens Notion) :

```ts
import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from "node:crypto";

const key = () => Buffer.from(process.env.ENCRYPTION_KEY!, "base64"); // 32 octets

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(":");
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(":").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function sign(body: string): string {
  return createHmac("sha256", process.env.INGESTION_HMAC_SECRET!).update(body).digest("hex");
}

export function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
```

`lib/text.ts` — nettoyage commun :

```ts
export function cleanText(input: string): string {
  const NUL = String.fromCharCode(0);
  return input
    .split(NUL).join("")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
```

### 3.6 Chunking — `lib/ingestion/chunk.ts`

```ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { sha256 } from "@/lib/hash";
import { cleanText } from "@/lib/text";

export type RawSection = { text: string; title: string; url?: string | null; pageNumber?: number | null };
export type PreparedChunk = { content: string; sourceTitle: string; sourceUrl: string | null; pageNumber: number | null; contentHash: string };

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 150 });

/** Découpe section par section (une page PDF, une page web, une page Notion) pour garder une attribution exacte. */
export async function chunkSections(sections: RawSection[]): Promise<PreparedChunk[]> {
  const out: PreparedChunk[] = [];
  for (const s of sections) {
    const text = cleanText(s.text);
    if (text.length < 40) continue;
    for (const piece of await splitter.splitText(text)) {
      out.push({
        content: piece,
        sourceTitle: s.title,
        sourceUrl: s.url ?? null,
        pageNumber: s.pageNumber ?? null,
        contentHash: sha256(`${s.url ?? ""}|${s.pageNumber ?? ""}|${piece}`),
      });
    }
  }
  return out;
}
```

### 3.7 Écriture des chunks avec vecteurs — `lib/ingestion/store.ts`

```ts
import { prisma } from "@/lib/db";
import { generateEmbeddingsBatch } from "@/lib/ai/orchestrator";
import type { PreparedChunk } from "./chunk";

const toVector = (v: number[]) => `[${v.join(",")}]`;

/**
 * Insère uniquement les chunks dont le hash n'existe pas encore pour cette source
 * (re-sync incrémentale). Retourne le nombre de chunks créés.
 */
export async function storeChunks(chatbotId: string, dataSourceId: string, chunks: PreparedChunk[]): Promise<number> {
  if (chunks.length === 0) return 0;
  const existing = await prisma.chunk.findMany({
    where: { dataSourceId, contentHash: { in: chunks.map((c) => c.contentHash) } },
    select: { contentHash: true },
  });
  const known = new Set(existing.map((e) => e.contentHash));
  const fresh = chunks.filter((c) => !known.has(c.contentHash));
  if (fresh.length === 0) return 0;

  const vectors = await generateEmbeddingsBatch(fresh.map((c) => c.content));

  // Insertion en SQL brut (le type vector n'est pas supporté par le client Prisma).
  for (let i = 0; i < fresh.length; i++) {
    const c = fresh[i];
    await prisma.$executeRaw`
      INSERT INTO "Chunk" ("id","dataSourceId","chatbotId","content","embedding","sourceTitle","sourceUrl","pageNumber","contentHash","createdAt")
      VALUES (${crypto.randomUUID()}, ${dataSourceId}, ${chatbotId}, ${c.content}, ${toVector(vectors[i])}::vector,
              ${c.sourceTitle}, ${c.sourceUrl}, ${c.pageNumber}, ${c.contentHash}, now())
      ON CONFLICT ("dataSourceId","contentHash") DO NOTHING`;
  }
  return fresh.length;
}

/** Supprime les chunks de la source qui ne font plus partie du contenu courant. */
export async function purgeOrphans(dataSourceId: string, keepHashes: string[]): Promise<number> {
  const res = await prisma.chunk.deleteMany({ where: { dataSourceId, contentHash: { notIn: keepHashes } } });
  return res.count;
}
```

### 3.8 Garde-fous — `lib/ingestion/guards.ts`

```ts
import { prisma } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing/plans"; // créé ici en version minimale, enrichi en Phase 6

export class LimitError extends Error { constructor(public code: string) { super(code); } }

export async function assertCanAddSource(orgId: string, chatbotId: string, type: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const limits = getPlanLimits(org.plan);
  const count = await prisma.dataSource.count({ where: { chatbotId } });
  if (count >= limits.sourcesPerAgent) throw new LimitError("sources_limit");
  if (type === "notion" && !limits.notion) throw new LimitError("notion_requires_pro");
}

export async function assertGlobalChunkBudget(extra: number) {
  const total = await prisma.chunk.count();
  const max = Number(process.env.MAX_TOTAL_CHUNKS ?? 60000);
  if (total + extra > max) throw new LimitError("global_storage_full");
}
```

`lib/billing/plans.ts` (version minimale — la Phase 6 ajoute prix et Stripe) :

```ts
export type PlanId = "free" | "pro" | "team";
export const PLAN_LIMITS = {
  free: { agents: 1, sourcesPerAgent: 5, pagesPerSite: 25, messagesPerMonth: 200, notion: false, api: false, removeBadge: false, members: 1 },
  pro: { agents: 5, sourcesPerAgent: 25, pagesPerSite: 100, messagesPerMonth: 2000, notion: true, api: true, removeBadge: true, members: 3 },
  team: { agents: 15, sourcesPerAgent: 50, pagesPerSite: 100, messagesPerMonth: 10000, notion: true, api: true, removeBadge: true, members: 10 },
} as const;
export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan as PlanId) in PLAN_LIMITS ? (plan as PlanId) : "free"];
}
```

### 3.9 Loaders

**PDF — `lib/ingestion/pdf.ts`** : copie `extractPdfText` d'Excerpta (`lib/documents/extract-text.ts`, avec `stripNulBytes`), puis :

```ts
export async function loadPdfSections(blobUrl: string, title: string): Promise<RawSection[]> {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`blob_download_failed_${res.status}`);
  const { pages } = await extractPdfText(Buffer.from(await res.arrayBuffer()));
  return pages.map((p) => ({ text: p.text, title, pageNumber: p.pageNumber, url: null }));
}
```

**Site web — `lib/ingestion/crawler.ts`** :

```ts
import * as cheerio from "cheerio";

const UA = "SigillaBot/1.0 (+https://sigilla.app/bot)";
const PAGE_TIMEOUT_MS = 10_000;
const POLITENESS_MS = 250;

export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const u = new URL(raw, base);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"].forEach((p) => u.searchParams.delete(p));
    if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch { return null; }
}

const SKIP_EXT = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|mp3|css|js|json|xml|woff2?)$/i;

async function fetchText(url: string): Promise<{ status: number; type: string; body: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/xml" }, redirect: "follow", signal: ctrl.signal });
    return { status: res.status, type: res.headers.get("content-type") ?? "", body: res.ok ? await res.text() : "" };
  } finally { clearTimeout(t); }
}

/** Règles Disallow pour User-agent: * (simplifié, suffisant ici). */
export async function loadRobots(origin: string): Promise<(path: string) => boolean> {
  const { body } = await fetchText(`${origin}/robots.txt`).catch(() => ({ body: "" } as { body: string }));
  const disallow: string[] = [];
  let applies = false;
  for (const line of body.split("\n")) {
    const [k, ...rest] = line.split(":");
    const v = rest.join(":").trim();
    if (/^user-agent$/i.test(k.trim())) applies = v === "*" || /sigilla/i.test(v);
    else if (applies && /^disallow$/i.test(k.trim()) && v) disallow.push(v);
  }
  return (path) => !disallow.some((d) => path.startsWith(d));
}

/** Découverte initiale : sitemap.xml (et sitemap index, 1 niveau) sinon la page d'entrée. */
export async function discoverUrls(startUrl: string, max: number): Promise<string[]> {
  const origin = new URL(startUrl).origin;
  const found = new Set<string>();
  const { body } = await fetchText(`${origin}/sitemap.xml`).catch(() => ({ body: "" } as { body: string }));
  if (body.includes("<loc>")) {
    const $ = cheerio.load(body, { xmlMode: true });
    const locs = $("loc").map((_, el) => $(el).text().trim()).get();
    const nested = locs.filter((l) => l.endsWith(".xml")).slice(0, 5);
    for (const l of locs) if (!l.endsWith(".xml")) found.add(l);
    for (const n of nested) {
      const sub = await fetchText(n).catch(() => ({ body: "" } as { body: string }));
      const $$ = cheerio.load(sub.body, { xmlMode: true });
      $$("loc").each((_, el) => { found.add($$(el).text().trim()); });
    }
  }
  const list = [...found].map((u) => normalizeUrl(u)).filter((u): u is string => !!u && new URL(u).origin === origin);
  return list.length ? list.slice(0, max) : [normalizeUrl(startUrl)!];
}

export type CrawledPage = { url: string; title: string; text: string; links: string[] };

export async function crawlPage(url: string): Promise<CrawledPage | null> {
  await new Promise((r) => setTimeout(r, POLITENESS_MS));
  const { status, type, body } = await fetchText(url);
  if (status >= 400 || !type.includes("text/html") || !body) return null;
  const $ = cheerio.load(body);
  $("script,style,noscript,svg,iframe,nav,header,footer,form,aside,[role=navigation],[aria-hidden=true],.cookie,#cookie-banner").remove();
  const title = ($("meta[property='og:title']").attr("content") || $("title").text() || url).trim().slice(0, 200);
  const main = $("main").length ? $("main") : $("article").length ? $("article") : $("body");
  const text = main.find("h1,h2,h3,h4,p,li,td,th,blockquote,pre,dt,dd").map((_, el) => $(el).text().trim()).get().filter(Boolean).join("\n");
  const origin = new URL(url).origin;
  const links = $("a[href]").map((_, el) => normalizeUrl($(el).attr("href")!, url)).get()
    .filter((u): u is string => !!u && new URL(u).origin === origin && !SKIP_EXT.test(new URL(u).pathname));
  return { url, title, text, links: [...new Set(links)] };
}
```

**Notion — `lib/ingestion/notion.ts`** :

```ts
import { Client } from "@notionhq/client";
import { decrypt } from "@/lib/crypto";
import type { RawSection } from "./chunk";

export function notionClient(accessTokenEnc: string) {
  return new Client({ auth: decrypt(accessTokenEnc) });
}

type RichText = { plain_text: string }[];
const rt = (r?: RichText) => (r ?? []).map((t) => t.plain_text).join("");

/** Convertit récursivement les blocs d'une page en markdown simple (profondeur max 3). */
async function blocksToMarkdown(client: Client, blockId: string, depth = 0): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    for (const b of res.results as any[]) {
      const t = b.type as string;
      const v = b[t];
      switch (t) {
        case "heading_1": lines.push(`# ${rt(v.rich_text)}`); break;
        case "heading_2": lines.push(`## ${rt(v.rich_text)}`); break;
        case "heading_3": lines.push(`### ${rt(v.rich_text)}`); break;
        case "paragraph": lines.push(rt(v.rich_text)); break;
        case "bulleted_list_item": lines.push(`- ${rt(v.rich_text)}`); break;
        case "numbered_list_item": lines.push(`1. ${rt(v.rich_text)}`); break;
        case "to_do": lines.push(`- [${v.checked ? "x" : " "}] ${rt(v.rich_text)}`); break;
        case "quote": case "callout": lines.push(`> ${rt(v.rich_text)}`); break;
        case "code": lines.push("```\n" + rt(v.rich_text) + "\n```"); break;
        case "toggle": lines.push(rt(v.rich_text)); break;
        case "table_row": lines.push((v.cells as RichText[]).map(rt).join(" | ")); break;
        default: break;
      }
      if (b.has_children && depth < 3 && t !== "child_page") lines.push(await blocksToMarkdown(client, b.id, depth + 1));
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return lines.filter(Boolean).join("\n");
}

export async function loadNotionPage(client: Client, pageId: string): Promise<RawSection> {
  const page: any = await client.pages.retrieve({ page_id: pageId });
  const titleProp = Object.values(page.properties ?? {}).find((p: any) => p.type === "title") as any;
  const title = rt(titleProp?.title) || "Untitled";
  const text = await blocksToMarkdown(client, pageId);
  return { title, text, url: page.url ?? null, pageNumber: null };
}

/** Pages accessibles par l'intégration (pour la sélection dans l'UI). */
export async function searchNotionPages(client: Client, query = "") {
  const res = await client.search({ query, filter: { property: "object", value: "page" }, page_size: 50 });
  return (res.results as any[]).map((p) => {
    const titleProp = Object.values(p.properties ?? {}).find((x: any) => x.type === "title") as any;
    return { id: p.id as string, title: rt(titleProp?.title) || "Untitled", url: p.url as string, lastEdited: p.last_edited_time as string };
  });
}
```

### 3.10 Pipeline par lots enchaînés — `lib/ingestion/pipeline.ts`

Principe : chaque invocation de `/api/workflows/ingest` traite **un lot** (≤ 8 pages web, ou ≤ 20 pages PDF, ou ≤ 5 pages Notion), enregistre un **curseur** dans `DataSource.cursor`, puis **se ré-invoque** via `after()` avec une requête signée HMAC. Budget de temps interne : 240 s (marge sous `maxDuration = 300`).

```ts
import { prisma } from "@/lib/db";
import { chunkSections, type RawSection } from "./chunk";
import { storeChunks, purgeOrphans } from "./store";
import { loadPdfSections } from "./pdf";
import { discoverUrls, crawlPage, loadRobots, normalizeUrl } from "./crawler";
import { notionClient, loadNotionPage } from "./notion";
import { assertGlobalChunkBudget } from "./guards";
import { getPlanLimits } from "@/lib/billing/plans";

type Cursor = {
  phase?: "discover" | "process" | "finalize";
  queue?: string[];       // url: URLs restantes ; notion: pageIds restants
  seen?: string[];        // url: URLs déjà vues
  pdfPage?: number;       // pdf: prochaine page
  pdfTotal?: number;
  keepHashes?: string[];  // hashes du contenu courant (pour purger les orphelins en fin de sync)
  pagesDone?: number;
};

const BUDGET_MS = 240_000;

export async function runIngestionStep(dataSourceId: string): Promise<{ done: boolean }> {
  const started = Date.now();
  const ds = await prisma.dataSource.findUniqueOrThrow({ where: { id: dataSourceId }, include: { chatbot: { include: { organization: true } } } });
  const cursor: Cursor = (ds.cursor as Cursor) ?? {};
  const keep = new Set(cursor.keepHashes ?? []);
  let pagesDone = cursor.pagesDone ?? 0;

  const save = async (patch: Partial<Cursor>, progress: Record<string, unknown>) =>
    prisma.dataSource.update({
      where: { id: ds.id },
      data: { status: "processing", cursor: { ...cursor, ...patch, keepHashes: [...keep], pagesDone }, progress },
    });

  const ingest = async (sections: RawSection[]) => {
    const chunks = await chunkSections(sections);
    chunks.forEach((c) => keep.add(c.contentHash));
    await assertGlobalChunkBudget(chunks.length);
    await storeChunks(ds.chatbotId, ds.id, chunks);
  };

  if (ds.type === "pdf") {
    const sections = await loadPdfSections(ds.blobUrl!, ds.name);
    const from = cursor.pdfPage ?? 0;
    const STEP = 20;
    await ingest(sections.slice(from, from + STEP));
    pagesDone = Math.min(sections.length, from + STEP);
    if (pagesDone < sections.length) {
      await save({ pdfPage: pagesDone, pdfTotal: sections.length }, { done: pagesDone, total: sections.length, phase: "embedding" });
      return { done: false };
    }
  }

  if (ds.type === "url") {
    const max = getPlanLimits(ds.chatbot.organization.plan).pagesPerSite;
    let queue = cursor.queue;
    const seen = new Set(cursor.seen ?? []);
    if (!queue) {
      queue = await discoverUrls(ds.url!, max);
      queue.forEach((u) => seen.add(u));
    }
    const allowed = await loadRobots(new URL(ds.url!).origin);
    while (queue.length && pagesDone < max && Date.now() - started < BUDGET_MS) {
      const url = queue.shift()!;
      if (!allowed(new URL(url).pathname)) continue;
      const page = await crawlPage(url).catch(() => null);
      if (!page) continue;
      pagesDone++;
      await ingest([{ text: page.text, title: page.title, url: page.url }]);
      for (const l of page.links) {
        const n = normalizeUrl(l);
        if (n && !seen.has(n) && seen.size < max * 3) { seen.add(n); queue.push(n); }
      }
      if (pagesDone % 8 === 0) {
        await save({ queue, seen: [...seen] }, { done: pagesDone, total: Math.min(max, pagesDone + queue.length), phase: "crawling" });
        return { done: false }; // rend la main : prochaine invocation
      }
    }
    if (queue.length && pagesDone < max) {
      await save({ queue, seen: [...seen] }, { done: pagesDone, total: Math.min(max, pagesDone + queue.length), phase: "crawling" });
      return { done: false };
    }
  }

  if (ds.type === "notion") {
    const conn = await prisma.notionConnection.findUniqueOrThrow({ where: { organizationId: ds.chatbot.organizationId } });
    const client = notionClient(conn.accessTokenEnc);
    const queue = cursor.queue ?? [...ds.notionPageIds];
    let n = 0;
    while (queue.length && n < 5 && Date.now() - started < BUDGET_MS) {
      const pageId = queue.shift()!;
      await ingest([await loadNotionPage(client, pageId)]);
      pagesDone++; n++;
    }
    if (queue.length) {
      await save({ queue }, { done: pagesDone, total: ds.notionPageIds.length, phase: "reading" });
      return { done: false };
    }
  }

  // Finalisation : purge des chunks obsolètes (re-sync), compteurs, statut.
  await purgeOrphans(ds.id, [...keep]);
  const chunksCount = await prisma.chunk.count({ where: { dataSourceId: ds.id } });
  await prisma.dataSource.update({
    where: { id: ds.id },
    data: {
      status: chunksCount > 0 ? "ready" : "failed",
      error: chunksCount > 0 ? null : "no_content",
      pagesCount: pagesDone, chunksCount, cursor: {}, progress: { done: pagesDone, total: pagesDone, phase: "ready" },
      lastSyncedAt: new Date(),
    },
  });
  return { done: true };
}
```

`lib/ingestion/trigger.ts` :

```ts
import { sign } from "@/lib/crypto";

export async function triggerIngestion(dataSourceId: string) {
  const body = JSON.stringify({ dataSourceId, ts: Date.now() });
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sigilla-signature": sign(body) },
    body,
  });
}
```

`app/api/workflows/ingest/route.ts` :

```ts
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
    await prisma.dataSource.update({ where: { id: dataSourceId }, data: { status: "failed", error: code, cursor: {} } }).catch(() => {});
    return NextResponse.json({ done: true, error: code }, { status: 200 });
  }
}
```

> En local, `NEXT_PUBLIC_APP_URL=http://localhost:3000` : la chaîne fonctionne avec `npm run dev`.

### 3.11 Routes API (dashboard, session + organisation)

Toutes utilisent `requireOrgApi()` et **vérifient que le chatbot appartient à `org.id`** (`prisma.chatbot.findFirstOrThrow({ where: { id, organizationId: org.id } })`). Écritures avec `requireOrgApi({ write: true })`. Validation Zod du body.

| Méthode & route | Rôle |
|---|---|
| `POST /api/chatbots` | Crée un agent minimal `{ name }` → `publicKey = "pk_" + randomBytes(12).toString("base64url")` (limite `agents` du plan) |
| `GET /api/chatbots` | Liste des agents de l'org |
| `GET/PATCH/DELETE /api/chatbots/[id]` | Lecture / mise à jour (name, description, instructions, allowedDomains, similarityThreshold, widgetConfig, status) / suppression |
| `GET /api/chatbots/[id]/sources` | Liste des sources (statut, progress, compteurs, erreur) |
| `POST /api/chatbots/[id]/sources/upload` | **Upload PDF** — utilise `handleUpload` de `@vercel/blob/client` : `onBeforeGenerateToken` vérifie session + `assertCanAddSource`, `allowedContentTypes: ["application/pdf"]`, `maximumSizeInBytes: MAX_PDF_MB*1024*1024`, `addRandomSuffix: true` |
| `POST /api/chatbots/[id]/sources` | Crée la source après upload `{ type: "pdf", name, blobUrl, blobPathname }`, `{ type: "url", url }` (valide `http(s)`, normalise) ou `{ type: "notion", pageIds[] }` → `status: "queued"` puis `after(() => triggerIngestion(id))` |
| `POST /api/sources/[id]/resync` | Remet `status: "queued"`, `cursor: {}` puis `after(triggerIngestion)` — incrémental grâce aux hashes |
| `DELETE /api/sources/[id]` | Supprime la source (cascade chunks) **et** le blob (`del(blobUrl)` de `@vercel/blob`) |
| `GET /api/notion/connect` | Redirige vers `https://api.notion.com/v1/oauth/authorize?client_id=…&response_type=code&owner=user&redirect_uri=<APP_URL>/api/notion/callback&state=<orgId signé HMAC>` |
| `GET /api/notion/callback` | Vérifie `state`, échange le `code` (`POST https://api.notion.com/v1/oauth/token`, Basic auth client_id:secret, `grant_type=authorization_code`), chiffre `access_token`, upsert `NotionConnection`, redirige vers `/settings?tab=integrations&notion=connected` |
| `GET /api/notion/pages?q=` | `searchNotionPages` pour la sélection |
| `DELETE /api/notion` | Supprime la connexion |

Réponses d'erreur normalisées : `{ error: "<code>" }` avec codes `sources_limit`, `notion_requires_pro`, `global_storage_full`, `invalid_url`, `file_too_large`, `unsupported_type` — traduits côté client via `messages.*.Sources.errors`.

### 3.12 UI — Sources

Page `app/(app)/agents/[id]/sources/page.tsx` (la navigation par onglets complète de l'agent arrive en Phase 5 ; ici un en-tête simple avec le nom de l'agent suffit). Référence : `sigilla_knowledge_sources_ingestion_drawer_screen_12`.

- **Table** : Nom (icône `PdfIcon`/`GlobeIcon`/`NotionIcon` + nom), Type, Statut (`StatusPill` : Ready = success, Processing = accent + texte « Crawling 37/100 » / « Embedding 12/40 », Queued = neutral, Failed = error), Pages / Chunks (`font-mono`), Dernière synchro (relative, `Intl.RelativeTimeFormat` selon la locale), actions (Resync `RefreshIcon`, Delete `DeleteIcon` avec Dialog de confirmation « Delete this source? » / bouton `destructive`).
- **Ligne en erreur** : message traduit sous le nom (`text-small text-error`), bouton « Retry » (= resync).
- **Barre de progression** fine 2px `bg-accent` sur la ligne en cours (`progress.done / progress.total`).
- **Polling** : `useQuery({ refetchInterval: (q) => q.state.data?.some(s => ["queued","processing"].includes(s.status)) ? 3000 : false })`.
- **Bouton « Add source »** → `Drawer` droit avec 3 cartes sélectionnables :
  1. **Upload PDFs** — zone drag & drop (bordure pointillée hairline), multi-fichiers, `upload()` de `@vercel/blob/client` avec `handleUploadUrl`, barre de progression par fichier, rejet propre > 10 MB / non-PDF.
  2. **Crawl a website** — input URL + note « Up to {max} pages, same domain. » (max selon le plan).
  3. **Connect Notion** — si non connecté : bouton « Connect workspace » (+ chip « Pro » si plan Free, bouton désactivé) ; si connecté : liste de pages avec recherche et cases à cocher, bouton « Add {n} pages ».
- **État vide** : `EmptyState` « No sources yet. Add a PDF, a URL or a Notion page to begin. »
- Textes : namespace `Sources` dans `messages/en.json` / `fr.json` (titres, colonnes, statuts, erreurs, confirmations).

---

## 4. Critères d'acceptation

- [ ] `npm run db:vector && npm run db:push && npm run db:vector:index` fonctionnent sur une base Neon vide.
- [ ] Upload d'un PDF de 30 pages → statut passe `queued → processing (Embedding x/30) → ready`, `chunksCount > 0`, chaque chunk a `pageNumber`.
- [ ] Crawl d'un site de doc publique (ex. une doc de 40 pages) → plusieurs invocations enchaînées visibles dans les logs, ≤ limite du plan, aucune URL hors domaine, `robots.txt` respecté.
- [ ] Re-sync sans changement → **0 nouvel embedding** (vérifier via log du nombre de chunks créés).
- [ ] Re-sync après modification d'une page → seuls les chunks modifiés sont ré-embeddés ; les obsolètes sont purgés.
- [ ] Suppression d'une source → chunks supprimés **et** blob supprimé (vérifier dans le dashboard Vercel Blob).
- [ ] Notion : connexion OAuth, sélection de 3 pages, ingestion OK ; le token est chiffré en base (illisible).
- [ ] Limites : 6e source en Free refusée avec message traduit ; Notion refusé en Free.
- [ ] Requête non signée sur `/api/workflows/ingest` → 401.
- [ ] Un utilisateur d'une autre organisation ne peut ni lire ni modifier les sources (403/404).
- [ ] `SELECT count(*) FROM "Chunk" WHERE embedding IS NULL` → 0.
- [ ] Lint, typecheck, build OK ; aucune Material Symbol ; tout le texte traduit EN/FR.

## 5. Fin de phase
1. Coche les 15 tâches « Phase 3 (P2) » dans `PROGRESS.md`, recalcule le tableau d'avancement.
2. `DECISIONS.md` : écarts éventuels (taille de lot embeddings, taskType, CLI).
3. Commit `chore: complete phase 2 (data & ingestion)`.
