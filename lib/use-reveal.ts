"use client";
import * as React from "react";

/** Fade + translateY au scroll, désactivé si `prefers-reduced-motion`. Retourne [ref, className, style]. */
export function useReveal<T extends HTMLElement>(): [React.RefObject<T | null>, string, React.CSSProperties] {
  const ref = React.useRef<T>(null);
  const [visible, setVisible] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const className = visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2";
  const style: React.CSSProperties = {
    transition: "opacity 400ms var(--ease-lux), transform 400ms var(--ease-lux)",
  };
  return [ref, className, style];
}
