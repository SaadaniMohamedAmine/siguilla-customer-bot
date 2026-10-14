import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/ui/status-pill";
import { AgentNav } from "@/components/agents/agent-nav";

export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  return (
    <div>
      <p className="text-small text-text-muted mb-2">
        <Link href="/agents" className="hover:text-text">
          Agents
        </Link>{" "}
        / {chatbot.name}
      </p>
      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-h1 text-text font-serif">{chatbot.name}</h1>
        <StatusPill tone={chatbot.status === "live" ? "success" : "neutral"}>
          {chatbot.status === "live" ? "Live" : "Draft"}
        </StatusPill>
      </div>
      <AgentNav agentId={chatbot.id} />
      {children}
    </div>
  );
}
