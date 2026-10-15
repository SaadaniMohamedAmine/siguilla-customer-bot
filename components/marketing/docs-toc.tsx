"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** « On this page » : surligne la section visible et affiche une fine barre de progression de lecture. */
export function DocsToc({ headings, title }: { headings: { text: string; id: string }[]; title: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => observer.observe(el));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [headings]);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed top-0 right-0 left-0 z-[41] h-0.5">
        <div className="bg-accent h-full origin-left" style={{ transform: `scaleX(${progress})` }} />
      </div>
      {headings.length > 0 ? (
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <p className="label-caps mb-3">{title}</p>
            <ul className="border-border text-small flex flex-col border-l">
              {headings.map((h) => {
                const active = h.id === activeId;
                return (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={cn(
                        "anim-keep -ml-px block border-l py-1 pl-3 transition-colors duration-200",
                        active
                          ? "border-accent text-text"
                          : "text-text-muted hover:text-text hover:border-text-muted border-transparent",
                      )}
                    >
                      {h.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      ) : null}
    </>
  );
}
