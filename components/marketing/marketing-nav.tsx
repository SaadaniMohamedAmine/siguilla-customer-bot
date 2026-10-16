"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { Wordmark } from "@/components/ui/wordmark";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CloseIcon, SunIcon, MoonIcon } from "@/lib/icons";
import { changeLocale } from "@/lib/actions/locale";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { locales } from "@/i18n/locales";
import { useHydrated } from "@/lib/use-hydrated";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const iconBtn =
  "anim-keep text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors duration-200";

export function MarketingNav() {
  const t = useTranslations("SiteNav");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const mounted = useHydrated();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const signedIn = !!session?.user;
  const [scrolled, setScrolled] = useState(false);
  // Le menu mobile est ouvert tant qu'on est sur la page où il a été ouvert (se referme tout seul à la navigation).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const closeRef = useRef<HTMLButtonElement>(null);

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
    closeRef.current?.focus();
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
  const solid = scrolled || open;

  return (
    <>
      <header
        className={cn(
          "border-border sticky top-0 z-40 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300",
          solid
            ? "bg-bg/90 shadow-[0_10px_30px_-18px_rgb(0_0_0/0.7)] backdrop-blur-md"
            : "bg-bg/40 backdrop-blur-sm",
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
            {/* Lien classique : /demo ouvre une session de démonstration, pas de préchargement. */}
            <a
              href="/demo"
              className="anim-keep hover:text-text relative inline-flex items-center gap-1.5 py-1 transition-colors duration-200"
            >
              <span aria-hidden className="bg-accent size-1.5 rounded-full" />
              {t("demo")}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("toggleTheme")}
              className={iconBtn}
            >
              <Icon icon={mounted && theme === "dark" ? SunIcon : MoonIcon} size={18} />
            </button>
            {/* Pas de clignotement : tant que la session charge, on réserve la place sans rien afficher. */}
            <div
              className={cn(
                "hidden items-center gap-4 transition-opacity duration-300 sm:flex",
                isPending ? "invisible opacity-0" : "opacity-100",
              )}
            >
              {signedIn ? (
                <Link href="/agents">
                  <Button size="sm">{t("openDashboard")}</Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="text-body text-text-muted hover:text-text transition-colors">
                    {t("signIn")}
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm">{t("startFree")}</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("closeMenu") : t("openMenu")}
              onClick={() => setOpenAt(open ? null : pathname)}
              className="anim-keep relative -mr-1 size-8 sm:hidden"
            >
              <span className="bg-text absolute top-[10px] left-1.5 h-px w-5" />
              <span className="bg-text absolute top-4 left-1.5 h-px w-5" />
              <span className="bg-text absolute top-[22px] left-1.5 h-px w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tiroir mobile : hors du <header> (le backdrop-filter y piégerait les éléments fixed). */}
      <div
        aria-hidden
        onClick={() => setOpenAt(null)}
        className={cn(
          "anim-keep fixed inset-0 z-[2147483100] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t("main")}
        inert={!open}
        className={cn(
          "anim-keep border-border bg-surface fixed inset-y-0 right-0 z-[2147483101] flex w-[min(78vw,320px)] flex-col border-l px-6 shadow-[var(--shadow-lift)] transition-transform duration-300 ease-[var(--ease-lux)] sm:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-[60px] items-center justify-end">
          <button
            ref={closeRef}
            type="button"
            aria-label={t("closeMenu")}
            onClick={() => setOpenAt(null)}
            className="anim-keep text-text-muted hover:text-text -mr-1 flex size-8 items-center justify-center transition-colors"
          >
            <Icon icon={CloseIcon} size={20} />
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-5" aria-label={t("main")}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={l.onClick ?? (() => setOpenAt(null))}
              aria-current={l.active ? "page" : undefined}
              className={cn(
                "anim-keep text-body transition-colors",
                l.active ? "text-link" : "text-text hover:text-link",
              )}
            >
              {l.label}
            </Link>
          ))}
          <a href="/demo" className="anim-keep text-body text-text hover:text-link inline-flex items-center gap-2 transition-colors">
            <span aria-hidden className="bg-accent size-1.5 rounded-full" />
            {t("demo")}
          </a>
        </nav>

        <div className="border-border my-6 flex items-center gap-3 border-t pt-6">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t("toggleTheme")}
            className={iconBtn}
          >
            <Icon icon={mounted && theme === "dark" ? SunIcon : MoonIcon} size={18} />
          </button>
          <div
            role="group"
            aria-label={t("switchTo")}
            className="border-border bg-surface-raised inline-flex rounded-full border p-0.5"
          >
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={l === locale}
                onClick={() => l !== locale && changeLocale(l)}
                className={cn(
                  "anim-keep text-small rounded-full px-3 py-1 uppercase transition-colors duration-200",
                  l === locale ? "bg-accent text-on-accent" : "text-text-muted hover:text-text",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {signedIn ? (
            <Link href="/agents" onClick={() => setOpenAt(null)}>
              <Button className="w-full">{t("openDashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={() => setOpenAt(null)}
                className="text-body text-text hover:text-link transition-colors"
              >
                {t("signIn")}
              </Link>
              <Link href="/sign-up" onClick={() => setOpenAt(null)}>
                <Button className="w-full">{t("startFree")}</Button>
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
