import Link from "next/link";
import Script from "next/script";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDemoPages, getDemoPageTitle, getDemoContent, getDemoBotKey } from "@/lib/demo-sites";
import { DemoBanner } from "@/components/marketing/demo-banner";

export const metadata: Metadata = { title: "Atelier Lune", robots: { index: false, follow: false } };

function CandleIllustration() {
  return (
    <svg viewBox="0 0 220 260" width="100%" height="100%" role="img" aria-label="Bougie Atelier Lune">
      <ellipse cx="110" cy="236" rx="70" ry="14" fill="#1A1214" opacity="0.08" />
      <rect x="55" y="70" width="110" height="150" rx="6" fill="#231A1C" />
      <rect x="55" y="70" width="110" height="150" rx="6" fill="none" stroke="#9E2F45" strokeOpacity="0.35" />
      <rect x="64" y="92" width="92" height="40" fill="none" stroke="#D9B98C" strokeWidth="1" opacity="0.6" />
      <text
        x="110"
        y="117"
        textAnchor="middle"
        fontSize="8.5"
        fill="#D9B98C"
        fontFamily="Georgia, serif"
        letterSpacing="1.2"
      >
        CUIR &amp; ENCENS
      </text>
      <rect x="98" y="48" width="8" height="26" rx="3" fill="#E8DAC4" />
      <ellipse cx="102" cy="34" rx="22" ry="26" fill="#E8A23D" className="anim-keep" style={{ animation: "candle-glow 3s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} opacity="0.35" />
      <path d="M102 24c6 8 6 14 0 20-6-6-6-12 0-20z" fill="#E8A23D" className="anim-keep" style={{ animation: "flicker 2.4s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "50% 100%" }} />
      <path d="M102 30c3 5 3 8 0 11-3-3-3-6 0-11z" fill="#FCE2A1" className="anim-keep" style={{ animation: "flicker 1.8s ease-in-out infinite reverse", transformBox: "fill-box", transformOrigin: "50% 100%" }} />
    </svg>
  );
}

function Header() {
  return (
    <header
      className="flex items-center justify-between px-8 py-6"
      style={{ borderBottom: "1px solid #E4D6CE" }}
    >
      <Link href="/atelier-lune" className="text-sm font-semibold tracking-[0.25em]">
        ATELIER LUNE
      </Link>
      <nav className="flex gap-6 text-sm" style={{ color: "#6B5A5D" }}>
        <Link href="/atelier-lune/shipping" className="link-draw anim-keep">Shipping</Link>
        <Link href="/atelier-lune/returns" className="link-draw anim-keep">Returns</Link>
        <Link href="/atelier-lune/faq" className="link-draw anim-keep">FAQ</Link>
      </nav>
    </header>
  );
}

export default async function AtelierLunePage({ params }: PageProps<"/atelier-lune/[[...slug]]">) {
  const { slug } = await params;
  const page = slug?.[0];
  const publicKey = await getDemoBotKey("atelier-lune");

  return (
    <div
      style={{ background: "#FAF6F2", color: "#1A1214", minHeight: "100vh", fontFamily: "Georgia, serif" }}
    >
      <DemoBanner dark />
      <Header />

      {!page ? (
        <main className="mx-auto grid max-w-4xl gap-10 px-8 py-16 md:grid-cols-2">
          <div className="hero-in anim-keep mx-auto aspect-square w-full max-w-sm" style={{ "--d": "0ms" } as React.CSSProperties}>
            <CandleIllustration />
          </div>
          <div>
            <p className="hero-in anim-keep text-xs tracking-[0.2em] uppercase" style={{ color: "#8A2438", "--d": "150ms" } as React.CSSProperties}>
              New season
            </p>
            <h1 className="hero-in anim-keep mt-2 text-3xl" style={{ lineHeight: 1.2, "--d": "250ms" } as React.CSSProperties}>
              Bougie Cuir &amp; Encens Noir
            </h1>
            <p className="hero-in anim-keep mt-4 text-lg" style={{ "--d": "350ms" } as React.CSSProperties}>
              145 CHF / 135 €
            </p>
            <p className="hero-in anim-keep mt-4 text-sm" style={{ color: "#6B5A5D", lineHeight: 1.7, "--d": "450ms" } as React.CSSProperties}>
              Rapeseed and beeswax blend, cotton wick, 60-hour burn time. Notes of patinated leather, black
              incense and sandalwood.
            </p>
            <button
              type="button"
              className="hero-in anim-keep mt-6 rounded-sm px-6 py-3 text-sm transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
              style={{ background: "#9E2F45", color: "#F3ECE6", "--d": "550ms" } as React.CSSProperties}
            >
              Add to cart
            </button>
          </div>
        </main>
      ) : (
        (() => {
          const content = getDemoContent("atelier-lune", page);
          if (!content) notFound();
          return (
            <main className="mx-auto max-w-2xl px-8 py-16">
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "#8A2438" }}>
                {getDemoPageTitle("atelier-lune", page)}
              </p>
              <article className="mt-4 text-sm" style={{ color: "#3A2C2E", lineHeight: 1.8 }}>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  components={{
                    h1: (p) => <h1 className="mt-6 mb-2 text-2xl" {...p} />,
                    h2: (p) => <h2 className="mt-6 mb-2 text-xl" {...p} />,
                    p: (p) => <p className="mt-3" {...p} />,
                    ul: (p) => <ul className="mt-3 ml-5 list-disc" {...p} />,
                    strong: (p) => <strong style={{ color: "#1A1214" }} {...p} />,
                  }}
                >
                  {content}
                </Markdown>
              </article>
              <div className="mt-10 flex flex-wrap gap-4 text-sm" style={{ color: "#8A2438" }}>
                {getDemoPages("atelier-lune").map((p) => (
                  <Link key={p.slug} href={`/atelier-lune/${p.slug}`}>
                    {p.title}
                  </Link>
                ))}
              </div>
            </main>
          );
        })()
      )}

      {publicKey ? (
        <Script src="/widget/v1.js" data-bot={publicKey} strategy="afterInteractive" />
      ) : (
        <p className="px-8 pb-10 text-center text-xs" style={{ color: "#B08A8A" }}>
          Demo agent not seeded yet — run the seed script to see the widget here.
        </p>
      )}
    </div>
  );
}
