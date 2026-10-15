"use client";
import * as React from "react";

/** Fade + translateY au scroll, avec décalage optionnel (ms). Retourne [ref, className, style]. */
export function useReveal<T extends HTMLElement>(delay = 0): [React.RefObject<T | null>, string, React.CSSProperties] {
  const ref = React.useRef<T>(null);
  const [visible, setVisible] = React.useState(false);

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

  const className = visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5";
  const style: React.CSSProperties = {
    transition: "opacity 700ms var(--ease-lux), transform 700ms var(--ease-lux)",
    transitionDelay: visible ? `${delay}ms` : "0ms",
  };
  return [ref, className, style];
}
