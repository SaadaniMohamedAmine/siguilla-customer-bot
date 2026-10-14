import { notFound } from "next/navigation";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing/plans";
import { WidgetDesigner } from "@/components/widget/widget-designer";

export default async function AgentWidgetPage({ params }: PageProps<"/agents/[id]/widget">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  return (
    <WidgetDesigner
      chatbot={{
        id: chatbot.id,
        publicKey: chatbot.publicKey,
        allowedDomains: chatbot.allowedDomains,
        widgetConfig: chatbot.widgetConfig,
      }}
      canRemoveBadge={getPlanLimits(org.plan).removeBadge}
    />
  );
}
