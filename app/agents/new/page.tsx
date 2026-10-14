import { requireOrgPage } from "@/lib/session";
import { AgentWizard } from "@/components/agents/agent-wizard";

export default async function NewAgentPage({ searchParams }: PageProps<"/agents/new">) {
  const { org } = await requireOrgPage();
  const { step, id } = await searchParams;
  const stepNum = Number(step) === 2 || Number(step) === 3 ? Number(step) : 1;
  return (
    <AgentWizard
      step={stepNum}
      id={typeof id === "string" ? id : undefined}
      plan={org.plan}
      maxPdfMb={Number(process.env.MAX_PDF_MB ?? 10)}
    />
  );
}
