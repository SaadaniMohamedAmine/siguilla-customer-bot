import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireOrgPage } from "@/lib/session";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/ui/status-pill";
import { Icon } from "@/components/ui/icon";
import { ChevronRightIcon } from "@/lib/icons";
import { AgentNav } from "@/components/agents/agent-nav";
import { AgentHeaderActions } from "@/components/agents/agent-header-actions";

export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;
  const { org } = await requireOrgPage();
  const t = await getTranslations("Agents");
  const tn = await getTranslations("Nav");
  const chatbot = await prisma.chatbot.findFirst({ where: { id, organizationId: org.id } });
  if (!chatbot) notFound();

  return (
    <div>
      <nav aria-label={tn("breadcrumb")} className="text-small text-text-muted mb-4 flex items-center gap-1.5">
        <Link href="/agents" className="hover:text-text transition-colors">
          {tn("agents")}
        </Link>
        <Icon icon={ChevronRightIcon} size={13} />
        <span className="text-text">{chatbot.name}</span>
      </nav>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="bg-accent text-on-accent flex size-14 shrink-0 items-center justify-center rounded-lg font-serif text-[28px]"
          >
            {chatbot.name.trim().slice(0, 1).toUpperCase() || "S"}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-h1 text-text truncate font-serif">{chatbot.name}</h1>
              <StatusPill tone={chatbot.status === "live" ? "success" : "neutral"}>
                {chatbot.status === "live" ? t("live") : t("draft")}
              </StatusPill>
            </div>
            <p className="text-body text-text-muted mt-1 max-w-xl truncate">
              {chatbot.description || t("noDescription")}
            </p>
          </div>
        </div>
        <AgentHeaderActions agentId={chatbot.id} publicKey={chatbot.publicKey} />
      </div>
      <AgentNav agentId={chatbot.id} />
      {children}
    </div>
  );
}
