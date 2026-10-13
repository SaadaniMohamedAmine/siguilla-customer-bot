import { notFound } from "next/navigation";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/ui/status-pill";

export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <h1 className="font-serif text-h1 text-text">{chatbot.name}</h1>
        <StatusPill tone={chatbot.status === "live" ? "success" : "neutral"}>
          {chatbot.status === "live" ? "Live" : "Draft"}
        </StatusPill>
      </div>
      {children}
    </div>
  );
}
