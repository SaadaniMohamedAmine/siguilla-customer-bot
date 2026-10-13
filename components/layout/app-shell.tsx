"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Wordmark } from "@/components/ui/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AgentIcon,
  ConversationIcon,
  AnalyticsIcon,
  SettingsIcon,
  UnfoldIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  DocsIcon,
} from "@/lib/icons";
import { authClient, useListOrganizations, useActiveOrganization, signOut } from "@/lib/auth-client";
import { changeLocale } from "@/lib/actions/locale";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/agents", icon: AgentIcon, key: "agents" },
  { href: "/conversations", icon: ConversationIcon, key: "conversations" },
  { href: "/analytics", icon: AnalyticsIcon, key: "analytics" },
  { href: "/settings", icon: SettingsIcon, key: "settings" },
] as const;

export function AppShell({
  children,
  org,
  user,
  plan,
}: {
  children: React.ReactNode;
  org: { id: string; name: string };
  user: { name: string; email: string; image?: string | null };
  plan: string;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const { data: orgs } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();

  async function switchOrg(organizationId: string) {
    await authClient.organization.setActive({ organizationId });
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-border bg-bg">
        <div className="p-6">
          <Link href="/agents">
            <Wordmark size="md" />
          </Link>
        </div>

        <div className="px-6 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-sm border border-border bg-surface px-3 py-2 text-left hover:bg-surface-raised">
              <div>
                <p className="label-caps">{t("organization")}</p>
                <p className="text-body text-text">{activeOrg?.name ?? org.name}</p>
              </div>
              <Icon icon={UnfoldIcon} size={16} className="text-text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuLabel>{t("organization")}</DropdownMenuLabel>
              {(orgs ?? []).map((o) => (
                <DropdownMenuItem key={o.id} onSelect={() => switchOrg(o.id)}>
                  {o.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-3 py-2 text-body transition-colors",
                  active ? "bg-accent text-on-accent" : "text-text-muted hover:bg-surface hover:text-text",
                )}
              >
                <Icon icon={item.icon} size={18} />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-sm p-2 text-left hover:bg-surface">
              <Avatar name={user.name} src={user.image} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-text">{user.name}</p>
                <p className="truncate text-small text-text-muted">{user.email}</p>
              </div>
              <Badge className="font-mono uppercase">{plan}</Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Icon icon={theme === "dark" ? SunIcon : MoonIcon} size={16} />
                {theme === "dark" ? t("light") : t("dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeLocale(locale === "en" ? "fr" : "en")}>
                {locale === "en" ? "Français" : "English"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/docs">
                  <Icon icon={DocsIcon} size={16} />
                  {t("docs")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut({ fetchOptions: { onSuccess: () => router.push("/sign-in") } })}>
                <Icon icon={LogoutIcon} size={16} />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex-1">
        <main className="mx-auto max-w-[1200px] px-10 py-10">{children}</main>
      </div>
    </div>
  );
}
