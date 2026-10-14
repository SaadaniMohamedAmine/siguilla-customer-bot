import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AgentSettingsForm } from "@/components/agents/agent-settings-form";

export default async function AgentSettingsPage({ params }: PageProps<"/agents/[id]/settings">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  return (
    <AgentSettingsForm
      chatbot={{
        id: chatbot.id,
        name: chatbot.name,
        description: chatbot.description,
        instructions: chatbot.instructions,
        similarityThreshold: chatbot.similarityThreshold,
        allowedDomains: chatbot.allowedDomains,
        status: chatbot.status,
      }}
    />
  );
}
