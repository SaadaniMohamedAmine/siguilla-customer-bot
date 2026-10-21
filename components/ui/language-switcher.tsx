"use client";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { CheckIcon, ChevronDownIcon } from "@/lib/icons";
import { Flag } from "@/components/ui/flag";
import { changeLocale } from "@/lib/actions/locale";
import { locales, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

const NAMES: Record<Locale, string> = { en: "English", fr: "Français" };

/** Sélecteur de langue : pastille (globe + code + chevron) qui ouvre un menu aux couleurs du thème. */
export function LanguageSwitcher({
  side = "bottom",
  align = "end",
  className,
}: {
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("SiteNav");
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Le nom accessible doit contenir le texte visible (« EN ») : WCAG 2.5.3, sinon la commande vocale « clic EN » échoue.
        aria-label={`${t("switchTo")} (${locale.toUpperCase()})`}
        className={cn(
          "anim-keep group border-border bg-surface-raised text-text hover:border-accent text-small data-[state=open]:border-accent inline-flex h-8 items-center gap-1.5 rounded-full border pr-2.5 pl-3 transition-colors duration-200 outline-none",
          pending && "opacity-70",
          className,
        )}
      >
        <Flag locale={locale} />
        <span className="font-medium uppercase">{locale}</span>
        <Icon
          icon={ChevronDownIcon}
          size={14}
          className="anim-keep text-text-muted transition-transform duration-300 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={8}
        className="menu-anim anim-keep border-border min-w-[180px] rounded-md p-1.5"
      >
        {locales.map((l) => {
          const active = l === locale;
          return (
            <DropdownMenuItem
              key={l}
              onSelect={() => {
                if (!active) startTransition(() => changeLocale(l));
              }}
              className={cn("anim-keep justify-between rounded-sm py-2 transition-colors", active && "bg-tint")}
            >
              <span className="flex items-center gap-2.5">
                <Flag locale={l} className="h-4 w-6" />
                <span className={cn(active && "font-medium")}>{NAMES[l]}</span>
              </span>
              {active ? <Icon icon={CheckIcon} size={16} className="text-link" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
