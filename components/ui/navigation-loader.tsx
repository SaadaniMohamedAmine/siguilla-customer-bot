"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MAX_MS = 10000;
const MIN_MS = 800;

/** Loader (4 barres) affiché pendant le passage d'une page à l'autre, au moins MIN_MS pour rester perceptible. */
export function NavigationLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const startedAt = useRef(0);
  const fromPath = useRef<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      startedAt.current = performance.now();
      fromPath.current = location.pathname;
      setActive(true);
    };
    // Phase de capture : le <Link> de Next appelle preventDefault() et gère le clic lui-même.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Arrivée sur la nouvelle page : on garde le loader jusqu'à MIN_MS écoulé depuis le clic.
  useEffect(() => {
    if (!active || pathname === fromPath.current) return;
    const wait = Math.max(0, MIN_MS - (performance.now() - startedAt.current));
    const id = setTimeout(() => setActive(false), wait);
    return () => clearTimeout(id);
  }, [pathname, active]);

  // Garde-fou si la navigation n'aboutit jamais.
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setActive(false), MAX_MS);
    return () => clearTimeout(id);
  }, [active]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-bg/70 pointer-events-none fixed inset-0 z-[2147483100] flex items-center justify-center backdrop-blur-[2px]"
      style={{ animation: `loader-fade-in 120ms ease-out both` }}
    >
      <div className="flex h-[50px] items-end gap-2.5" aria-hidden>
        {[0, 0.1, 0.2, 0.3].map((delay) => (
          <span
            key={delay}
            className="wave-bar bg-accent w-5 rounded-[5px]"
            style={{ height: 10, animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  );
}
