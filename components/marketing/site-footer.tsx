import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/ui/wordmark";
import { Reveal } from "@/components/marketing/reveal";
import { BackToTop } from "@/components/marketing/footer-actions";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

/** Lien de footer : soulignement accent qui se dessine au survol (span réel, pas de pseudo-élément). */
function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls = "group text-text-muted hover:text-text relative w-fit transition-colors duration-200";
  const underline = (
    <span
      aria-hidden
      className="anim-keep bg-accent absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-[var(--ease-lux)] group-hover:scale-x-100"
    />
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
      {underline}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
      {underline}
    </Link>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const authorUrl = process.env.NEXT_PUBLIC_AUTHOR_URL;
  return (
    <footer className="border-border relative overflow-hidden border-t px-6 pt-16">
      <span
        aria-hidden
        className="text-text pointer-events-none absolute inset-x-0 bottom-0 z-0 text-center font-serif text-[clamp(4.5rem,15vw,13rem)] leading-none whitespace-nowrap opacity-[0.04] select-none"
      >
        Sigilla
      </span>
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <Reveal>
            <Wordmark size="md" />
            <p className="text-small text-text-muted mt-3 max-w-xs">&ldquo;{t("tagline")}&rdquo;</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="text-small flex flex-col gap-3">
              <p className="label-caps mb-1">{t("product")}</p>
              <FooterLink href="/#how">{t("how")}</FooterLink>
              <FooterLink href="/pricing">{t("pricing")}</FooterLink>
              <FooterLink href="/docs">{t("docs")}</FooterLink>
              <FooterLink href="/demo">{t("demo")}</FooterLink>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="text-small flex flex-col gap-3">
              <p className="label-caps mb-1">{t("legal")}</p>
              <FooterLink href="/privacy">{t("privacy")}</FooterLink>
              <FooterLink href="/terms">{t("terms")}</FooterLink>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="text-small flex flex-col gap-3">
              <p className="label-caps mb-1">{t("getStarted")}</p>
              <FooterLink href="/sign-in">{t("signIn")}</FooterLink>
              <FooterLink href="/sign-up">{t("startFree")}</FooterLink>
              {authorUrl ? (
                <FooterLink href={authorUrl} external>
                  {t("builtBy")}
                </FooterLink>
              ) : null}
            </div>
          </Reveal>
        </div>

        <div className="border-border mt-14 flex flex-wrap items-center justify-between gap-4 border-t py-6">
          <p className="text-small text-text-muted">{t("rights")}</p>
          <div className="flex items-center gap-6">
            <LanguageSwitcher side="top" />
            <BackToTop label={t("backToTop")} />
          </div>
        </div>
      </div>

    </footer>
  );
}
