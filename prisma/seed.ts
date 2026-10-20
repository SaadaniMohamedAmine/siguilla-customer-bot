// prisma/seed.ts
//
// 1. Dev-only test accounts (test1@..test3@), created only when TEST_USERS_PASSWORD is set.
// 2. "Maison Démo" — read-only demo org with 2 live agents, real embedded
//    sources, and 90 days of realistic conversation history.
// 3. "Sigilla HQ" — demo org hosting "Sigilla Concierge", the agent embedded
//    on the marketing site itself, trained on content/docs/*.md.
//
// Idempotent: re-running skips what already exists for (1), and fully wipes +
// recreates everything marked `isDemo` for (2)/(3) so the data always matches
// the current content files. Run once locally against prod after deploying
// (DATABASE_URL from prod in .env.local temporarily).
import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });

// Le mot de passe n'est jamais écrit dans le dépôt : il vient de TEST_USERS_PASSWORD (voir .env.example).
// Absent (ou trop court), le seed ne crée pas ces comptes — important quand il tourne contre la prod.
const TEST_USERS = [
  { name: "Test One", email: "test1@sigilla.app" },
  { name: "Test Two", email: "test2@sigilla.app" },
  { name: "Test Three", email: "test3@sigilla.app" },
];

// Mulberry32 — PRNG déterministe (seed fixe), pour une démo reproductible.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));

const ATELIER_QUESTIONS = [
  "Do your candles ship to Switzerland?",
  "How long does a full-size candle burn?",
  "Are your candles vegan?",
  "Can I reuse the jar?",
  "What's your return policy?",
  "Do you accept Klarna?",
  "How much is shipping to the UK?",
  "Can I return a candle I've already lit?",
  "What scents do you have?",
  "How do I trim the wick?",
  "Do you ship to the United States?",
  "What's the price of Cuir & Encens Noir?",
  "Can I get a custom engraving on the jar?",
  "Do you do bespoke orders for weddings?",
  "How long does a bespoke order take?",
  "Is shipping free?",
  "What's your exchange policy?",
  "How should I store my candles?",
  "Are your fragrance oils phthalate-free?",
  "Do you offer wholesale pricing?",
  "Can I track my order?",
  "What happens if my order arrives damaged?",
  "Do you restock sold-out scents?",
  "What's in the Figuier Sauvage scent?",
  "How do I clean wax off the jar?",
  "Do you have a travel size?",
  "What's the minimum for a bespoke order?",
  "Do you offer gift wrapping?",
  "Can I pay in installments?",
  "How long before a wedding should I order?",
  "Do you ship to Canada?",
  "What's your busiest shipping season?",
  "Can I cancel an order after placing it?",
  "Do you have a loyalty program?",
  "What's the burn time of Ambre Doré?",
  "Is there duty to pay on EU orders?",
  "Can I buy candles in bulk?",
  "Do your candles contain soy?",
  "What if I'm not home for delivery?",
  "Can I visit your Paris atelier?",
  "Do you offer a satisfaction guarantee?",
];
const LEDGERLINE_QUESTIONS = [
  "How do I connect my bank account?",
  "Can I set up recurring invoices?",
  "How does VAT reverse charge work?",
  "What happens when I downgrade my plan?",
  "Is my banking password stored?",
  "Can I export my data?",
  "How do I add a teammate?",
  "What roles are available for team members?",
  "Does bank sync update automatically?",
  "Can I integrate with Shopify?",
  "How do I issue a credit note?",
  "What's included in the Starter plan?",
  "Can I send an invoice in a foreign currency?",
  "How do reminders for overdue invoices work?",
  "Is there two-factor authentication?",
  "How is my subscription billed?",
  "Can I cancel anytime?",
  "What happens to my data after I cancel?",
  "How do I categorize a bank transaction?",
  "Can I set custom VAT rates?",
  "Is there an API?",
  "How many invoices can I send on the Growth plan?",
  "Can I remove a teammate's access?",
  "How often does the bank sync refresh?",
  "Do you support multi-currency invoicing?",
  "How do I generate a VAT report?",
  "Can I prorate a plan change?",
  "Is my data encrypted?",
  "How do I connect more than one bank account?",
  "What if a payment is partially matched?",
  "Can clients pay directly from the invoice?",
  "Does Ledgerline integrate with payroll?",
  "How do I change my VAT rate?",
  "Can I white-label invoices with my logo?",
  "What happens to recurring invoices if I pause a client?",
  "Is there a mobile app?",
  "How long is data kept after cancellation?",
  "Can I restrict a teammate to read-only access?",
  "Do you support SEPA transfers?",
  "What's the difference between Growth and Scale?",
];

