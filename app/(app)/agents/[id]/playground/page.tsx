import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PlaygroundClient } from "@/components/playground/playground-client";

export default async function PlaygroundPage({ params }: PageProps<"/agents/[id]/playground">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  return <PlaygroundClient chatbotId={chatbot.id} defaultThreshold={chatbot.similarityThreshold} />;
}
