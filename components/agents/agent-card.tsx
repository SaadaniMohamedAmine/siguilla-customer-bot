"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { KebabIcon, AgentIcon, ConversationIcon, CopyIcon, DeleteIcon } from "@/lib/icons";
import { useNow, formatRelative } from "@/lib/time";

type Agent = { id: string; name: string; description: string | null; status: string; publicKey: string };
type Metrics = {
  sources: number;
  conversations: number;
  satisfaction: number | null;
  lastSynced: Date | null;
};

export function AgentCard({ agent, metrics }: { agent: Agent; metrics: Metrics }) {
  const t = useTranslations("Agents");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const now = useNow();
  const lastSyncLabel = formatRelative(metrics.lastSynced, locale, now) ?? "—";

  async function copyEmbed() {
    const snippet = `<script src="${window.location.origin}/widget/v1.js" data-bot="${agent.publicKey}" async></script>`;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success(tCommon("copied"));
    } catch {
      toast.error(tCommon("copied"));
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${agent.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong on our side.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="hover:border-focus relative h-full transition-colors">
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="text-text-muted hover:bg-surface-raised hover:text-text rounded-sm p-1"
              onClick={(e) => e.preventDefault()}
              aria-label={t("menu.open")}
            >
              <Icon icon={KebabIcon} size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}`}>{t("menu.open")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}/playground`}>{t("menu.playground")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyEmbed}>
                <Icon icon={CopyIcon} size={14} />
                {t("menu.copyEmbed")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-error">
                <Icon icon={DeleteIcon} size={14} />
                {t("menu.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/agents/${agent.id}`} className="block">
          <CardHeader className="flex-row items-center justify-between space-y-0 pr-8">
            <CardTitle as="h2">{agent.name}</CardTitle>
            <StatusPill tone={agent.status === "live" ? "success" : "neutral"}>
              {agent.status === "live" ? "Live" : "Draft"}
            </StatusPill>
          </CardHeader>
          <CardContent>{agent.description || "—"}</CardContent>
          <div className="border-border text-small text-text-muted mt-4 grid grid-cols-2 gap-3 border-t pt-4 font-mono">
            <div>
              <Icon icon={AgentIcon} size={12} className="mr-1 inline" />
              {metrics.sources} {t("sources").toLowerCase()}
            </div>
            <div>
              <Icon icon={ConversationIcon} size={12} className="mr-1 inline" />
              {metrics.conversations}
            </div>
            <div>{metrics.satisfaction != null ? `${Math.round(metrics.satisfaction * 100)}%` : "—"}</div>
            <div>{lastSyncLabel}</div>
          </div>
        </Link>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("deleteConfirmBody", { name: agent.name })}</DialogDescription>
          <Input className="mt-4" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== agent.name}
              loading={deleting}
              onClick={confirmDelete}
            >
              {t("menu.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
