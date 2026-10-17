"use client";
import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CopyIcon } from "@/lib/icons";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";

export function EmbedSnippet({ publicKey, className }: { publicKey: string; className?: string }) {
  const hydrated = useHydrated();
  const t = useTranslations("Common");
  const snippet = `<script src="${hydrated ? window.location.origin : ""}/widget/v1.js" data-bot="${publicKey}" async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div
      className={cn(
        "border-border bg-surface-raised flex items-start gap-2 rounded-sm border p-4",
        className,
      )}
    >
      <code className="text-small text-text flex-1 overflow-x-auto font-mono whitespace-pre">{snippet}</code>
      <Button variant="ghost" size="icon" onClick={copy} aria-label={t("copyEmbed")}>
        <Icon icon={CopyIcon} size={16} />
      </Button>
    </div>
  );
}
