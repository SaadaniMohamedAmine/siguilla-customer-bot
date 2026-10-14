"use client";
import * as React from "react";
import { toast } from "@/components/ui/toast";

export function CodeBlock({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLPreElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ref.current?.textContent ?? "");
      toast.success("Copied");
    } catch {}
  }

  return (
    <div className="group relative">
      <pre
        ref={ref}
        className="border-border bg-surface-raised text-small overflow-x-auto rounded-md border p-4"
      >
        {children}
      </pre>
      <button
        onClick={copy}
        className="border-border bg-surface text-text-muted hover:text-text absolute top-2 right-2 rounded-sm border px-2 py-1 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
      >
        Copy
      </button>
    </div>
  );
}
