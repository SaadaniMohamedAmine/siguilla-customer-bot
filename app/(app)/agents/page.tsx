import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { AgentIcon } from "@/lib/icons";

export default async function AgentsPage() {
  const t = await getTranslations("Empty");
  return (
    <div>
      <h1 className="font-serif text-h1 text-text">Agents</h1>
      <EmptyState
        icon={AgentIcon}
        title={t("agentsTitle")}
        description={t("agentsBody")}
        action={<Button>{t("agentsCta")}</Button>}
        className="mt-10"
      />
    </div>
  );
}
