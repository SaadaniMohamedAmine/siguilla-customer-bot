import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "@/components/ui/wordmark";
import { ArrowRightIcon, SealIcon } from "@/lib/icons";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  const links = [
    { href: "/pricing", label: t("pricing") },
    { href: "/docs", label: t("docs") },
    { href: "/demo", label: t("demo") },
  ];
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="anim-keep pointer-events-none absolute top-1/3 left-1/2 h-96 w-[40rem] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.16,
          animation: "glow-drift 9s ease-in-out infinite",
        }}
      />
      <Link href="/" aria-label={t("home")} className="absolute top-8 left-1/2 -translate-x-1/2 transition-opacity hover:opacity-80">
        <Wordmark size="md" />
      </Link>

      <div className="relative flex flex-col items-center">
        <div
          aria-hidden
          className="hero-in anim-keep text-text flex items-center font-serif text-[clamp(6rem,22vw,13rem)] leading-none"
          style={at(0)}
        >
          <span>4</span>
          <span className="relative mx-[0.04em] flex size-[0.78em] items-center justify-center">
            <span
              className="anim-keep border-accent absolute inset-0 rounded-full border-2 border-dashed"
              style={{ animation: "spin-slow 28s linear infinite" }}
            />
            <Icon icon={SealIcon} size={72} className="text-link size-[0.34em]" />
          </span>
          <span>4</span>
        </div>

        <p className="label-caps text-link hero-in anim-keep mt-6" style={at(150)}>
          {t("eyebrow")}
        </p>
        <h1 className="text-h1 text-text hero-in anim-keep mt-3 font-serif" style={at(250)}>
          {t("title")}
        </h1>
        <p className="text-body-lg text-text-muted hero-in anim-keep mt-3 max-w-md" style={at(350)}>
          {t("body")}
        </p>

        <div className="hero-in anim-keep mt-8 flex flex-wrap justify-center gap-3" style={at(450)}>
          <Link href="/">
            <Button size="lg" className="group anim-keep hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
              {t("home")}
              <Icon
                icon={ArrowRightIcon}
                size={16}
                className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
              />
            </Button>
          </Link>
        </div>

        <nav
          aria-label={t("quickLinks")}
          className="text-small text-text-muted hero-in anim-keep mt-8 flex items-center gap-4"
          style={at(550)}
        >
          {links.map((l, i) => (
            <span key={l.href} className="flex items-center gap-4">
              {i > 0 ? <span aria-hidden className="bg-accent size-1 rotate-45" /> : null}
              {l.href === "/demo" ? (
                // Lien classique : /demo ouvre une session de démo, un <Link> la ferait ouvrir par le préchargement.
                <a href={l.href} className="link-draw anim-keep hover:text-text transition-colors">
                  {l.label}
                </a>
              ) : (
                <Link href={l.href} className="link-draw anim-keep hover:text-text transition-colors">
                  {l.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
