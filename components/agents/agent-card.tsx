"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
import { KebabIcon, CopyIcon, DeleteIcon, SettingsIcon, WarningIcon } from "@/lib/icons";
import { useNow, formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";
import { responseError } from "@/lib/api";
import { useApiError } from "@/lib/use-api-error";

export type AgentCardAgent = { id: string; name: string; description: string | null; status: string; publicKey: string; paused?: boolean };
export type AgentCardMetrics = {
  sources: number;
  conversations: number;
  satisfaction: number | null;
  lastSynced: Date | null;
};
export type AgentCardHealth = { processing: number; failed: number; unanswered: number };

export function AgentCard({
  agent,
  metrics,
  health,
}: {
  agent: AgentCardAgent;
  metrics: AgentCardMetrics;
  health: AgentCardHealth;
}) {
  const t = useTranslations("Agents");
  const errMsg = useApiError();
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
      toast.error(t("genericError"));
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${agent.id}`, { method: "DELETE" });
      if (!res.ok) throw await responseError(res);
      setDeleteOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(errMsg(e, t("genericError")));
    } finally {
      setDeleting(false);
    }
  }

  const stats = [
    { label: t("sources"), value: String(metrics.sources) },
    { label: t("conversations30d"), value: String(metrics.conversations) },
    { label: t("satisfaction30d"), value: metrics.satisfaction != null ? `${Math.round(metrics.satisfaction * 100)}%` : "—" },
    { label: t("lastSync"), value: lastSyncLabel },
  ];
  const chips: { key: string; text: string; tone: "warning" | "error" }[] = [];
  if (health.failed > 0) chips.push({ key: "f", text: t("health.failed", { count: health.failed }), tone: "error" });
  if (health.processing > 0) chips.push({ key: "p", text: t("health.processing", { count: health.processing }), tone: "warning" });
  if (health.unanswered > 0) chips.push({ key: "u", text: t("health.unanswered", { count: health.unanswered }), tone: "warning" });

  return (
    <>
      <div
        className="anim-keep group border-border bg-surface hover:border-accent relative flex h-full flex-col overflow-hidden rounded-lg border transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
      >
        <span
          aria-hidden
          className="anim-keep pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
          }}
        />
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="text-text-muted hover:bg-surface-raised hover:text-text rounded-sm p-1 outline-none"
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
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}/settings`}>
                  <Icon icon={SettingsIcon} size={14} />
                  {t("menu.settings")}
                </Link>
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

        <Link href={`/agents/${agent.id}`} className="relative flex flex-1 flex-col p-5">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden
              className="bg-accent text-on-accent flex size-11 shrink-0 items-center justify-center rounded-md font-serif text-[22px]"
            >
              {agent.name.trim().slice(0, 1).toUpperCase() || "S"}
            </span>
            <div className="min-w-0">
              <h2 className="text-h3 text-text truncate font-serif">{agent.name}</h2>
              {agent.paused ? (
                <StatusPill tone="warning" className="mt-1">
                  {t("paused")}
                </StatusPill>
              ) : (
                <StatusPill tone={agent.status === "live" ? "success" : "neutral"} className="mt-1">
                  {agent.status === "live" ? t("live") : t("draft")}
                </StatusPill>
              )}
            </div>
          </div>

          <p className={cn("text-body mt-4 line-clamp-2 min-h-[2.75rem]", agent.description ? "text-text-muted" : "text-text-muted italic")}>
            {agent.description || t("noDescription")}
          </p>

          <dl className="border-border mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="text-small text-text-muted truncate">{s.label}</dt>
                <dd className="text-text mt-0.5 truncate font-serif text-[22px] leading-none">{s.value}</dd>
              </div>
            ))}
          </dl>

          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c.key}
                  className={cn(
                    "text-small inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
                    c.tone === "error" ? "border-error/40 bg-error/10 text-error" : "border-warning/40 bg-warning/10 text-warning",
                  )}
                >
                  <Icon icon={WarningIcon} size={12} />
                  {c.text}
                </span>
              ))}
            </div>
          ) : null}
        </Link>
      </div>

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
