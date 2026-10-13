"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "@/components/ui/toast";
import { getPlanLimits } from "@/lib/billing/plans";
import {
  PdfIcon,
  GlobeIcon,
  NotionIcon,
  RefreshIcon,
  DeleteIcon,
  AddIcon,
  SearchIcon,
  CheckIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

type SourceStatus = "queued" | "processing" | "ready" | "failed";
type DataSource = {
  id: string;
  type: "pdf" | "url" | "notion";
  name: string;
  url: string | null;
  status: SourceStatus;
  progress: { done?: number; total?: number; phase?: string };
  pagesCount: number;
  chunksCount: number;
  lastSyncedAt: string | null;
  error: string | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "request_failed");
  return json.data as T;
}

export function SourcesManager({ chatbotId, plan, maxPdfMb }: { chatbotId: string; plan: string; maxPdfMb: number }) {
  const t = useTranslations("Sources");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const limits = getPlanLimits(plan);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DataSource | null>(null);

  const { data: sources } = useQuery({
    queryKey: ["sources", chatbotId],
    queryFn: () => api<DataSource[]>(`/api/chatbots/${chatbotId}/sources`),
    refetchInterval: (query) =>
      (query.state.data ?? []).some((s) => s.status === "queued" || s.status === "processing") ? 3000 : false,
  });

  const resync = useMutation({
    mutationFn: (id: string) => api(`/api/sources/${id}/resync`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources", chatbotId] }),
  });

  const tErrors = useTranslations("Errors");
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources", chatbotId] });
      setDeleteTarget(null);
    },
    onError: () => toast.error(tErrors("genericTitle")),
  });

  const rtf = React.useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  function relativeTime(iso: string | null) {
    if (!iso) return t("neverSynced");
    const diffMs = new Date(iso).getTime() - now;
    const diffMin = Math.round(diffMs / 60000);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
    const diffH = Math.round(diffMin / 60);
    if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
    return rtf.format(Math.round(diffH / 24), "day");
  }

  function statusLabel(s: DataSource) {
    if (s.status === "ready") return t("status.ready");
    if (s.status === "queued") return t("status.queued");
    if (s.status === "failed") return t("status.failed");
    const phase = s.progress?.phase ?? "crawling";
    const done = s.progress?.done ?? 0;
    const total = s.progress?.total ?? 0;
    if (phase === "embedding") return t("status.embedding", { done, total });
    if (phase === "reading") return t("status.reading", { done, total });
    return t("status.crawling", { done, total });
  }

  const typeIcon = { pdf: PdfIcon, url: GlobeIcon, notion: NotionIcon } as const;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-h2 text-text">{t("title")}</h2>
        <Button onClick={() => setDrawerOpen(true)}>
          <Icon icon={AddIcon} size={16} />
          {t("addSource")}
        </Button>
      </div>

      {sources && sources.length === 0 ? (
        <EmptyState icon={GlobeIcon} title={t("empty")} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-body">
            <thead>
              <tr className="border-b border-border text-small text-text-muted">
                <th className="px-4 py-3 font-normal">{t("columns.name")}</th>
                <th className="px-4 py-3 font-normal">{t("columns.status")}</th>
                <th className="px-4 py-3 font-normal">{t("columns.counts")}</th>
                <th className="px-4 py-3 font-normal">{t("columns.synced")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(sources ?? []).map((s) => (
                <tr key={s.id} className="relative border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon icon={typeIcon[s.type]} size={16} className="shrink-0 text-text-muted" />
                      <div>
                        <p className="text-text">{s.name}</p>
                        {s.error ? (
                          <p className="text-small text-error">{t(`errors.${s.error}` as never) ?? s.error}</p>
                        ) : null}
                      </div>
                    </div>
                    {s.status === "processing" && s.progress?.total ? (
                      <div className="mt-2 h-0.5 w-full max-w-xs bg-surface-raised">
                        <div
                          className="h-0.5 bg-accent"
                          style={{ width: `${Math.min(100, ((s.progress.done ?? 0) / s.progress.total) * 100)}%` }}
                        />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        s.status === "ready"
                          ? "success"
                          : s.status === "failed"
                            ? "error"
                            : s.status === "processing"
                              ? "accent"
                              : "neutral"
                      }
                    >
                      {statusLabel(s)}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 font-mono text-small text-text-muted">
                    {s.pagesCount} / {s.chunksCount}
                  </td>
                  <td className="px-4 py-3 text-small text-text-muted">{relativeTime(s.lastSyncedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={s.status === "failed" ? t("retry") : t("resync")}
                        onClick={() => resync.mutate(s.id)}
                        disabled={resync.isPending || s.status === "processing" || s.status === "queued"}
                      >
                        <Icon icon={RefreshIcon} size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => setDeleteTarget(s)}>
                        <Icon icon={DeleteIcon} size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddSourceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        chatbotId={chatbotId}
        maxPagesPerSite={limits.pagesPerSite}
        maxPdfMb={maxPdfMb}
        notionAllowed={limits.notion}
        onAdded={() => queryClient.invalidateQueries({ queryKey: ["sources", chatbotId] })}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("deleteConfirmBody")}</DialogDescription>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddSourceDrawer({
  open,
  onOpenChange,
  chatbotId,
  maxPagesPerSite,
  maxPdfMb,
  notionAllowed,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: string;
  maxPagesPerSite: number;
  maxPdfMb: number;
  notionAllowed: boolean;
  onAdded: () => void;
}) {
  const t = useTranslations("Sources");

  const [uploading, setUploading] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [urlLoading, setUrlLoading] = React.useState(false);

  const notionQuery = useQuery({
    queryKey: ["notion-pages", chatbotId],
    queryFn: () => api<{ id: string; title: string; url: string }[]>(`/api/notion/pages`),
    enabled: open && notionAllowed,
    retry: false,
  });
  const notionConnected = notionQuery.isSuccess;
  const [notionQ, setNotionQ] = React.useState("");
  const [selectedPages, setSelectedPages] = React.useState<Set<string>>(new Set());

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: `/api/chatbots/${chatbotId}/sources/upload`,
        });
        await api(`/api/chatbots/${chatbotId}/sources`, {
          method: "POST",
          body: JSON.stringify({ type: "pdf", name: file.name, blobUrl: blob.url, blobPathname: blob.pathname }),
        });
      }
      onAdded();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "upload_failed");
    } finally {
      setUploading(false);
    }
  }

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    setUrlError(null);
    setUrlLoading(true);
    try {
      await api(`/api/chatbots/${chatbotId}/sources`, { method: "POST", body: JSON.stringify({ type: "url", url }) });
      setUrl("");
      onAdded();
      onOpenChange(false);
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : "invalid_url");
    } finally {
      setUrlLoading(false);
    }
  }

  async function addNotionPages() {
    await api(`/api/chatbots/${chatbotId}/sources`, {
      method: "POST",
      body: JSON.stringify({ type: "notion", pageIds: [...selectedPages] }),
    });
    setSelectedPages(new Set());
    onAdded();
    onOpenChange(false);
  }

  const filteredPages = (notionQuery.data ?? []).filter((p) => p.title.toLowerCase().includes(notionQ.toLowerCase()));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="mb-6">{t("drawerTitle")}</DrawerTitle>

        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* PDF */}
          <div className="rounded-md border border-border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon icon={PdfIcon} size={18} />
              <h3 className="font-serif text-h3 text-text">{t("pdfTitle")}</h3>
            </div>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border p-6 text-center hover:border-focus",
              )}
            >
              <p className="text-small text-text-muted">{t("pdfBody")}</p>
              <input
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            <p className="mt-2 text-small text-text-muted">{t("pdfHint", { max: maxPdfMb })}</p>
          </div>

          {/* URL */}
          <div className="rounded-md border border-border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon icon={GlobeIcon} size={18} />
              <h3 className="font-serif text-h3 text-text">{t("urlTitle")}</h3>
            </div>
            <form onSubmit={submitUrl} className="flex gap-2">
              <Input
                placeholder={t("urlPlaceholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={urlError ? (t(`errors.${urlError}` as never) ?? urlError) : undefined}
                className="flex-1"
              />
              <Button type="submit" loading={urlLoading} disabled={!url}>
                {t("addSource")}
              </Button>
            </form>
            <p className="mt-2 text-small text-text-muted">{t("urlHint", { max: maxPagesPerSite })}</p>
          </div>

          {/* Notion */}
          <div className="rounded-md border border-border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon icon={NotionIcon} size={18} />
              <h3 className="font-serif text-h3 text-text">{t("notionTitle")}</h3>
            </div>
            {!notionAllowed ? (
              <Button variant="ghost" disabled className="w-full">
                {t("notionConnect")} · {t("notionProOnly")}
              </Button>
            ) : !notionConnected ? (
              <Button variant="ghost" asChild className="w-full">
                <a href="/api/notion/connect">{t("notionConnect")}</a>
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Icon icon={SearchIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    className="pl-9"
                    placeholder={t("notionSearch")}
                    value={notionQ}
                    onChange={(e) => setNotionQ(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-sm border border-border">
                  {filteredPages.map((p) => {
                    const checked = selectedPages.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setSelectedPages((prev) => {
                            const next = new Set(prev);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            return next;
                          })
                        }
                        className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-tint"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border",
                            checked && "border-accent bg-accent",
                          )}
                        >
                          {checked ? <Icon icon={CheckIcon} size={12} className="text-on-accent" /> : null}
                        </span>
                        <span className="truncate text-small text-text">{p.title}</span>
                      </button>
                    );
                  })}
                </div>
                <Button disabled={selectedPages.size === 0} onClick={addNotionPages}>
                  {t("notionAdd", { count: selectedPages.size })}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
