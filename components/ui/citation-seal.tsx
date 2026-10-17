"use client";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type CitationSource = { index: number; title: string; locator?: string | null; url?: string | null };

export function CitationSeal({ source, className }: { source: CitationSource; className?: string }) {
  const t = useTranslations("Common");
  const label = `${source.title}${source.locator ? ` — ${source.locator}` : ""}`;
  const seal = (
    <span
      className={cn(
        "mx-[2px] inline-flex h-4 min-w-4 translate-y-[-1px] items-center justify-center rounded-full bg-accent px-[3px] align-middle font-mono text-[10px] leading-none font-medium text-on-accent outline-none focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
      tabIndex={0}
      aria-label={t("sourceLabel", { index: source.index, label })}
    >
      {source.index}
    </span>
  );
  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>{seal}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-sm border border-border bg-surface-raised px-3 py-2 text-small text-text shadow-[var(--shadow-lift)]"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Ligne « Sealed by N sources — … » sous une réponse. */
export function SealedBy({ sources, label }: { sources: CitationSource[]; label: string }) {
  if (sources.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-small text-text-muted">
      <span>{label}</span>
      {sources.map((s, i) => (
        <span key={s.index} className="inline-flex items-center gap-1">
          <span className="font-mono text-[10px]">{s.index}</span>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="text-link underline-offset-4 hover:underline">
              {s.title}
              {s.locator ? ` — ${s.locator}` : ""}
            </a>
          ) : (
            <span className="text-link">
              {s.title}
              {s.locator ? ` — ${s.locator}` : ""}
            </span>
          )}
          {i < sources.length - 1 ? <span aria-hidden>·</span> : null}
        </span>
      ))}
    </p>
  );
}
