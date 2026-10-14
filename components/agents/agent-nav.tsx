"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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

export function AgentNav({ agentId }: { agentId: string }) {
  const t = useTranslations("Agents.tabs");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="border-border mb-6 flex flex-wrap gap-6 border-b">
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
            className={cn(
              "text-body -mb-px border-b py-3 whitespace-nowrap transition-colors",
              active ? "border-link text-text" : "text-text-muted hover:text-text border-transparent",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
