"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Wordmark } from "@/components/ui/wordmark";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SunIcon, MoonIcon } from "@/lib/icons";

export function MarketingNav() {
  const { theme, setTheme } = useTheme();
  return (
    <header className="border-border bg-bg/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Wordmark size="md" />
        </Link>
        <nav className="text-body text-text-muted hidden items-center gap-6 sm:flex">
          <Link href="/#how" className="hover:text-text">
            Product
          </Link>
          <Link href="/pricing" className="hover:text-text">
            Pricing
          </Link>
          <Link href="/docs" className="hover:text-text">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="text-text-muted hover:text-text"
          >
            <Icon icon={theme === "dark" ? SunIcon : MoonIcon} size={18} />
          </button>
          <Link href="/sign-in" className="text-body text-text-muted hover:text-text">
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
