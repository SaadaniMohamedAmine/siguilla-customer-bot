"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Titre de doc avec ancre : un « # » apparaît au survol, un clic copie le lien direct. */
export function DocHeading({
  level,
  id,
  prefix,
  children,
}: {
  level: 2 | 3;
  id: string;
  prefix?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("Docs");
  const [copied, setCopied] = useState(false);
  const Tag = level === 2 ? "h2" : "h3";

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    history.replaceState(null, "", `#${id}`);
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* lien déjà dans la barre d'adresse */
    }
  }

  return (
    <Tag
      id={id}
      className={cn(
        "group text-text scroll-mt-24 font-serif",
        level === 2 ? "text-h2 mt-12" : "text-h3 mt-8",
      )}
    >
      {prefix}
      {children}
      <a
        href={`#${id}`}
        onClick={copy}
        aria-label={t("copyLink")}
        className="anim-keep text-text-muted hover:text-link ml-2 inline-block text-[0.7em] opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? t("linkCopied") : "#"}
      </a>
    </Tag>
  );
}
