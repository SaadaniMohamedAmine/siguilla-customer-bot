import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { InfoIcon, WarningIcon, SealIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const KINDS = {
  note: { icon: InfoIcon, box: "border-border bg-surface", accent: "text-link" },
  warning: { icon: WarningIcon, box: "border-warning/40 bg-warning/5", accent: "text-warning" },
  tip: { icon: SealIcon, box: "border-success/40 bg-success/5", accent: "text-success" },
} as const;

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** `> **Note** — …`, `> **Warning** — …`, `> **Tip** — …` en Markdown deviennent des encadrés ; sinon, citation simple. */
export function DocBlockquote({ children }: { children?: React.ReactNode }) {
  const first = textOf(children).trim().toLowerCase();
  const kind = (Object.keys(KINDS) as (keyof typeof KINDS)[]).find((k) => first.startsWith(k));
  if (!kind) {
    return <blockquote className="border-border text-text-muted mt-4 border-l-2 pl-4">{children}</blockquote>;
  }
  const k = KINDS[kind];
  return (
    <aside className={cn("mt-5 flex gap-3 rounded-md border p-4", k.box)}>
      <Icon icon={k.icon} size={18} className={cn("mt-0.5", k.accent)} />
      <div className="min-w-0 [&>p]:mt-0">{children}</div>
    </aside>
  );
}
