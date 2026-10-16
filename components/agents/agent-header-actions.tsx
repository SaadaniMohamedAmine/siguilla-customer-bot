"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { CopyIcon, ConversationIcon } from "@/lib/icons";

/** Actions rapides de l'en-tête d'un agent : ouvrir le Playground, copier le code d'intégration. */
export function AgentHeaderActions({ agentId, publicKey }: { agentId: string; publicKey: string }) {
  const t = useTranslations("Agents");
  const tc = useTranslations("Common");

  async function copyEmbed() {
    const snippet = `<script src="${window.location.origin}/widget/v1.js" data-bot="${publicKey}" async></script>`;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success(tc("copied"));
    } catch {
      toast.error(t("genericError"));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={copyEmbed}>
        <Icon icon={CopyIcon} size={15} />
        {t("menu.copyEmbed")}
      </Button>
      <Link href={`/agents/${agentId}/playground`}>
        <Button>
          <Icon icon={ConversationIcon} size={15} />
          {t("menu.playground")}
        </Button>
      </Link>
    </div>
  );
}
