"use client";
import { useTranslations } from "next-intl";

/** Lien d'évitement : visible uniquement au focus clavier, il saute la navigation vers le contenu principal. */
export function SkipLink() {
  const t = useTranslations("Common");
  return (
    <a
      href="#main-content"
      className="bg-accent text-on-accent sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2147483200]"
    >
      {t("skipToContent")}
    </a>
  );
}
