import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = { title: "Atelier Lune", robots: { index: false, follow: false } };

function CandleIllustration() {
  return (
    <svg viewBox="0 0 220 260" width="100%" height="100%" role="img" aria-label="Bougie Atelier Lune">
      <ellipse cx="110" cy="236" rx="70" ry="14" fill="#1A1214" opacity="0.08" />
      <rect x="55" y="70" width="110" height="150" rx="6" fill="#231A1C" />
      <rect x="55" y="70" width="110" height="150" rx="6" fill="none" stroke="#9E2F45" strokeOpacity="0.35" />
      <rect x="72" y="92" width="76" height="40" fill="none" stroke="#D9B98C" strokeWidth="1" opacity="0.6" />
      <text
        x="110"
        y="117"
        textAnchor="middle"
        fontSize="11"
        fill="#D9B98C"
        fontFamily="Georgia, serif"
        letterSpacing="2"
      >
        CUIR &amp; ENCENS
      </text>
      <rect x="98" y="48" width="8" height="26" rx="3" fill="#E8DAC4" />
      <path d="M102 24c6 8 6 14 0 20-6-6-6-12 0-20z" fill="#E8A23D" />
      <path d="M102 30c3 5 3 8 0 11-3-3-3-6 0-11z" fill="#FCE2A1" />
    </svg>
  );
}

export default function AtelierLunePage() {
  const publicKey = process.env.NEXT_PUBLIC_LANDING_BOT_KEY;

  return (
    <div
      style={{ background: "#FAF6F2", color: "#1A1214", minHeight: "100vh", fontFamily: "Georgia, serif" }}
    >
      <div
        style={{ background: "#231A1C", color: "#E8DAC4" }}
        className="px-4 py-2 text-center text-xs tracking-wide"
      >
        Illustrative brand — Sigilla demo
      </div>

      <header
        className="flex items-center justify-between px-8 py-6"
        style={{ borderBottom: "1px solid #E4D6CE" }}
      >
        <span className="text-sm font-semibold tracking-[0.25em]">ATELIER LUNE</span>
        <nav className="flex gap-6 text-sm" style={{ color: "#6B5A5D" }}>
          <span>Candles</span>
          <span>Fragrances</span>
          <span>Shipping</span>
        </nav>
      </header>

      <main className="mx-auto grid max-w-4xl gap-10 px-8 py-16 md:grid-cols-2">
        <div className="mx-auto aspect-square w-full max-w-sm">
          <CandleIllustration />
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "#8A2438" }}>
            New season
          </p>
          <h1 className="mt-2 text-3xl" style={{ lineHeight: 1.2 }}>
            Bougie Cuir &amp; Encens Noir
          </h1>
          <p className="mt-4 text-lg">CHF 145</p>
          <p className="mt-4 text-sm" style={{ color: "#6B5A5D", lineHeight: 1.7 }}>
            Cire de soja, mèche en coton, 60 heures de combustion. Notes de cuir patiné, d&apos;encens noir et
            de bois de santal — une évocation feutrée des ateliers genevois.
          </p>
          <button
            type="button"
            className="mt-6 rounded-sm px-6 py-3 text-sm"
            style={{ background: "#9E2F45", color: "#F3ECE6" }}
          >
            Add to cart
          </button>
        </div>
      </main>

      {publicKey ? (
        <Script src="/widget/v1.js" data-bot={publicKey} strategy="afterInteractive" />
      ) : (
        <p className="px-8 pb-10 text-center text-xs" style={{ color: "#B08A8A" }}>
          Set NEXT_PUBLIC_LANDING_BOT_KEY (or publish a live agent) to preview the widget here.
        </p>
      )}
    </div>
  );
}
