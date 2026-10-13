import { requireOrgPage } from "@/lib/session";
import { SourcesManager } from "@/components/sources/sources-manager";

export default async function SourcesPage({ params }: PageProps<"/agents/[id]/sources">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  return <SourcesManager chatbotId={id} plan={org.plan} maxPdfMb={Number(process.env.MAX_PDF_MB ?? 10)} />;
}
