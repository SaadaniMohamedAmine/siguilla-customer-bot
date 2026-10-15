"use client";
import { useEffect, useRef, useState } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/icon";

/** Carte de feature : lift + bordure accent au survol, reflet rouge qui suit la souris, visuel aligné en bas. */
export function FeatureCard({
  title,
  body,
  icon,
  visual,
}: {
  title: string;
  body: string;
  icon: IconSvgElement;
  visual: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div
      ref={ref}
      data-inview={inView}
      className="anim-keep group border-border bg-bg hover:border-accent relative flex h-full cursor-pointer flex-col overflow-hidden rounded-md border p-6 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <span
        aria-hidden
        className="anim-keep pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)",
        }}
      />
      <Icon
        icon={icon}
        size={22}
        className="anim-keep text-link relative opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />
      <h3 className="text-h3 text-text relative mt-3 font-serif">{title}</h3>
      <p className="text-body text-text-muted relative mt-2 mb-5">{body}</p>
      <div className="relative mt-auto flex flex-col">{visual}</div>
    </div>
  );
}
