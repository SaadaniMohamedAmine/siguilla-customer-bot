import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/ui/wordmark";
import { Icon } from "@/components/ui/icon";
import { ArrowLeftIcon, SealIcon } from "@/lib/icons";
import { HeroWidgetMock } from "@/components/marketing/hero-widget-mock";
import { AuthBenefits } from "@/components/marketing/auth-benefits";

const BackHome = ({ label, className }: { label: string; className?: string }) => (
  <Link
    href="/"
    className={`group anim-keep text-small text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors duration-200 ${className ?? ""}`}
  >
    <Icon
      icon={ArrowLeftIcon}
      size={14}
      className="anim-keep transition-transform duration-200 group-hover:-translate-x-1"
    />
    {label}
  </Link>
);

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth");
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="bg-surface relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[55%]">
        <div
          aria-hidden
          className="anim-keep pointer-events-none absolute top-1/3 left-1/2 h-96 w-[40rem] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            opacity: 0.16,
            animation: "glow-drift 9s ease-in-out infinite",
          }}
        />
        <Link href="/" aria-label={t("backHome")} className="relative w-fit transition-opacity duration-200 hover:opacity-80">
          <Wordmark size="md" />
        </Link>

        <div className="relative mx-auto w-full max-w-md">
          <HeroWidgetMock />
        </div>

        <div className="relative max-w-xl">
          <span
            aria-hidden
            className="border-border bg-bg text-link mb-5 flex size-10 items-center justify-center rounded-full border"
          >
            <Icon icon={SealIcon} size={18} />
          </span>
          <p className="text-text font-serif text-[44px] leading-[1.08]">&ldquo;{t("quote")}&rdquo;</p>
          <p className="text-body-lg text-text-muted mt-4">{t("tagline")}</p>
          <AuthBenefits />
        </div>
        <svg
          className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 opacity-60"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
        >
          <circle cx="100" cy="100" r="99" stroke="var(--border)" />
          <circle cx="100" cy="100" r="70" stroke="var(--border)" />
        </svg>
      </div>
      <main className="relative flex flex-1 flex-col items-center justify-center p-6 lg:w-[45%]">
        <BackHome label={t("backHome")} className="absolute top-6 left-6" />
        <div className="w-full max-w-[420px] pt-10 lg:hidden">
          <Link href="/" aria-label={t("backHome")} className="mb-8 block text-center">
            <Wordmark size="md" />
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
