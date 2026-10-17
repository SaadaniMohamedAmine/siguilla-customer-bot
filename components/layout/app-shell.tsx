"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/use-hydrated";
import { api } from "@/lib/api";
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
  GlobeIcon,
  CloseIcon,
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
  messageUsage,
  isDemo,
}: {
  children: React.ReactNode;
  org: { id: string; name: string };
  user: { name: string; email: string; image?: string | null };
  plan: string;
  messageUsage: { used: number; limit: number };
  isDemo: boolean;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();
  const locale = useLocale();
  const [openAt, setOpenAt] = React.useState<string | null>(null);
  const menuOpen = openAt === pathname;
  const { data: orgs } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-count"],
    queryFn: () => api<{ count: number }>("/api/conversations/pending-count").then((d) => d.count),
    refetchInterval: 10_000,
  });

  React.useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pendingCount ? `(${pendingCount}) ${base}` : base;
  }, [pendingCount]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function switchOrg(organizationId: string) {
    await authClient.organization.setActive({ organizationId });
    // router.refresh() alone leaves useActiveOrganization()'s client-side cache stale
    // until a full reload — force one so the switch is reflected immediately,
    // staying on the current page rather than jumping back to /agents.
    window.location.reload();
  }

  const sidebar = (
    <>
        <div className="p-6">
          <Link
            href="/"
            aria-label={t("backToSite")}
            title={t("backToSite")}
            className="inline-block transition-opacity duration-200 hover:opacity-80"
          >
            <Wordmark size="md" />
          </Link>
        </div>

        <div className="px-6 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="border-border bg-surface hover:bg-surface-raised flex w-full items-center justify-between rounded-sm border px-3 py-2 text-left">
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
                onClick={() => setOpenAt(null)}
                className={cn(
                  "text-body flex items-center gap-2 rounded-sm px-3 py-2 transition-colors",
                  active ? "bg-accent text-on-accent" : "text-text-muted hover:bg-surface hover:text-text",
                )}
              >
                <Icon icon={item.icon} size={18} />
                <span className="flex-1">{t(item.key)}</span>
                {item.key === "conversations" && pendingCount ? (
                  <span
                    className={cn(
                      "bg-accent text-on-accent min-w-5 rounded-full px-1.5 text-center font-mono text-[11px] leading-5",
                      active && "border border-on-accent bg-transparent",
                    )}
                  >
                    {pendingCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-border border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-surface flex w-full items-center gap-3 rounded-sm p-2 text-left">
              <Avatar name={user.name} src={user.image} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-body text-text truncate">{user.name}</p>
                <p className="text-small text-text-muted truncate">{user.email}</p>
              </div>
              <Badge className="font-mono uppercase">{plan}</Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem asChild>
                <Link href="/">
                  <Icon icon={GlobeIcon} size={16} />
                  {t("backToSite")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/docs">
                  <Icon icon={DocsIcon} size={16} />
                  {t("docs")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Icon icon={mounted && theme === "dark" ? SunIcon : MoonIcon} size={16} />
                {theme === "dark" ? t("light") : t("dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeLocale(locale === "en" ? "fr" : "en")}>
                {locale === "en" ? "Français" : "English"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => signOut({ fetchOptions: { onSuccess: () => router.push("/sign-in") } })}
              >
                <Icon icon={LogoutIcon} size={16} />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="border-border bg-bg sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r lg:flex">
        {sidebar}
      </aside>

      {/* Mobile : barre du haut + tiroir latéral */}
      <header className="border-border bg-bg/90 fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label={t("backToSite")}>
          <Wordmark size="sm" />
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="app-drawer"
          aria-label={t("openMenu")}
          onClick={() => setOpenAt(pathname)}
          className="text-text relative size-9"
        >
          <span className="bg-text absolute top-[12px] left-2 h-px w-5" />
          <span className="bg-text absolute top-[18px] left-2 h-px w-5" />
          <span className="bg-text absolute top-[24px] left-2 h-px w-5" />
        </button>
      </header>
      <div
        aria-hidden
        onClick={() => setOpenAt(null)}
        className={cn(
          "anim-keep fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        id="app-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        inert={!menuOpen}
        className={cn(
          "anim-keep border-border bg-bg fixed inset-y-0 left-0 z-40 flex w-[min(86vw,300px)] flex-col border-r shadow-[var(--shadow-lift)] transition-transform duration-300 ease-[var(--ease-lux)] lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={() => setOpenAt(null)}
          className="text-text-muted hover:text-text absolute top-5 right-4 z-10"
        >
          <Icon icon={CloseIcon} size={20} />
        </button>
        {sidebar}
      </aside>

      <div className="min-w-0 flex-1 pt-14 lg:pt-0">
        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {isDemo ? <DemoModeBanner /> : null}
          <QuotaBanner usage={messageUsage} />
          {children}
        </main>
      </div>
    </div>
  );
}

function QuotaBanner({ usage }: { usage: { used: number; limit: number } }) {
  const router = useRouter();
  const t = useTranslations("Banners");
  const locale = useLocale();
  const ratio = usage.limit > 0 ? usage.used / usage.limit : 0;
  if (ratio < 0.9) return null;
  const exceeded = ratio >= 1;
  const nextReset = new Date();
  nextReset.setUTCMonth(nextReset.getUTCMonth() + 1, 1);
  nextReset.setUTCHours(0, 0, 0, 0);

  return (
    <div
      className={cn(
        "text-small mb-6 flex items-center justify-between gap-4 rounded-sm border p-3",
        exceeded ? "border-error/40 bg-error/10 text-error" : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <p>
        {exceeded ? t("quotaExceeded", { date: nextReset.toLocaleDateString(locale) }) : t("quotaNear")}
      </p>
      <button
        onClick={() => router.push("/settings?tab=billing")}
        className="shrink-0 font-medium underline underline-offset-4"
      >
        {t("upgrade")}
      </button>
    </div>
  );
}

function DemoModeBanner() {
  const router = useRouter();
  const t = useTranslations("Banners");
  return (
    <div className="border-link/40 bg-link/10 text-small text-link mb-6 flex items-center justify-between gap-4 rounded-sm border p-3">
      <p>{t("demo")}</p>
      <button
        onClick={() => router.push("/sign-up")}
        className="shrink-0 font-medium underline underline-offset-4"
      >
        {t("startFree")}
      </button>
    </div>
  );
}
