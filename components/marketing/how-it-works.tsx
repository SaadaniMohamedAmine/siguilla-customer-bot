"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ConnectVisual, EmbedVisual, HandoffVisual, ShapeVisual } from "@/components/marketing/step-visuals";

const VISUALS = [<ConnectVisual key="1" />, <ShapeVisual key="2" />, <EmbedVisual key="3" />, <HandoffVisual key="4" />];

const STEP_MS = 700;

/** Trois étapes reliées par une ligne qui se dessine au scroll ; chaque étape s'allume quand la ligne l'atteint. */
export function HowItWorks({ eyebrow, title }: { eyebrow: string; title: string }) {
  const t = useTranslations("Home");
  const STEPS = (t.raw("steps") as { title: string; body: string }[]).map((st, i) => ({
    ...st,
    n: String(i + 1).padStart(2, "0"),
    visual: VISUALS[i],
  }));
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <p className="label-caps text-link">{eyebrow}</p>
        <h2 className="text-h1 text-text mx-auto mt-3 max-w-2xl font-serif">{title}</h2>
      </div>

      <div ref={ref} className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-4">
        {STEPS.map((s, i) => {
          const lit = visible;
          const delay = `${i * STEP_MS}ms`;
          return (
            <div key={s.n} className="relative min-w-0 pl-7 lg:pt-7 lg:pl-0">
              <span
                aria-hidden
                className={cn(
                  "anim-keep absolute top-3 left-0 size-[9px] rounded-full border transition-[background-color,border-color,box-shadow] duration-500 lg:top-0",
                  lit ? "border-accent bg-accent shadow-[0_0_0_4px_var(--tint)]" : "border-border bg-bg",
                )}
                style={{ transitionDelay: lit ? delay : "0ms" }}
              />
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="bg-border absolute top-6 left-[4px] h-[calc(100%+2.5rem-15px)] w-px lg:top-[4px] lg:left-[13px] lg:h-px lg:w-[calc(100%+2.5rem-17px)]"
                >
                  <span
                    className={cn(
                      "anim-keep bg-accent absolute inset-0 origin-top transition-transform ease-linear lg:origin-left",
                      lit ? "scale-y-100 lg:scale-x-100" : "scale-y-0 lg:scale-y-100 lg:scale-x-0",
                    )}
                    style={{ transitionDuration: `${STEP_MS}ms`, transitionDelay: lit ? delay : "0ms" }}
                  />
                </span>
              ) : null}

              <div
                className={cn(
                  "anim-keep flex h-full flex-col transition-[opacity,transform] duration-700 ease-[var(--ease-lux)]",
                  lit ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                )}
                style={{ transitionDelay: lit ? delay : "0ms" }}
              >
                <p className="text-link font-serif text-[40px] leading-none italic">{s.n}</p>
                <h3 className="text-h3 text-text mt-3 font-serif">{s.title}</h3>
                <p className="text-body text-text-muted mt-2 mb-5">{s.body}</p>
                {s.visual}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
