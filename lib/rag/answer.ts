import { prisma } from "@/lib/db";
import { streamAnswer } from "@/lib/ai/orchestrator";
import { retrieve } from "./retrieve";
import { buildMessages, MAX_QUESTION_CHARS } from "./prompt";
import { extractCitations, sanitizeAnswer } from "./citations";
import { fallbackMessage, FALLBACK_SENTINEL, HANDOFF_AFTER_FALLBACKS } from "./fallback";
import { requestHandoff } from "@/lib/handoff";
import type { StreamEvent, RetrievedChunk } from "./types";

export type AnswerInput = {
  chatbotId: string;
  question: string;
  visitorId: string;
  conversationId?: string | null;
  locale?: string | null;
  pageUrl?: string | null;
  country?: string | null;
  channel: "widget" | "playground" | "api";
  thresholdOverride?: number; // playground uniquement
};

export type AnswerResult = { events: AsyncGenerator<StreamEvent>; retrieved: RetrievedChunk[] };

export async function answer(input: AnswerInput): Promise<AnswerResult> {
  const question = input.question.trim();
  const bot = await prisma.chatbot.findUniqueOrThrow({ where: { id: input.chatbotId } });

  // Conversation : reprise si l'id appartient bien à ce bot et à ce visiteur, sinon création.
  let conversation = input.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: input.conversationId, chatbotId: bot.id, visitorId: input.visitorId },
      })
    : null;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        chatbotId: bot.id,
        visitorId: input.visitorId,
        locale: input.locale,
        pageUrl: input.pageUrl,
        country: input.country,
      },
    });
  } else if (conversation.status === "resolved") {
    // Un nouveau message d'un visiteur relance le bot.
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "bot" },
    });
  }

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id, role: { in: ["visitor", "bot", "agent"] } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { role: true, content: true },
  });

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "visitor", content: question },
  });
  if (input.channel !== "playground") {
    await prisma.analyticsEvent.create({
      data: { chatbotId: bot.id, type: "message", metadata: { channel: input.channel } },
    });
  }

  const convId = conversation.id;
  const threshold = input.thresholdOverride ?? bot.similarityThreshold;

  // En mode humain, le bot se tait : le message est seulement enregistré (l'agent humain répond depuis le dashboard).
  if (conversation.status === "human" || conversation.status === "handoff_requested") {
    await prisma.conversation.update({ where: { id: convId }, data: { lastMessageAt: new Date() } });
    async function* humanMode(): AsyncGenerator<StreamEvent> {
      yield { type: "meta", conversationId: convId, fallback: false, topScore: null };
      yield {
        type: "done",
        messageId: "",
        citations: [],
        fallback: false,
        provider: null,
        handoffSuggested: false,
      };
    }
    return { events: humanMode(), retrieved: [] };
  }

  if (question.length === 0 || question.length > MAX_QUESTION_CHARS) {
    async function* tooLong(): AsyncGenerator<StreamEvent> {
      yield { type: "error", code: "too_long" };
    }
    return { events: tooLong(), retrieved: [] };
  }

  const retrieved = await retrieve(bot.id, question);
  const topScore = retrieved[0]?.score ?? null;
  const declined = topScore === null || topScore < threshold;

  async function* run(): AsyncGenerator<StreamEvent> {
    yield { type: "meta", conversationId: convId, fallback: declined, topScore };

    if (declined) {
      yield* finishFallback(topScore);
      return;
    }

    const messages = buildMessages({
      botName: bot.name,
      instructions: bot.instructions,
      chunks: retrieved,
      history: history.reverse() as { role: "visitor" | "bot" | "agent"; content: string }[],
      question,
    });

    let provider: "groq" | "gemini" | null = null;
    let full = "";
    try {
      const res = await streamAnswer(messages, { temperature: 0.1, maxTokens: 600 });
      provider = res.provider;
      // Tampon de 20 caractères : permet de détecter la sentinelle avant d'émettre le moindre token.
      let buffer = "";
      let released = false;
      for await (const piece of res.stream) {
        full += piece;
        if (!released) {
          buffer += piece;
          if (FALLBACK_SENTINEL.startsWith(buffer.trim()) && buffer.trim().length < FALLBACK_SENTINEL.length)
            continue;
          if (buffer.trim().startsWith(FALLBACK_SENTINEL)) break;
          released = true;
          yield { type: "token", value: buffer };
          continue;
        }
        yield { type: "token", value: piece };
      }
      // Réponse très courte terminée sans avoir été libérée (et qui n'est pas la sentinelle) : on l'émet.
      if (
        !released &&
        buffer &&
        !buffer.trim().startsWith(FALLBACK_SENTINEL) &&
        !FALLBACK_SENTINEL.startsWith(buffer.trim())
      ) {
        yield { type: "token", value: buffer };
      }
    } catch (error) {
      console.error("[rag] generation failed", error);
      yield { type: "error", code: "unavailable" };
      return;
    }

    if (full.trim().startsWith(FALLBACK_SENTINEL)) {
      yield* finishFallback(topScore);
      return;
    }

    const clean = sanitizeAnswer(full, retrieved);
    const citations = extractCitations(clean, retrieved);
    const msg = await prisma.message.create({
      data: {
        conversationId: convId,
        role: "bot",
        content: clean,
        citations,
        topScore,
        fallback: false,
        provider,
      },
    });
    await prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date(), fallbackStreak: 0 },
    });
    yield { type: "done", messageId: msg.id, citations, fallback: false, provider, handoffSuggested: false };
  }

  async function* finishFallback(score: number | null): AsyncGenerator<StreamEvent> {
    const text = fallbackMessage(input.locale);
    yield { type: "token", value: text };
    const msg = await prisma.message.create({
      data: { conversationId: convId, role: "bot", content: text, topScore: score, fallback: true },
    });
    const updated = await prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date(), fallbackStreak: { increment: 1 } },
    });
    const handoffSuggested = updated.fallbackStreak >= HANDOFF_AFTER_FALLBACKS;
    if (input.channel !== "playground") {
      await prisma.analyticsEvent.create({
        data: { chatbotId: bot.id, type: "fallback", metadata: { question } },
      });
      if (handoffSuggested) await requestHandoff(convId, "auto");
    }
    yield {
      type: "done",
      messageId: msg.id,
      citations: [],
      fallback: true,
      provider: null,
      handoffSuggested,
    };
  }

  return { events: run(), retrieved };
}
