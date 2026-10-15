import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon, SealIcon } from "@/lib/icons";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { CompareTable } from "@/components/marketing/compare-table";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { TestCardPill } from "@/components/marketing/test-card-pill";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = { title: "Pricing" };

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default async function PricingPage() {
  const t = await getTranslations("Pricing");
  const faq = t.raw("faq") as { q: string; a: string }[];
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <p className="label-caps text-link hero-in anim-keep" style={at(0)}>
          {t("eyebrow")}
        </p>
        <h1 className="text-h1 text-text hero-in anim-keep mt-3 font-serif" style={at(120)}>
          {t("title")}
        </h1>
        <p className="text-body-lg text-text-muted hero-in anim-keep mt-3" style={at(240)}>
          {t("subtitle")}
        </p>
        <div className="hero-in anim-keep" style={at(360)}>
          <TestCardPill label={t("testMode")} />
        </div>
      </div>

      <PricingCards />

      <section className="mt-24">
        <Reveal>
          <h2 className="text-h2 text-text text-center font-serif">{t("compareTitle")}</h2>
        </Reveal>
        <Reveal delay={100} className="mt-8">
          <CompareTable />
        </Reveal>
      </section>

      <Reveal className="mt-24">
        <div className="border-border bg-surface rounded-md border p-8 text-center sm:p-10">
          <span
            aria-hidden
            className="border-border bg-bg text-link mx-auto flex size-10 items-center justify-center rounded-full border"
          >
            <Icon icon={SealIcon} size={20} />
          </span>
          <p className="text-h3 text-text mt-4 font-serif">{t("honestTitle")}</p>
          <p className="text-body text-text-muted mx-auto mt-2 max-w-xl">{t("honestBody")}</p>
        </div>
      </Reveal>

      <section className="mx-auto mt-24 max-w-2xl">
        <Reveal>
          <h2 className="text-h2 text-text font-serif">{t("faqTitle")}</h2>
          <div className="mt-6">
            <FaqAccordion items={faq} />
          </div>
        </Reveal>
      </section>

      <div className="mt-16 text-center">
        <Link href="/docs">
          <Button variant="ghost" className="group anim-keep">
            {t("readDocs")}
            <Icon
              icon={ArrowRightIcon}
              size={16}
              className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
            />
          </Button>
        </Link>
      </div>
    </div>
  );
}
