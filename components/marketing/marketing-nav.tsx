"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { Wordmark } from "@/components/ui/wordmark";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { GlobeIcon, SunIcon, MoonIcon } from "@/lib/icons";
import { changeLocale } from "@/lib/actions/locale";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

const iconBtn =
  "anim-keep text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors duration-200";

export function MarketingNav() {
  const t = useTranslations("SiteNav");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const mounted = useHydrated();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Le menu mobile est ouvert tant qu'on est sur la page où il a été ouvert (se referme tout seul à la navigation).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Sur la home, défilement fluide vers l'ancre (Next ne l'anime pas pour un lien /#id).
  const scrollToHow = (e: React.MouseEvent) => {
    setOpenAt(null);
    const target = pathname === "/" ? document.getElementById("how") : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", "/#how");
  };

  const links = [
    { href: "/#how", label: t("product"), active: false, onClick: scrollToHow },
    { href: "/pricing", label: t("pricing"), active: pathname === "/pricing" },
    { href: "/docs", label: t("docs"), active: pathname.startsWith("/docs") },
  ];
  const otherLocale = locale === "en" ? "fr" : "en";
  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "border-border sticky top-0 z-40 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid ? "bg-bg/90 shadow-[0_10px_30px_-18px_rgb(0_0_0/0.7)] backdrop-blur-md" : "bg-bg/40 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "anim-keep mx-auto flex max-w-5xl items-center justify-between px-6 transition-[padding] duration-300",
          scrolled ? "py-2.5" : "py-4",
        )}
      >
        <Link href="/" onClick={() => setOpenAt(null)}>
          <Wordmark size="md" />
        </Link>

        <nav className="text-body text-text-muted hidden items-center gap-6 sm:flex" aria-label={t("main")}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={l.onClick}
              aria-current={l.active ? "page" : undefined}
              className={cn(
                "anim-keep group relative py-1 transition-colors duration-200",
                l.active ? "text-text" : "hover:text-text",
              )}
            >
              {l.label}
              <span
                aria-hidden
                className={cn(
                  "anim-keep bg-accent absolute -bottom-0.5 left-0 h-0.5 w-full origin-left transition-transform duration-300 ease-[var(--ease-lux)]",
                  l.active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => changeLocale(otherLocale)} aria-label={t("switchTo")} className={cn(iconBtn, "text-small")}>
            <Icon icon={GlobeIcon} size={16} />
            <span className="uppercase">{otherLocale}</span>
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t("toggleTheme")}
            className={iconBtn}
          >
            <Icon icon={mounted && theme === "dark" ? SunIcon : MoonIcon} size={18} />
          </button>
          <Link href="/sign-in" className="text-body text-text-muted hover:text-text hidden transition-colors sm:inline">
            {t("signIn")}
          </Link>
          <Link href="/sign-up" className="hidden sm:block">
            <Button size="sm">{t("startFree")}</Button>
          </Link>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpenAt(open ? null : pathname)}
            className="anim-keep relative -mr-1 size-8 sm:hidden"
          >
            <span
              className={cn(
                "anim-keep bg-text absolute left-1.5 h-px w-5 transition-all duration-300 ease-[var(--ease-lux)]",
                open ? "top-4 rotate-45" : "top-[11px]",
              )}
            />
            <span
              className={cn(
                "anim-keep bg-text absolute left-1.5 h-px w-5 transition-all duration-300 ease-[var(--ease-lux)]",
                open ? "top-4 -rotate-45" : "top-[19px]",
              )}
            />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        inert={!open}
        className={cn(
          "anim-keep grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-lux)] sm:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <nav className="border-border mx-6 flex flex-col border-t pt-4 pb-6" aria-label={t("main")}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={l.onClick ?? (() => setOpenAt(null))}
                aria-current={l.active ? "page" : undefined}
                className={cn(
                  "anim-keep border-border text-h3 border-b py-3 font-serif transition-colors",
                  l.active ? "text-link" : "text-text",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/sign-in" onClick={() => setOpenAt(null)}>
                <Button variant="ghost" className="w-full">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/sign-up" onClick={() => setOpenAt(null)}>
                <Button className="w-full">{t("startFree")}</Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
