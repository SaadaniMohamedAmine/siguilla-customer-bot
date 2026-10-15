"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/ui/wordmark";

const MIN_MS = 1000;
const FADE_MS = 500;

/** Écran de chargement affiché au chargement / rechargement complet de la page (pas à la navigation interne). */
export function SplashScreen() {
  const t = useTranslations("Splash");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    if (!loaded) window.addEventListener("load", onLoad, { once: true });

    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      // Progression asymptotique tant que la page n'est pas chargée, puis finit à 100 %.
      const target = loaded && elapsed >= MIN_MS ? 100 : Math.min(90, (elapsed / MIN_MS) * 90);
      setProgress((p) => (p >= target ? target : Math.min(target, p + Math.max(0.6, (target - p) * 0.12))));
      if (loaded && elapsed >= MIN_MS) {
        setProgress(100);
        setPhase("leaving");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    // reduced motion : la boucle finit tout de suite dès que la page est chargée
    raf = requestAnimationFrame(reduced ? (now) => tick(now + MIN_MS) : tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const id = setTimeout(() => setPhase("done"), FADE_MS + 150);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === "done") return null;
  const pct = Math.round(progress);

  return (
    <div
      data-splash
      role="status"
      aria-live="polite"
      aria-label={t("loading")}
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center bg-bg transition-opacity ease-[var(--ease-lux)] ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms`, transitionDelay: phase === "leaving" ? "150ms" : "0ms" }}
    >
      <div className="flex w-72 flex-col items-center" style={{ animation: "splash-rise 600ms var(--ease-lux) both" }}>
        <div className="relative flex size-[260px] items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--tint) 0%, transparent 65%)",
              animation: "splash-pulse 2.4s ease-in-out infinite",
            }}
          />
          <span
            aria-hidden
            className="relative flex size-[76px] items-center justify-center rounded-lg border border-border bg-surface-raised shadow-[var(--shadow-lift)]"
          >
            <span className="font-serif text-[34px] leading-none text-link">S</span>
          </span>
        </div>
        <Wordmark size="lg" className="-mt-12 text-link" />
        <p className="mt-3 text-center font-mono text-[9px] tracking-[0.2em] text-text-muted uppercase">{t("tagline")}</p>
        <div className="mt-6 h-[2px] w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex w-full justify-between font-mono text-[9px] tracking-[0.15em] text-text-muted uppercase">
          <span>{t("loading")}</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}