const PROVIDERS: ("groq" | "gemini")[] = Array(97).fill("groq").concat(Array(3).fill("gemini"));

function daysAgo(n: number, hour: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, int(0, 59), 0, 0);
  return d;
}

function readMarkdown(dir: string, slug: string) {
  return fs.readFileSync(path.join(process.cwd(), dir, `${slug}.md`), "utf8");
}
function titleOf(md: string) {
  return /^#\s+(.+)$/m.exec(md)?.[1] ?? "Untitled";
}

async function main() {
  const { auth } = await import("@/lib/auth");
  const { prisma } = await import("@/lib/db");
  const { chunkSections } = await import("@/lib/ingestion/chunk");
  const { storeChunks } = await import("@/lib/ingestion/store");

  try {
    // --- 1. Comptes de test (dev) ---
    const testPassword = process.env.TEST_USERS_PASSWORD;
    if (!testPassword || testPassword.length < 8) {
      console.log("[seed] TEST_USERS_PASSWORD missing or shorter than 8 characters: test accounts skipped");
    } else {
      for (const u of TEST_USERS) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) {
          console.log(`[seed] ${u.email} already exists, skipping`);
          continue;
        }
        await auth.api.signUpEmail({ body: { name: u.name, email: u.email, password: testPassword } });
        console.log(`[seed] created ${u.email}`);
      }
    }

    // --- 2. Nettoyage des données démo précédentes ---
    await prisma.organization.deleteMany({ where: { isDemo: true } });

    const demoEmail = process.env.DEMO_USER_EMAIL!;
    const demoPassword = process.env.DEMO_USER_PASSWORD!;
    const demoSlug = process.env.DEMO_ORG_SLUG || "maison-demo";

    let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!demoUser) {
      await auth.api.signUpEmail({
        body: { name: "Camille Laurent", email: demoEmail, password: demoPassword },
      });
      demoUser = await prisma.user.findUniqueOrThrow({ where: { email: demoEmail } });
    }
    // L'inscription crée une org personnelle — on la retire, "Maison Démo" la remplace.
    await prisma.organization.deleteMany({ where: { members: { some: { userId: demoUser.id } } } });

    async function fakeUser(name: string, email: string) {
      let u = await prisma.user.findUnique({ where: { email } });
      if (!u)
        u = await prisma.user.create({
          data: { id: crypto.randomUUID(), name, email, emailVerified: true, createdAt: new Date() },
        });
      return u;
    }
    const hugo = await fakeUser("Hugo Martin", "hugo.martin@maison-demo.sigilla.app");
    const ines = await fakeUser("Inès Belkacem", "ines.belkacem@maison-demo.sigilla.app");

    const maisonDemo = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name: "Maison Démo",
        slug: demoSlug,
        createdAt: new Date(),
        plan: "pro",
        isDemo: true,
      },
    });
    await prisma.member.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          organizationId: maisonDemo.id,
          userId: demoUser.id,
          role: "owner",
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          organizationId: maisonDemo.id,
          userId: hugo.id,
          role: "admin",
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          organizationId: maisonDemo.id,
          userId: ines.id,
          role: "member",
          createdAt: new Date(),
        },
      ],
    });

    const sigillaHQ = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name: "Sigilla HQ",
        slug: `sigilla-hq-${int(1000, 9999)}`,
        createdAt: new Date(),
        plan: "team",
        isDemo: true,
      },
    });

    // --- 3. Agents ---
    const pk = () => `pk_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const concierge = await prisma.chatbot.create({
      data: {
        organizationId: sigillaHQ.id,
        name: "Sigilla Concierge",
        publicKey: pk(),
        status: "live",
        widgetConfig: {
          color: "#9E2F45",
          theme: "dark",
          displayName: "Concierge",
          welcome: "Good evening. Ask me anything about Sigilla.",
          suggestions: ["How do citations work?", "What does the widget weigh?", "Can a human take over?"],
          showBadge: true,
        },
      },
    });
    const atelierBot = await prisma.chatbot.create({
      data: {
        organizationId: maisonDemo.id,
        name: "Atelier Lune — Concierge",
        publicKey: pk(),
        status: "live",
        instructions:
          "Answer as the Atelier Lune concierge. Be warm, concise and precise about shipping, returns and candle care. Never discuss pricing negotiations; offer a human instead.",
        widgetConfig: {
          color: "#9E2F45",
          theme: "light",
          displayName: "Concierge",
          welcome: "Good evening. How may I help you today?",
          suggestions: ["Shipping times", "Return policy", "Scent recommendations"],
          showBadge: true,
        },
      },
    });
    const ledgerlineBot = await prisma.chatbot.create({
      data: {
        organizationId: maisonDemo.id,
        name: "Ledgerline — Help Center",
        publicKey: pk(),
        status: "live",
        widgetConfig: {
          color: "#1F3A5F",
          theme: "light",
          displayName: "Help Center",
          welcome: "Hi. How can I help with Ledgerline?",
          showBadge: true,
        },
      },
    });

    // --- 4. Ingestion réelle (embeddings Gemini) ---
    async function ingestSite(chatbotId: string, dir: string, slugs: string[], urlPrefix: string) {
      for (const slug of slugs) {
        const md = readMarkdown(dir, slug);
        const title = titleOf(md);
        const url = `${process.env.NEXT_PUBLIC_APP_URL}${urlPrefix}/${slug}`;
        const source = await prisma.dataSource.create({
          data: {
            chatbotId,
            type: "url",
            name: title,
            url,
            status: "ready",
            pagesCount: 1,
            lastSyncedAt: new Date(),
          },
        });
        const prepared = await chunkSections([{ text: md, title, url }]);
        await storeChunks(chatbotId, source.id, prepared);
        console.log(`[seed] ingested ${slug} (${prepared.length} chunks)`);
      }
      const rows = await prisma.chunk.findMany({
        where: { chatbotId },
        select: { id: true, sourceTitle: true, sourceUrl: true },
      });
      return rows.map((r) => ({ id: r.id, title: r.sourceTitle, url: r.sourceUrl }));
    }

    const docsSlugs = [
      "getting-started",
      "sources",
      "embed",
      "customize",
      "answers",
      "citations",
      "handoff",
      "analytics",
      "api",
      "plans",
    ];
    await ingestSite(concierge.id, "content/docs", docsSlugs, "/docs");
    const atelierChunks = await ingestSite(
      atelierBot.id,
      "content/demo/atelier-lune",
      ["shipping", "returns", "care-guide", "collections", "bespoke", "faq"],
      "/atelier-lune",
    );
    const ledgerlineChunks = await ingestSite(
      ledgerlineBot.id,
      "content/demo/ledgerline",
      ["getting-started", "invoices", "bank-sync", "vat", "plans-billing", "security"],
      "/ledgerline",
    );

    // --- 5. 90 jours d'historique ---
    async function seedHistory(
      chatbotId: string,
      questions: string[],
      chunks: { id: string; title: string; url: string | null }[],
      total: number,
    ) {
      let created = 0;
      for (let day = 89; day >= 0; day--) {
        const isWeekend = [0, 6].includes(daysAgo(day, 12).getUTCDay());
        const trend = 0.6 + (0.4 * (89 - day)) / 89; // légère tendance croissante
        const perDay = Math.max(1, Math.round((total / 90) * trend * (isWeekend ? 0.6 : 1)));
        for (let i = 0; i < perDay; i++) {
          const isFallback = rand() < 0.15;
          const question = pick(questions);
          const visitorId = `visitor_${crypto.randomUUID().slice(0, 10)}`;
          const createdAt = daysAgo(day, int(8, 21));
          const conv = await prisma.conversation.create({
            data: {
              chatbotId,
              visitorId,
              status: "resolved",
              createdAt,
              lastMessageAt: createdAt,
              country: pick(["FR", "CH", "US", "GB", "DE"]),
            },
          });
          await prisma.message.create({
            data: { conversationId: conv.id, role: "visitor", content: question, createdAt },
          });
          if (isFallback) {
            await prisma.message.create({
              data: {
                conversationId: conv.id,
                role: "bot",
                content: "I don't have a verified answer for that in my sources yet.",
                fallback: true,
                topScore: rand() * 0.3,
                provider: pick(PROVIDERS),
                createdAt,
              },
            });
            await prisma.analyticsEvent.create({
              data: { chatbotId, type: "fallback", metadata: { question }, createdAt },
            });
          } else {
            const cited = [pick(chunks)];
            if (rand() < 0.4) cited.push(pick(chunks));
            const citations = cited.map((c, i) => ({
              index: i + 1,
              chunkId: c.id,
              title: c.title,
              url: c.url,
              pageNumber: null,
              score: 0.76 + rand() * 0.17,
            }));
            const feedback = rand() < 0.25 ? (rand() < 0.94 ? "up" : "down") : null;
            await prisma.message.create({
              data: {
                conversationId: conv.id,
                role: "bot",
                content: `Here's what I found about "${question}".`,
                citations,
                topScore: citations[0].score,
                provider: pick(PROVIDERS),
                feedback,
                createdAt,
              },
            });
          }
          await prisma.analyticsEvent.create({ data: { chatbotId, type: "message", createdAt } });
          // ~1.8 widget_open par conversation en moyenne (1 garanti + 80% de chance d'un 2e, ex. page revisitée).
          await prisma.analyticsEvent.create({ data: { chatbotId, type: "widget_open", createdAt } });
          if (rand() < 0.8)
            await prisma.analyticsEvent.create({ data: { chatbotId, type: "widget_open", createdAt } });
          created++;
        }
      }
      return created;
    }

    const atelierCount = await seedHistory(atelierBot.id, ATELIER_QUESTIONS, atelierChunks, 150);
    const ledgerlineCount = await seedHistory(ledgerlineBot.id, LEDGERLINE_QUESTIONS, ledgerlineChunks, 60);
    console.log(
      `[seed] ${atelierCount} Atelier Lune conversations, ${ledgerlineCount} Ledgerline conversations`,
    );

    // --- 6. Deux conversations de handoff spécifiques (acceptance criteria) ---
    const handoffConv = await prisma.conversation.create({
      data: {
        chatbotId: atelierBot.id,
        visitorId: `visitor_${crypto.randomUUID().slice(0, 10)}`,
        status: "handoff_requested",
        visitorEmail: "e.marchand@example.ch",
        country: "CH",
        fallbackStreak: 2,
        createdAt: daysAgo(0, 0),
        lastMessageAt: new Date(Date.now() - 4 * 60_000),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: handoffConv.id,
        role: "visitor",
        content: "Can I have our initials engraved on the glass jar for 150 candles?",
        createdAt: new Date(Date.now() - 5 * 60_000),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: handoffConv.id,
        role: "bot",
        content: "I don't have a verified answer for that in my sources yet.",
        fallback: true,
        createdAt: new Date(Date.now() - 4.5 * 60_000),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: handoffConv.id,
        role: "system",
        content: "handoff_requested",
        createdAt: new Date(Date.now() - 4 * 60_000),
      },
    });

    const humanConv = await prisma.conversation.create({
      data: {
        chatbotId: ledgerlineBot.id,
        visitorId: `visitor_${crypto.randomUUID().slice(0, 10)}`,
        status: "human",
        agentName: "Camille",
        createdAt: daysAgo(0, 9),
        lastMessageAt: daysAgo(0, 10),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: humanConv.id,
        role: "visitor",
        content: "Can you add a custom VAT exemption for a non-profit client?",
        createdAt: daysAgo(0, 9),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: humanConv.id,
        role: "system",
        content: "agent_joined:Camille",
        createdAt: daysAgo(0, 9),
      },
    });
    await prisma.message.create({
      data: {
        conversationId: humanConv.id,
        role: "agent",
        content: "Hi, this is Camille — yes, I can set that up manually for you, one moment.",
        createdAt: daysAgo(0, 10),
      },
    });

    await prisma.organization.update({
      where: { id: maisonDemo.id },
      data: { messageCount: Math.min(1800, atelierCount + ledgerlineCount) },
    });

    console.log("[seed] done");
    console.log(`[seed] Sigilla Concierge publicKey (NEXT_PUBLIC_LANDING_BOT_KEY): ${concierge.publicKey}`);
    console.log(`[seed] Atelier Lune publicKey: ${atelierBot.publicKey}`);
    console.log(`[seed] Ledgerline publicKey: ${ledgerlineBot.publicKey}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
