import { prisma } from "@/lib/db";

type Scope = { organizationId: string; chatbotId?: string | null };
const PLAYGROUND = "playground:";

function botFilter(scope: Scope) {
  return { organizationId: scope.organizationId, ...(scope.chatbotId ? { id: scope.chatbotId } : {}) };
}

export async function getKpis(scope: Scope, days: number) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);
  const bot = { chatbot: botFilter(scope) };

  async function period(from: Date, to: Date) {
    const convWhere = {
      ...bot,
      createdAt: { gte: from, lt: to },
      visitorId: { not: { startsWith: PLAYGROUND } },
    };
    const [conversations, handoffConvCount, up, down, botMsgs, fallbackMsgs] = await Promise.all([
      prisma.conversation.count({ where: convWhere }),
      prisma.conversation.count({
        where: { ...convWhere, messages: { some: { role: "system", content: "handoff_requested" } } },
      }),
      prisma.message.count({ where: { feedback: "up", conversation: convWhere } }),
      prisma.message.count({ where: { feedback: "down", conversation: convWhere } }),
      prisma.message.count({ where: { role: "bot", conversation: convWhere } }),
      prisma.message.count({ where: { role: "bot", fallback: true, conversation: convWhere } }),
    ]);
    return {
      conversations,
      resolvedWithoutHuman: conversations > 0 ? (conversations - handoffConvCount) / conversations : null,
      satisfaction: up + down > 0 ? up / (up + down) : null,
      fallbackRate: botMsgs > 0 ? fallbackMsgs / botMsgs : null,
    };
  }

  const [cur, prev] = await Promise.all([period(since, now), period(prevSince, since)]);
  const delta = (a: number | null, b: number | null) => (a != null && b != null ? a - b : null);
  return {
    conversations: cur.conversations,
    conversationsDelta: cur.conversations - prev.conversations,
    resolvedWithoutHuman: cur.resolvedWithoutHuman,
    resolvedWithoutHumanDelta: delta(cur.resolvedWithoutHuman, prev.resolvedWithoutHuman),
    satisfaction: cur.satisfaction,
    satisfactionDelta: delta(cur.satisfaction, prev.satisfaction),
    fallbackRate: cur.fallbackRate,
    fallbackRateDelta: delta(cur.fallbackRate, prev.fallbackRate),
  };
}

export async function getConversationsPerDay(scope: Scope, days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const botIds = scope.chatbotId
    ? [scope.chatbotId]
    : (
        await prisma.chatbot.findMany({
          where: { organizationId: scope.organizationId },
          select: { id: true },
        })
      ).map((b) => b.id);
  if (botIds.length === 0) return [];
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt") AS day, count(*)::bigint AS count
    FROM "Conversation"
    WHERE "chatbotId" = ANY(${botIds}) AND "createdAt" >= ${since} AND "visitorId" NOT LIKE ${PLAYGROUND + "%"}
    GROUP BY day ORDER BY day ASC`;
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ date: d, count: byDay.get(d) ?? 0 });
  }
  return out;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getTopQuestions(scope: Scope, days: number, limit = 8) {
  const since = new Date(Date.now() - days * 86_400_000);
  const messages = await prisma.message.findMany({
    where: {
      role: "visitor",
      createdAt: { gte: since },
      conversation: { chatbot: botFilter(scope), visitorId: { not: { startsWith: PLAYGROUND } } },
    },
    select: { content: true },
    take: 5000,
  });
  const counts = new Map<string, { label: string; count: number }>();
  for (const m of messages) {
    const key = normalize(m.content);
    if (!key) continue;
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { label: m.content, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function getUnansweredQuestions(scope: Scope, days: number, limit = 8) {
  const since = new Date(Date.now() - days * 86_400_000);
  const events = await prisma.analyticsEvent.findMany({
    where: { type: "fallback", createdAt: { gte: since }, chatbot: botFilter(scope) },
    select: { metadata: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });
  const byKey = new Map<string, { label: string; count: number; firstSeen: Date }>();
  for (const e of events) {
    const question = (e.metadata as { question?: string } | null)?.question;
    if (!question) continue;
    const key = normalize(question);
    if (!key) continue;
    const entry = byKey.get(key);
    if (entry) entry.count++;
    else byKey.set(key, { label: question, count: 1, firstSeen: e.createdAt });
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function getMostCitedSources(scope: Scope, days: number, limit = 6) {
  const since = new Date(Date.now() - days * 86_400_000);
  const botIds = scope.chatbotId
    ? [scope.chatbotId]
    : (
        await prisma.chatbot.findMany({
          where: { organizationId: scope.organizationId },
          select: { id: true },
        })
      ).map((b) => b.id);
  if (botIds.length === 0) return [];
  const rows = await prisma.$queryRaw<{ title: string; count: bigint }[]>`
    SELECT (c->>'title') AS title, count(*)::bigint AS count
    FROM "Message" m
    JOIN "Conversation" conv ON conv.id = m."conversationId"
    CROSS JOIN LATERAL jsonb_array_elements(m.citations) AS c
    WHERE conv."chatbotId" = ANY(${botIds}) AND m."createdAt" >= ${since} AND conv."visitorId" NOT LIKE ${PLAYGROUND + "%"}
    GROUP BY title ORDER BY count DESC LIMIT ${limit}`;
  const total = rows.reduce((s, r) => s + Number(r.count), 0);
  return rows.map((r) => ({
    title: r.title,
    count: Number(r.count),
    share: total > 0 ? Number(r.count) / total : 0,
  }));
}
