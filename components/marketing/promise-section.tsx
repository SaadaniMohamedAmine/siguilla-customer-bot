"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon, SealIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Ouvre le widget de la page en cliquant son lanceur (shadow DOM ouvert) ; sans effet s'il n'est pas monté. */
function openConcierge() {
  const hosts = document.querySelectorAll<HTMLElement>("body > div");
  for (const h of hosts) {
    if (!h.style.cssText.includes("2147483000")) continue;
    h.shadowRoot?.querySelector<HTMLButtonElement>("button.l")?.click();
    return;
  }
}

/** Citation révélée mot par mot au scroll, suivie d'un bouton qui ouvre le concierge. */
export function PromiseSection({
  quote,
  label,
  hint,
  action,
}: {
  quote: string;
  label: string;
  hint: string;
  action: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const words = quote.split(" ");
  const total = words.length * 90 + 500;

  return (
    <div ref={ref} className="mx-auto max-w-3xl text-center">
      <span
        aria-hidden
        className={cn(
          "anim-keep border-border bg-surface text-link mx-auto flex size-12 items-center justify-center rounded-full border transition-[opacity,transform] duration-700 ease-[var(--ease-lux)]",
          visible ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        <Icon icon={SealIcon} size={22} />
      </span>

      <p className="text-h1 text-text mt-8 font-serif" aria-label={quote}>
        <span aria-hidden>&ldquo;</span>
        {words.map((w, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "anim-keep inline-block transition-[opacity,transform,filter] duration-700 ease-[var(--ease-lux)]",
              visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-[6px]",
            )}
            style={{ transitionDelay: visible ? `${300 + i * 90}ms` : "0ms", marginRight: "0.25em" }}
          >
            {w}
          </span>
        ))}
        <span aria-hidden>&rdquo;</span>
      </p>

      <p
        className={cn(
          "label-caps text-text-muted anim-keep mt-5 transition-opacity duration-700",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDelay: visible ? `${total}ms` : "0ms" }}
      >
        {label}
      </p>

      <div
        className={cn(
          "anim-keep mt-12 flex flex-col items-center gap-3 transition-[opacity,transform] duration-700 ease-[var(--ease-lux)]",
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
        style={{ transitionDelay: visible ? `${total + 200}ms` : "0ms" }}
      >
        <p className="text-body text-text-muted">{hint}</p>
        <button
          type="button"
          onClick={openConcierge}
          className="anim-keep group border-border bg-surface text-text hover:border-accent text-body inline-flex h-10 items-center gap-2 rounded-full border px-5 font-medium transition-[border-color,transform] duration-200 hover:-translate-y-0.5"
        >
          <span className="relative flex size-2">
            <span className="anim-keep bg-accent absolute inline-flex size-full rounded-full opacity-60" style={{ animation: "ping-soft 1.8s ease-out infinite" }} />
            <span className="bg-accent relative inline-flex size-2 rounded-full" />
          </span>
          {action}
          <Icon icon={ArrowRightIcon} size={14} className="anim-keep rotate-45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
