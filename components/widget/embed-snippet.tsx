"use client";
import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CopyIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function EmbedSnippet({ publicKey, className }: { publicKey: string; className?: string }) {
  const snippet = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget/v1.js" data-bot="${publicKey}" async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy. Select the snippet and copy it manually.");
    }
  }

  return (
    <div className={cn("flex items-start gap-2 rounded-sm border border-border bg-surface-raised p-4", className)}>
      <code className="flex-1 overflow-x-auto whitespace-pre font-mono text-small text-text">{snippet}</code>
      <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy embed code">
        <Icon icon={CopyIcon} size={16} />
      </Button>
    </div>
  );
}
