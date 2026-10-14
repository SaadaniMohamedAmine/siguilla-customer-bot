import { prisma } from "@/lib/db";

export async function requestHandoff(
  conversationId: string,
  trigger: "visitor" | "auto",
  email?: string | null,
) {
  const conv = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "handoff_requested", visitorEmail: email ?? undefined, lastMessageAt: new Date() },
  });
  await prisma.message.create({ data: { conversationId, role: "system", content: "handoff_requested" } });
  await prisma.analyticsEvent.create({
    data: { chatbotId: conv.chatbotId, type: "handoff", metadata: { trigger } },
  });
  return conv;
}

export async function takeOver(conversationId: string, agentName: string) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { status: "human", agentName } });
  await prisma.message.create({
    data: { conversationId, role: "system", content: `agent_joined:${agentName}` },
  });
}

export async function agentReply(conversationId: string, agentName: string, content: string) {
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "human", agentName, lastMessageAt: new Date() },
    }),
    prisma.message.create({ data: { conversationId, role: "agent", content } }),
  ]);
}

export async function resolve(conversationId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "resolved", fallbackStreak: 0 },
  });
  await prisma.message.create({ data: { conversationId, role: "system", content: "resolved" } });
}
