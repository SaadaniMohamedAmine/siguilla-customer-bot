import Link from "next/link";
import Script from "next/script";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDemoPages, getDemoPageTitle, getDemoContent, getDemoBotKey } from "@/lib/demo-sites";
import { DemoBanner } from "@/components/marketing/demo-banner";
import { DemoGuide, AskButton } from "@/components/marketing/demo-guide";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = { title: "Atelier Lune", robots: { index: false, follow: false } };

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const COLLECTION = [
  { name: "Cuir & Encens Noir", lines: ["CUIR", "& ENCENS"], notes: "Leather · black incense · sandalwood", price: "145 CHF", burn: "60 h", jar: "#231A1C", accent: "#9E2F45" },
  { name: "Figuier Sauvage", lines: ["FIGUIER", "SAUVAGE"], notes: "Fig leaf · white tea · cedar", price: "120 CHF", burn: "55 h", jar: "#27332C", accent: "#7FA38A" },
  { name: "Ambre Doré", lines: ["AMBRE", "DORÉ"], notes: "Amber · vanilla · clove", price: "130 CHF", burn: "60 h", jar: "#3A2A1E", accent: "#D9A55B" },
  { name: "Neige de Cèdre", lines: ["NEIGE", "DE CÈDRE"], notes: "Cedarwood · frosted pine · musk", price: "125 CHF", burn: "50 h", jar: "#27303A", accent: "#9DB4C8" },
];

