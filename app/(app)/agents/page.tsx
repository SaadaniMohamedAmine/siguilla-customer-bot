import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireOrgPage } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog";
import { AgentIcon, AddIcon } from "@/lib/icons";
import { Icon } from "@/components/ui/icon";

export default async function AgentsPage() {
  const t = await getTranslations("Empty");
  const { org } = await requireOrgPage();
  const agents = await prisma.chatbot.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-h1 text-text">Agents</h1>
        {agents.length > 0 ? (
          <CreateAgentDialog
            trigger={
              <Button>
                <Icon icon={AddIcon} size={16} />
                {t("agentsCta")}
              </Button>
            }
          />
        ) : null}
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={AgentIcon}
          title={t("agentsTitle")}
          description={t("agentsBody")}
          action={<CreateAgentDialog trigger={<Button>{t("agentsCta")}</Button>} />}
          className="mt-10"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}/sources`}>
              <Card className="h-full transition-colors hover:border-focus">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>{agent.name}</CardTitle>
                  <StatusPill tone={agent.status === "live" ? "success" : "neutral"}>
                    {agent.status === "live" ? "Live" : "Draft"}
                  </StatusPill>
                </CardHeader>
                <CardContent>{agent.description || "—"}</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
