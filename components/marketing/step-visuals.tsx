import { Icon } from "@/components/ui/icon";
import { CheckIcon } from "@/lib/icons";

/** Mini-illustrations CSS des étapes « How it works » (contenu de démo, comme le mock du hero). */

function Frame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      aria-hidden
      className="border-border bg-surface relative mt-5 flex h-[132px] flex-col justify-center gap-2 overflow-hidden rounded-md border p-4"
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
  const rows = [
    ["PDF", "catalogue-2026.pdf"],
    ["URL", "atelierlune.com/faq"],
    ["Notion", "Shipping & returns"],
  ];
  return (
    <Frame label="Indexed">
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
        <span className="text-text-muted ml-auto font-mono text-[10px]">Warm tone</span>
      </div>
      <p className="border-border bg-bg text-text-muted rounded-sm border px-2.5 py-1.5 text-[12px]">
        Welcome to Atelier Lune — how can I help?
      </p>
    </Frame>
  );
}

export function EmbedVisual() {
  return (
    <Frame label="< 5 KB">
      <pre className="text-text-muted overflow-hidden font-mono text-[11px] leading-5 whitespace-pre-wrap">
        <span className="text-link">&lt;script</span> src=<span className="text-success">&quot;/widget/v1.js&quot;</span>
        {"\n"}
        {"        "}data-bot=<span className="text-success">&quot;pk_atelier&quot;</span>
        {"\n"}
        {"        "}async<span className="text-link">&gt;&lt;/script&gt;</span>
        <span className="bg-accent anim-keep ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5" style={{ animation: "caret 1s steps(1) infinite" }} />
      </pre>
    </Frame>
  );
}
