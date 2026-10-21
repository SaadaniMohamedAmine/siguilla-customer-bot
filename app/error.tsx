"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "@/components/ui/wordmark";
import { RefreshIcon, WarningIcon } from "@/lib/icons";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="anim-keep pointer-events-none absolute top-1/3 left-1/2 h-96 w-[40rem] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.12,
          animation: "glow-drift 9s ease-in-out infinite",
        }}
      />
      <Link href="/" aria-label={`Sigilla — ${t("home")}`} className="absolute top-8 left-1/2 -translate-x-1/2 transition-opacity hover:opacity-80">
        <Wordmark size="md" />
      </Link>

      <div className="relative flex flex-col items-center">
        <span
          aria-hidden
          className="hero-in anim-keep border-warning/50 bg-surface text-warning relative flex size-28 items-center justify-center rounded-full border-2 border-dashed"
          style={at(0)}
        >
          <span
            className="anim-keep border-warning/30 absolute -inset-3 rounded-full border"
            style={{ animation: "ping-soft 2.4s ease-out infinite" }}
          />
          <Icon icon={WarningIcon} size={44} />
        </span>

        <p className="label-caps text-warning hero-in anim-keep mt-8" style={at(150)}>
          {t("eyebrow")}
        </p>
        <h1 className="text-h1 text-text hero-in anim-keep mt-3 font-serif" style={at(250)}>
          {te("genericTitle")}
        </h1>
        <p className="text-body-lg text-text-muted hero-in anim-keep mt-3 max-w-md" style={at(350)}>
          {te("genericBody")}
        </p>

        <div className="hero-in anim-keep mt-8 flex flex-wrap justify-center gap-3" style={at(450)}>
          <Button size="lg" onClick={() => reset()} className="group anim-keep hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
            <Icon
              icon={RefreshIcon}
              size={16}
              className="anim-keep transition-transform duration-500 group-hover:rotate-180"
            />
            {tc("retry")}
          </Button>
          <Link href="/">
            <Button size="lg" variant="ghost" className="anim-keep hover:-translate-y-0.5">
              {t("home")}
            </Button>
          </Link>
        </div>

        {error.digest ? (
          <p className="text-small text-text-muted hero-in anim-keep mt-8 font-mono" style={at(550)}>
            {t("reference")}: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
