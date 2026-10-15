import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon } from "@/lib/icons";
import { HeroWidgetMock } from "@/components/marketing/hero-widget-mock";

const CTA = "group anim-keep hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]";
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const BRANDS = ["Atelier Lune", "Ledgerline", "Maison Verdant", "Aurelia Haute", "Vendôme & Cie"];

const STEPS = [
  {
    n: "01",
    title: "Connect your sources",
    body: "Upload PDFs, crawl your website or connect Notion. Sigilla reads, splits and indexes everything.",
  },
  {
    n: "02",
    title: "Shape your agent",
    body: "Give it a name, a tone and boundaries. Choose your colors and welcome message.",
  },
  {
    n: "03",
    title: "Embed in one line",
    body: "Paste one script tag. Under 5 KB, isolated from your styles.",
  },
];

const FEATURES = [
  { title: "Cited answers", body: "Every sentence points to the page or URL it came from." },
  {
    title: "Human handoff",
    body: "When the answer isn't in your docs, your agent says so and brings in your team.",
  },
  {
    title: "Conversation analytics",
    body: "See what customers ask, what's answered, and what's missing from your docs.",
  },
  { title: "Under 5 KB", body: "A dependency-free widget that won't slow your site down." },
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

export default function LandingPage() {
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

      <section className="border-border border-y py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
          <p className="text-small text-text-muted w-full text-center sm:w-auto">Built for houses like</p>
          {BRANDS.map((b) => (
            <span key={b} className="text-body-lg text-text-muted font-serif">
              {b}
            </span>
          ))}
        </div>
        <p className="text-small text-text-muted mt-3 text-center">Illustrative brands</p>
      </section>

      <section id="how" className="px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <p className="text-link font-serif text-[40px] italic">{s.n}</p>
              <h2 className="text-h3 text-text mt-2 font-serif">{s.title}</h2>
              <p className="text-body text-text-muted mt-2">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-surface px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="h-full">
              <FeatureCard title={f.title} body={f.body} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <Reveal>
          <p className="text-h2 text-text mx-auto max-w-2xl font-serif">
            &ldquo;Every answer, sealed by its source.&rdquo;
          </p>
          <p className="label-caps text-text-muted mt-4">THE SIGILLA PROMISE</p>
        </Reveal>
      </section>

      <section className="px-6 py-16 text-center">
        <p className="text-body text-text-muted">Ask the concierge in the corner anything about Sigilla.</p>
      </section>

      <section className="px-6 pb-24">
        <div className="border-border bg-surface mx-auto max-w-3xl rounded-md border p-12 text-center">
          <h2 className="text-h1 text-text font-serif">Your first agent is a few minutes away.</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
      </section>
    </div>
  );
}
