"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
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
  WarningIcon,
  UploadIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useApiError } from "@/lib/use-api-error";

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

const STATUS_DOT: Record<SourceStatus, string> = {
  ready: "bg-success",
  queued: "bg-text-muted",
  processing: "bg-accent",
  failed: "bg-error",
};

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
  const errMsg = useApiError();
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources", chatbotId] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(errMsg(e, tErrors("genericTitle"))),
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
  const list = sources ?? [];
  const totals = {
    sources: list.length,
    pages: list.reduce((a, s) => a + s.pagesCount, 0),
    chunks: list.reduce((a, s) => a + s.chunksCount, 0),
    last: list.reduce<string | null>((max, s) => (s.lastSyncedAt && (!max || s.lastSyncedAt > max) ? s.lastSyncedAt : max), null),
  };

  function host(s: DataSource) {
    if (s.type === "url" && s.url) {
      try {
        return new URL(s.url).hostname;
      } catch {
        return s.url;
      }
    }
    return t(`types.${s.type}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-h2 text-text">{t("title")}</h2>
          <p className="text-body text-text-muted mt-1 max-w-xl">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <Icon icon={AddIcon} size={16} />
          {t("addSource")}
        </Button>
      </div>

      {!sources ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="anim-keep h-20 w-full rounded-lg" />
          <Skeleton className="anim-keep h-20 w-full rounded-lg" />
        </div>
      ) : sources.length === 0 ? (
        <div className="border-border bg-surface rounded-lg border p-10 text-center">
          <span className="border-border bg-bg text-link mx-auto flex size-14 items-center justify-center rounded-full border">
            <Icon icon={GlobeIcon} size={24} />
          </span>
          <h3 className="text-h3 text-text mt-4 font-serif">{t("emptyTitle")}</h3>
          <p className="text-body text-text-muted mx-auto mt-2 max-w-md">{t("empty")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {(["pdf", "url", "notion"] as const).map((k) => (
              <span
                key={k}
                className="border-border text-text-muted text-small inline-flex items-center gap-2 rounded-full border px-3 py-1"
              >
                <Icon icon={typeIcon[k]} size={14} />
                {t(`types.${k}`)}
              </span>
            ))}
          </div>
          <Button className="mt-6" onClick={() => setDrawerOpen(true)}>
            <Icon icon={AddIcon} size={16} />
            {t("addSource")}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t("summary.sources"), value: String(totals.sources) },
              { label: t("summary.pages"), value: totals.pages.toLocaleString(locale) },
              { label: t("summary.chunks"), value: totals.chunks.toLocaleString(locale) },
              { label: t("summary.lastSync"), value: relativeTime(totals.last) },
            ].map((s) => (
              <div key={s.label} className="border-border bg-surface rounded-lg border p-4">
                <p className="label-caps">{s.label}</p>
                <p className="text-text mt-1 truncate font-serif text-[26px] leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          <ul className="flex flex-col gap-3">
            {list.map((s) => {
              const busy = s.status === "processing" || s.status === "queued";
              const pct = s.progress?.total ? Math.min(100, ((s.progress.done ?? 0) / s.progress.total) * 100) : 0;
              return (
                <li
                  key={s.id}
                  className={cn(
                    "page-in anim-keep rounded-lg border p-4 transition-colors duration-200",
                    s.status === "failed" ? "border-error/40 bg-error/5" : "border-border bg-surface hover:border-text-muted",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      aria-hidden
                      className="border-border bg-bg text-link flex size-11 shrink-0 items-center justify-center rounded-md border"
                    >
                      <Icon icon={typeIcon[s.type]} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-lg text-text truncate" title={s.name}>
                        {s.name}
                      </p>
                      <p className="text-small text-text-muted truncate">
                        {host(s)} · {t("counts", { pages: s.pagesCount, chunks: s.chunksCount })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="border-border bg-surface-raised text-small text-text inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
                          <span className="relative flex size-2">
                            {s.status === "processing" ? (
                              <span
                                className="anim-keep bg-accent absolute inline-flex size-full rounded-full opacity-60"
                                style={{ animation: "ping-soft 1.8s ease-out infinite" }}
                              />
                            ) : null}
                            <span className={cn("relative inline-flex size-2 rounded-full", STATUS_DOT[s.status])} />
                          </span>
                          {statusLabel(s)}
                        </span>
                        <p className="text-small text-text-muted mt-1">{relativeTime(s.lastSyncedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant={s.status === "failed" ? "subtle" : "ghost"}
                          size="icon"
                          aria-label={s.status === "failed" ? t("retry") : t("resync")}
                          onClick={() => resync.mutate(s.id)}
                          disabled={resync.isPending || busy}
                        >
                          <Icon icon={RefreshIcon} size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => setDeleteTarget(s)}>
                          <Icon icon={DeleteIcon} size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {s.status === "processing" && s.progress?.total ? (
                    <div className="bg-surface-raised mt-3 h-1 w-full overflow-hidden rounded-full">
                      <div
                        className="anim-keep bg-accent h-1 rounded-full transition-[width] duration-700 ease-[var(--ease-lux)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : null}
                  {s.error ? (
                    <p className="text-small text-error mt-3 flex items-center gap-2">
                      <Icon icon={WarningIcon} size={14} />
                      {t(`errors.${s.error}` as never) ?? s.error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
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

function OptionCard({
  icon,
  title,
  children,
}: {
  icon: typeof PdfIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-lg border p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="border-border bg-bg text-link flex size-9 items-center justify-center rounded-md border">
          <Icon icon={icon} size={18} />
        </span>
        <h3 className="font-serif text-h3 text-text">{title}</h3>
      </div>
      {children}
    </section>
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
  const tErrors = useTranslations("Errors");
  const errMsg = useApiError();

  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
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
      toast.error(errMsg(error, tErrors("genericTitle")));
    } finally {
      setUploading(false);
    }
  }

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    setUrlError(null);
    setUrlLoading(true);
    try {
      // « example.com » est une saisie courante : on ajoute https:// quand aucun schéma n'est donné.
      const target = /^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      await api(`/api/chatbots/${chatbotId}/sources`, { method: "POST", body: JSON.stringify({ type: "url", url: target }) });
      setUrl("");
      onAdded();
      onOpenChange(false);
    } catch (error) {
      setUrlError(errMsg(error, t("errors.invalid_url")));
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
        <DrawerTitle className="mb-1">{t("drawerTitle")}</DrawerTitle>
        <p className="text-small text-text-muted mb-6">{t("drawerSubtitle")}</p>

        <div className="scroll-thin -mr-2 flex flex-col gap-4 overflow-y-auto pr-2">
          <OptionCard icon={PdfIcon} title={t("pdfTitle")}>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={cn(
                "anim-keep flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-7 text-center transition-colors duration-200",
                dragOver ? "border-accent bg-tint" : "border-border hover:border-accent",
              )}
            >
              <Icon icon={UploadIcon} size={22} className={dragOver || uploading ? "text-link" : "text-text-muted"} />
              <p className="text-small text-text-muted">{uploading ? t("uploading") : dragOver ? t("dropHere") : t("pdfBody")}</p>
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
          </OptionCard>

          <OptionCard icon={GlobeIcon} title={t("urlTitle")}>
            <form onSubmit={submitUrl} className="flex gap-2">
              <Input
                placeholder={t("urlPlaceholder")}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError(null);
                }}
                error={urlError ?? undefined}
                className="flex-1"
              />
              <Button type="submit" loading={urlLoading} disabled={!url}>
                {t("addSource")}
              </Button>
            </form>
            <p className="mt-2 text-small text-text-muted">{t("urlHint", { max: maxPagesPerSite })}</p>
          </OptionCard>

          <OptionCard icon={NotionIcon} title={t("notionTitle")}>
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
                <div className="scroll-thin max-h-48 overflow-y-auto rounded-md border border-border">
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
                        className="anim-keep flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left transition-colors last:border-0 hover:bg-tint"
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
          </OptionCard>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
