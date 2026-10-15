import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PromiseSection } from "@/components/marketing/promise-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Icon } from "@/components/ui/icon";
import { AnalyticsIcon, ArrowRightIcon, FlashIcon, HumanIcon, SealIcon } from "@/lib/icons";
import {
  AnalyticsVisual,
  CitedVisual,
  HandoffFeatureVisual,
  SizeVisual,
} from "@/components/marketing/feature-visuals";
import { HeroWidgetMock } from "@/components/marketing/hero-widget-mock";

const CTA = "group anim-keep hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]";
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const BRANDS = ["Atelier Lune", "Ledgerline", "Maison Verdant", "Aurelia Haute", "Vendôme & Cie"];

const FEATURES = [
  {
    title: "Cited answers",
    body: "Every sentence points to the page or URL it came from.",
    icon: SealIcon,
    visual: <CitedVisual />,
  },
  {
    title: "Human handoff",
    body: "When the answer isn't in your docs, your agent says so and brings in your team.",
    icon: HumanIcon,
    visual: <HandoffFeatureVisual />,
  },
  {
    title: "Conversation analytics",
    body: "See what customers ask, what's answered, and what's missing from your docs.",
    icon: AnalyticsIcon,
    visual: <AnalyticsVisual />,
  },
  {
    title: "Under 5 KB",
    body: "A dependency-free widget that won't slow your site down.",
    icon: FlashIcon,
    visual: <SizeVisual />,
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sigilla",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro", price: "12", priceCurrency: "USD" },
    { "@type": "Offer", name: "Team", price: "39", priceCurrency: "USD" },
  ],
};

export default async function LandingPage() {
  const t = await getTranslations("Home");
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <section className="relative overflow-hidden px-6 pt-20 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", opacity: 0.18 }}
        />
        <div className="relative mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="label-caps text-link hero-in anim-keep" style={at(100)}>
              AI SUPPORT, WITH SOURCES
            </p>
            <h1 className="text-text mt-4 font-serif text-[44px] leading-[1.05] lg:text-[72px]">
              <span className="hero-in anim-keep block" style={at(220)}>
                Support, answered
              </span>
              <span className="text-link hero-blur anim-keep block italic" style={at(420)}>
                with distinction.
              </span>
            </h1>
            <p className="text-body-lg text-text-muted hero-in anim-keep mt-6 max-w-md" style={at(650)}>
              No-code AI support agents, trained on your docs and embedded anywhere in one line.
            </p>
            <div className="hero-in anim-keep mt-8 flex flex-wrap gap-3" style={at(800)}>
              <Link href="/sign-up">
                <Button size="lg" className={CTA}>
                  Start free
                  <Icon
                    icon={ArrowRightIcon}
                    size={16}
                    className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="ghost" className={CTA}>
                  Explore the live demo
                </Button>
              </Link>
            </div>
          </div>
          <HeroWidgetMock />
        </div>
      </section>

      <section className="border-border border-y py-10">
        <p className="label-caps text-text-muted text-center">Built for houses like</p>
        <div
          className="group relative mt-6 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 15%, #000 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 15%, #000 85%, transparent)",
          }}
        >
          <div className="anim-keep marquee-track flex w-max items-center group-hover:[animation-play-state:paused]">
            {[0, 1, 2, 3].map((copy) => (
              <ul key={copy} aria-hidden={copy > 0 || undefined} className="flex shrink-0 items-center">
                {BRANDS.map((b) => (
                  <li key={b} className="flex items-center">
                    <span className="text-text-muted hover:text-text px-8 font-serif text-[22px] transition-colors duration-300">
                      {b}
                    </span>
                    <span aria-hidden className="bg-accent size-1 rotate-45" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <p className="text-small text-text-muted/70 mt-6 text-center">Illustrative brands</p>
      </section>

      <section id="how" className="scroll-mt-16 px-6 py-24">
        <HowItWorks eyebrow={t("howEyebrow")} title={t("howTitle")} />
      </section>

      <section className="bg-surface px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <p className="label-caps text-link">{t("whyEyebrow")}</p>
            <h2 className="text-h1 text-text mx-auto mt-3 max-w-2xl font-serif">{t("whyTitle")}</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100} className="h-full">
                <FeatureCard title={f.title} body={f.body} icon={f.icon} visual={f.visual} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <PromiseSection
          quote={t("promiseQuote")}
          label={t("promiseLabel")}
          hint={t("conciergeHint")}
          action={t("conciergeAction")}
        />
      </section>

      <section className="px-6 pb-24">
        <Reveal>
          <div className="border-border bg-surface relative mx-auto max-w-3xl overflow-hidden rounded-lg border p-12 text-center sm:p-16">
            <div
              aria-hidden
              className="anim-keep pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
                opacity: 0.22,
                animation: "glow-drift 9s ease-in-out infinite",
              }}
            />
            <div className="relative">
              <p className="label-caps text-link">{t("ctaEyebrow")}</p>
              <h2 className="text-h1 text-text mt-3 font-serif">{t("ctaTitle")}</h2>
              <p className="text-body-lg text-text-muted mx-auto mt-4 max-w-md">{t("ctaBody")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/sign-up">
                  <Button size="lg" className={CTA}>
                    Start free
                    <Icon
                      icon={ArrowRightIcon}
                      size={16}
                      className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="ghost" className={CTA}>
                    Explore the live demo
                  </Button>
                </Link>
              </div>
              <p className="text-small text-text-muted mt-5">{t("ctaNote")}</p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
