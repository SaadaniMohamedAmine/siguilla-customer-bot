"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const MAX_MS = 10000;
const SHOW_DELAY_MS = 80;

/** Loader (4 barres) affiché pendant le passage d'une page à l'autre ; invisible si la navigation est rapide. */
export function NavigationLoader() {
  const pathname = usePathname();
  // Chemin d'où part la navigation en cours ; le loader est actif tant qu'on n'a pas quitté ce chemin.
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setFrom(location.pathname);
    };
    // Phase de capture : le <Link> de Next appelle preventDefault() et gère le clic lui-même.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (from === null) return;
    const id = setTimeout(() => setFrom(null), MAX_MS);
    return () => clearTimeout(id);
  }, [from]);

  if (from === null || from !== pathname) return null;

  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-bg/70 pointer-events-none fixed inset-0 z-[2147483100] flex items-center justify-center backdrop-blur-[2px]"
      style={{ animation: `loader-fade-in 200ms ease-out ${SHOW_DELAY_MS}ms both` }}
    >
      <div className="flex h-[44px] items-end gap-1.5" aria-hidden>
        {[0, 0.1, 0.2, 0.3].map((delay) => (
          <span
            key={delay}
            className="bg-accent w-4 rounded-[5px]"
            style={{ height: 8, animation: `wave-bar 1s ease-in-out ${delay}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
