"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "sources", label: "Sources" },
  { href: "playground", label: "Playground" },
  { href: "widget", label: "Widget" },
  { href: "settings", label: "Settings" },
] as const;

export function AgentNav({ agentId }: { agentId: string }) {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-6 border-b border-border">
      {TABS.map((tab) => {
        const href = `/agents/${agentId}/${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "-mb-px border-b py-3 text-body transition-colors",
              active ? "border-link text-text" : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
