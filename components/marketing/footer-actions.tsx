"use client";
import { useLocale } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { ArrowUpIcon, GlobeIcon } from "@/lib/icons";
import { changeLocale } from "@/lib/actions/locale";

const btn =
  "anim-keep group text-small text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors duration-200";

/** Bascule EN/FR (même action serveur que le dashboard). */
export function LocaleSwitch() {
  const locale = useLocale();
  return (
    <button type="button" onClick={() => changeLocale(locale === "en" ? "fr" : "en")} className={btn}>
      <Icon icon={GlobeIcon} size={14} />
      {locale === "en" ? "Français" : "English"}
    </button>
  );
}

export function BackToTop({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={btn}>
      {label}
      <Icon
        icon={ArrowUpIcon}
        size={14}
        className="anim-keep transition-transform duration-200 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