function Candle({
  jar = "#231A1C",
  accent = "#9E2F45",
  lines = ["CUIR", "& ENCENS"],
  glow = true,
}: {
  jar?: string;
  accent?: string;
  lines?: string[];
  glow?: boolean;
}) {
  return (
    <svg viewBox="0 0 220 260" width="100%" height="100%" role="img" aria-label="Atelier Lune candle">
      <ellipse cx="110" cy="238" rx="72" ry="13" fill="#1A1214" opacity="0.1" />
      <rect x="55" y="70" width="110" height="154" rx="8" fill={jar} />
      <rect x="55" y="70" width="110" height="154" rx="8" fill="none" stroke={accent} strokeOpacity="0.45" />
      <rect x="55" y="70" width="14" height="154" rx="6" fill="#fff" opacity="0.05" />
      <rect x="66" y="96" width="88" height="52" fill="none" stroke="#D9B98C" strokeWidth="1" opacity="0.6" />
      {lines.map((l, i) => (
        <text
          key={l}
          x="110"
          y={118 + i * 14}
          textAnchor="middle"
          fontSize="9.5"
          fill="#D9B98C"
          fontFamily="Georgia, serif"
          letterSpacing="1.6"
        >
          {l}
        </text>
      ))}
      <rect x="98" y="48" width="8" height="26" rx="3" fill="#E8DAC4" />
      {glow ? (
        <ellipse
          cx="102"
          cy="34"
          rx="24"
          ry="28"
          fill="#E8A23D"
          className="anim-keep"
          opacity="0.35"
          style={{ animation: "candle-glow 3s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }}
        />
      ) : null}
      <path
        d="M102 24c6 8 6 14 0 20-6-6-6-12 0-20z"
        fill="#E8A23D"
        className="anim-keep"
        style={{ animation: "flicker 2.4s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 100%" }}
      />
      <path
        d="M102 30c3 5 3 8 0 11-3-3-3-6 0-11z"
        fill="#FCE2A1"
        className="anim-keep"
        style={{ animation: "flicker 1.8s ease-in-out infinite reverse", transformBox: "fill-box", transformOrigin: "50% 100%" }}
      />
    </svg>
  );
}

function Header() {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 backdrop-blur-md"
      style={{ borderBottom: "1px solid #E4D6CE", background: "rgba(250,246,242,0.85)" }}
    >
      <Link href="/atelier-lune" className="text-sm font-semibold tracking-[0.3em]">
        ATELIER LUNE
      </Link>
      <nav className="flex gap-7 text-sm" style={{ color: "#6B5A5D" }}>
        <Link href="/atelier-lune/collections" className="link-draw anim-keep hover:text-[#1A1214]">
          Collections
        </Link>
        <Link href="/atelier-lune/shipping" className="link-draw anim-keep hover:text-[#1A1214]">
          Shipping
        </Link>
        <Link href="/atelier-lune/returns" className="link-draw anim-keep hover:text-[#1A1214]">
          Returns
        </Link>
        <Link href="/atelier-lune/faq" className="link-draw anim-keep hover:text-[#1A1214]">
          FAQ
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  const pages = getDemoPages("atelier-lune");
  return (
    <footer className="mt-24 px-8 py-12" style={{ background: "#1A1214", color: "#E8DAC4" }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-8">
        <div>
          <p className="text-sm font-semibold tracking-[0.3em]">ATELIER LUNE</p>
          <p className="mt-2 max-w-xs text-xs" style={{ color: "#A8999A", lineHeight: 1.7 }}>
            Hand-poured candles from our Paris atelier. Illustrative brand for the Sigilla demo.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-8 gap-y-2 text-sm" style={{ color: "#C9B9A0" }}>
          {pages.map((p) => (
            <li key={p.slug}>
              <Link href={`/atelier-lune/${p.slug}`} className="link-draw anim-keep hover:text-white">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export default async function AtelierLunePage({ params }: PageProps<"/atelier-lune/[[...slug]]">) {
  const { slug } = await params;
  const page = slug?.[0];
  const publicKey = await getDemoBotKey("atelier-lune");

  return (
    <div style={{ background: "#FAF6F2", color: "#1A1214", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      <DemoBanner />
      <Header />

      {!page ? (
        <main>
          <section
            className="relative overflow-hidden px-8 py-20"
            style={{ background: "radial-gradient(ellipse at 28% 40%, #F3E4D2 0%, #FAF6F2 62%)" }}
          >
            <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
              <div className="hero-in anim-keep mx-auto aspect-square w-full max-w-md" style={at(0)}>
                <Candle />
              </div>
              <div>
                <p className="hero-in anim-keep text-xs tracking-[0.3em] uppercase" style={{ color: "#8A2438", ...at(150) }}>
                  New season
                </p>
                <h1 className="hero-in anim-keep mt-3 text-5xl" style={{ lineHeight: 1.1, ...at(250) }}>
                  Bougie Cuir &amp; Encens Noir
                </h1>
                <div className="hero-in anim-keep mt-5 flex flex-wrap gap-2" style={at(350)}>
                  {["Leather", "Black incense", "Sandalwood"].map((n) => (
                    <span
                      key={n}
                      className="rounded-full px-3 py-1 text-xs"
                      style={{ border: "1px solid #D9B98C", color: "#6B5A5D" }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="hero-in anim-keep mt-6 text-2xl" style={at(450)}>
                  145 CHF / 135 €
                </p>
                <p className="hero-in anim-keep mt-4 text-sm" style={{ color: "#6B5A5D", lineHeight: 1.8, ...at(550) }}>
                  Rapeseed and beeswax blend, cotton wick, 60-hour burn time. Notes of patinated leather, black
                  incense and sandalwood.
                </p>
                <div className="hero-in anim-keep mt-8 flex flex-wrap gap-3" style={at(650)}>
                  <button
                    type="button"
                    className="anim-keep rounded-sm px-7 py-3.5 text-sm transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
                    style={{ background: "#9E2F45", color: "#F3ECE6" }}
                  >
                    Add to cart
                  </button>
                  <AskButton
                    className="anim-keep rounded-sm px-7 py-3.5 text-sm transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white"
                    style={{ border: "1px solid #D9B98C", color: "#1A1214" }}
                  >
                    Ask the concierge
                  </AskButton>
                </div>
                <p className="hero-in anim-keep mt-6 text-xs" style={{ color: "#8A7578", ...at(750) }}>
                  Hand-poured in Paris · Ships within 24 hours · 30-day returns
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-8 pt-20">
            <Reveal>
              <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "#8A2438" }}>
                Our collections
              </p>
              <h2 className="mt-3 text-3xl">Four signature scents</h2>
              <p className="mt-2 text-sm" style={{ color: "#6B5A5D" }}>
                Each poured in a reusable smoked-glass jar.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {COLLECTION.map((c, i) => (
                <Reveal key={c.name} delay={i * 90} className="h-full">
                  <Link
                    href="/atelier-lune/collections"
                    className="anim-keep group block h-full rounded-md p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ background: "#fff", border: "1px solid #E4D6CE" }}
                  >
                    <div className="mx-auto aspect-[4/4.4] w-4/5 transition-transform duration-500 group-hover:scale-105">
                      <Candle jar={c.jar} accent={c.accent} lines={c.lines} glow={false} />
                    </div>
                    <p className="mt-3 text-lg">{c.name}</p>
                    <p className="mt-1 text-xs" style={{ color: "#6B5A5D" }}>
                      {c.notes}
                    </p>
                    <p className="mt-3 flex items-center justify-between text-sm">
                      <span>{c.price}</span>
                      <span className="text-xs" style={{ color: "#8A2438" }}>
                        {c.burn} burn
                      </span>
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="mx-auto mt-24 grid max-w-5xl gap-10 px-8 sm:grid-cols-3">
            {[
              ["Hand-poured", "A rapeseed and beeswax blend, cotton wick, poured by hand in our Paris atelier."],
              ["Made to last", "Smoked-glass jars you can reuse, and a 60-hour burn on our signature scent."],
              ["Shipped with care", "Every order is packed by hand and ships within 24 hours on business days."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 120}>
                <p className="text-xl" style={{ color: "#8A2438" }}>
                  0{i + 1}
                </p>
                <p className="mt-2 text-lg">{t}</p>
                <p className="mt-2 text-sm" style={{ color: "#6B5A5D", lineHeight: 1.8 }}>
                  {b}
                </p>
              </Reveal>
            ))}
          </section>
        </main>
      ) : (
        (() => {
          const content = getDemoContent("atelier-lune", page);
          if (!content) notFound();
          return (
            <main className="mx-auto max-w-2xl px-8 py-16">
              <div className="page-in anim-keep">
                <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "#8A2438" }}>
                  Atelier Lune
                </p>
                <h1 className="mt-2 text-4xl">{getDemoPageTitle("atelier-lune", page)}</h1>
                <article className="mt-8 text-sm" style={{ color: "#3A2C2E", lineHeight: 1.9 }}>
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      h1: () => null,
                      h2: (p) => <h2 className="mt-8 mb-2 text-xl" {...p} />,
                      p: (p) => <p className="mt-3" {...p} />,
                      ul: (p) => <ul className="mt-3 ml-5 list-disc" {...p} />,
                      strong: (p) => <strong style={{ color: "#1A1214" }} {...p} />,
                    }}
                  >
                    {content}
                  </Markdown>
                </article>
                <div
                  className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-md p-5"
                  style={{ background: "#F3E4D2", border: "1px solid #E4D6CE" }}
                >
                  <p className="text-sm">Still have a question? Our concierge is a click away.</p>
                  <AskButton
                    className="anim-keep rounded-sm px-5 py-2.5 text-sm transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-110"
                    style={{ background: "#9E2F45", color: "#F3ECE6" }}
                  >
                    Ask the concierge
                  </AskButton>
                </div>
              </div>
            </main>
          );
        })()
      )}

      <Footer />

      {publicKey ? (
        <>
          <Script src="/widget/v1.js" data-bot={publicKey} strategy="afterInteractive" />
          <DemoGuide
            title="Try the concierge"
            hint="It answers from Atelier Lune's own pages, with sources. Pick a question:"
            questions={[
              "Do your candles ship to Switzerland?",
              "What is your return policy?",
              "How should I do the first burn?",
            ]}
          />
        </>
      ) : (
        <p className="px-8 pb-10 text-center text-xs" style={{ color: "#B08A8A" }}>
          Demo agent not seeded yet — run the seed script to see the widget here.
        </p>
      )}
    </div>
  );
}
