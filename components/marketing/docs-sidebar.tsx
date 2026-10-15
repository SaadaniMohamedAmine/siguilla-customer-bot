"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { ChevronDownIcon } from "@/lib/icons";
import { DocsSearch } from "@/components/marketing/docs-search";
import { cn } from "@/lib/utils";
import type { DocSearchEntry } from "@/lib/docs";

type Group = { key: "start" | "widget" | "concepts" | "reference"; items: { slug: string; title: string }[] };

/** Sidebar groupée : barre accent sur la page active, recherche en tête ; menu déroulant sur mobile. */
export function DocsSidebar({
  groups,
  index,
}: {
  groups: Group[];
  index: DocSearchEntry[];
}) {
  const t = useTranslations("Docs");
  const pathname = usePathname();
  const current = pathname.split("/")[2] ?? null;
  const [open, setOpen] = useState(false);
  const currentTitle =
    groups.flatMap((g) => g.items).find((i) => i.slug === current)?.title ?? (current === null ? t("overview") : t("browse"));

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <DocsSearch index={index} />

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="border-border bg-surface text-body text-text mt-3 flex w-full items-center justify-between rounded-sm border px-3 py-2 lg:hidden"
      >
        <span>
          <span className="text-text-muted">{t("browse")} · </span>
          {currentTitle}
        </span>
        <Icon
          icon={ChevronDownIcon}
          size={16}
          className={cn("anim-keep transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <nav
        aria-label={t("browse")}
        className={cn("mt-6 flex-col gap-6 lg:flex", open ? "flex" : "hidden")}
      >
        <Link
          href="/docs"
          onClick={() => setOpen(false)}
          aria-current={current === null ? "page" : undefined}
          className={cn(
            "anim-keep text-small block rounded-sm px-3 py-1.5 transition-colors duration-200",
            current === null ? "bg-tint text-text" : "text-text-muted hover:text-text hover:bg-surface",
          )}
        >
          {t("overview")}
        </Link>
        {groups.map((g) => (
          <div key={g.key}>
            <p className="label-caps mb-2 px-3">{t(`groups.${g.key}`)}</p>
            <ul className="flex flex-col">
              {g.items.map((item) => {
                const active = item.slug === current;
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/docs/${item.slug}`}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "anim-keep text-small relative block rounded-sm px-3 py-1.5 transition-colors duration-200",
                        active ? "bg-tint text-text" : "text-text-muted hover:text-text hover:bg-surface",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "anim-keep bg-accent absolute top-1.5 bottom-1.5 left-0 w-0.5 origin-center rounded-full transition-transform duration-300 ease-[var(--ease-lux)]",
                          active ? "scale-y-100" : "scale-y-0",
                        )}
                      />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
