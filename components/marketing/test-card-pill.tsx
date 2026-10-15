"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { CheckIcon, CopyIcon, InfoIcon } from "@/lib/icons";

const CARD = "4242 4242 4242 4242";

/** Pastille « mode démo » : carte de test Stripe copiable en un clic. */
export function TestCardPill({ label }: { label: string }) {
  const t = useTranslations("Common");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CARD.replace(/ /g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papiers indisponible : la carte reste lisible à l'écran */
    }
  }

  return (
    <div className="border-border bg-surface text-small text-text-muted mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border py-1.5 pr-2 pl-3.5">
      <span className="inline-flex items-center gap-2">
        <Icon icon={InfoIcon} size={14} className="text-link" />
        {label}
        <span className="text-text font-mono">{CARD}</span>
      </span>
      <button
        type="button"
        onClick={copy}
        className="anim-keep border-border hover:border-accent text-text inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors duration-200"
      >
        <Icon icon={copied ? CheckIcon : CopyIcon} size={12} />
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
