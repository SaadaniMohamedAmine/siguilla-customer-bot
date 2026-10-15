"use client";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { CheckIcon } from "@/lib/icons";

/** Mini-illustrations CSS des étapes « How it works » (contenu de démo, comme le mock du hero). */

function Frame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      aria-hidden
      className="border-border bg-surface relative mt-auto flex h-[132px] flex-col justify-center gap-2 overflow-hidden rounded-md border p-4"
    >
      {children}
      {label ? (
        <span className="text-text-muted absolute top-2 right-3 font-mono text-[9px] tracking-[0.12em] uppercase">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function ConnectVisual() {
  const t = useTranslations("HomeVisuals");
  const rows = [
    ["PDF", "catalogue-2026.pdf"],
    ["URL", "atelierlune.com/faq"],
    ["Notion", t("notionPage")],
  ];
  return (
    <Frame label={t("indexed")}>
      {rows.map(([tag, name]) => (
        <div key={name} className="border-border bg-bg flex items-center gap-3 rounded-sm border px-2.5 py-1.5">
          <span className="text-link w-9 font-mono text-[10px]">{tag}</span>
          <span className="text-text-muted flex-1 truncate text-[12px]">{name}</span>
          <Icon icon={CheckIcon} size={13} className="text-success" />
        </div>
      ))}
    </Frame>
  );
}

export function ShapeVisual() {
  const t = useTranslations("HomeVisuals");
  return (
    <Frame>
      <div className="flex items-center gap-2.5">
        <span className="bg-accent text-on-accent flex size-7 items-center justify-center rounded-md font-serif text-[14px]">
          S
        </span>
        <span className="border-border bg-bg text-text flex-1 rounded-sm border px-2.5 py-1 text-[12px]">
          Concierge
        </span>
      </div>
      <div className="flex items-center gap-2">
        {["bg-accent ring-2 ring-focus ring-offset-2 ring-offset-surface", "bg-success", "bg-warning", "bg-text-muted"].map(
          (c) => (
            <span key={c} className={`size-4 rounded-full ${c}`} />
          ),
        )}
        <span className="text-text-muted ml-auto font-mono text-[10px]">{t("warmTone")}</span>
      </div>
      <p className="border-border bg-bg text-text-muted rounded-sm border px-2.5 py-1.5 text-[12px]">
        {t("welcome")}
      </p>
    </Frame>
  );
}

export function EmbedVisual() {
  const t = useTranslations("HomeVisuals");
  return (
    <Frame label={t("under5")}>
      <pre className="text-text-muted overflow-hidden font-mono text-[11px] leading-5 whitespace-pre-wrap">
        <span className="text-link">&lt;script</span> src=<span className="text-success">&quot;/widget/v1.js&quot;</span>
        {"\n"}
        {"  "}data-bot=<span className="text-success">&quot;pk_atelier&quot;</span>
        {"\n"}
        {"  "}async<span className="text-link">&gt;&lt;/script&gt;</span>
        <span className="bg-accent anim-keep ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5" style={{ animation: "caret 1s steps(1) infinite" }} />
      </pre>
    </Frame>
  );
}

export function HandoffVisual() {
  const t = useTranslations("HomeVisuals");
  return (
    <Frame label={t("inbox")}>
      <div className="border-border bg-bg flex items-center gap-2.5 rounded-sm border px-2.5 py-2">
        <span className="bg-surface-raised text-text-muted flex size-6 items-center justify-center rounded-full text-[10px]">
          M
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-text block truncate text-[12px]">{t("q1")}</span>
          <span className="text-text-muted block truncate text-[10px]">{t("notFound")}</span>
        </span>
        <span className="text-warning border-warning/40 rounded-full border px-2 py-0.5 text-[9px] tracking-wide uppercase">
          {t("handoff")}
        </span>
      </div>
      <div className="border-border bg-bg flex items-center gap-2.5 rounded-sm border px-2.5 py-2 opacity-60">
        <span className="bg-surface-raised text-text-muted flex size-6 items-center justify-center rounded-full text-[10px]">
          J
        </span>
        <span className="text-text-muted min-w-0 flex-1 truncate text-[12px]">{t("q2")}</span>
        <Icon icon={CheckIcon} size={13} className="text-success" />
      </div>
    </Frame>
  );
}
