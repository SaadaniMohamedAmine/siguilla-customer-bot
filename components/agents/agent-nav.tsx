"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", href: "" },
  { key: "sources", href: "sources" },
  { key: "playground", href: "playground" },
  { key: "widget", href: "widget" },
  { key: "conversations", href: "/conversations" },
  { key: "analytics", href: "/analytics" },
  { key: "settings", href: "settings" },
] as const;

/** Onglets de la fiche agent : le loader global ne se lance pas entre eux (même agent), l'indicateur accent se redessine. */
export function AgentNav({ agentId }: { agentId: string }) {
  const t = useTranslations("Agents.tabs");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav
      aria-label={t("overview")}
      className="border-border no-scrollbar -mx-1 mb-8 flex gap-1 overflow-x-auto overflow-y-hidden border-b px-1 md:overflow-visible"
    >
      {TABS.map((tab) => {
        const external = tab.href.startsWith("/");
        const href = external
          ? `${tab.href}?agent=${agentId}`
          : `/agents/${agentId}${tab.href ? `/${tab.href}` : ""}`;
        const active = external
          ? pathname === tab.href && searchParams.get("agent") === agentId
          : pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "anim-keep text-body group relative inline-flex shrink-0 items-center gap-1.5 px-3 py-3 whitespace-nowrap transition-colors duration-200",
              active ? "text-text" : "text-text-muted hover:text-text",
            )}
          >
            {t(tab.key)}
            {external ? (
              <Icon
                icon={ArrowRightIcon}
                size={12}
                className="anim-keep -rotate-45 opacity-50 transition-opacity duration-200 group-hover:opacity-100"
              />
            ) : null}
            <span
              aria-hidden
              className={cn(
                "anim-keep bg-accent absolute right-3 -bottom-px left-3 h-0.5 origin-left rounded-full transition-transform duration-300 ease-[var(--ease-lux)]",
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
