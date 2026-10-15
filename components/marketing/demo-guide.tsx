"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ArrowRightIcon, CloseIcon, SealIcon } from "@/lib/icons";
import { openConcierge } from "@/components/marketing/promise-section";

function shadowRoot(): ShadowRoot | null {
  for (const h of document.querySelectorAll<HTMLElement>("body > div")) {
    if (h.style.cssText.includes("2147483000")) return h.shadowRoot;
  }
  return null;
}

/** Ouvre le concierge (s'il est fermé), saisit la question et l'envoie — pour une démo en un clic. */
export function askConcierge(question: string) {
  const root = shadowRoot();
  if (!root) return;
  if (!root.querySelector(".p:not(.out)")) openConcierge();
  let tries = 0;
  const timer = setInterval(() => {
    const r = shadowRoot();
    const input = r?.querySelector<HTMLTextAreaElement>(".p:not(.out) textarea");
    const send = r?.querySelector<HTMLButtonElement>(".p:not(.out) .sd");
    if (input && send) {
      clearInterval(timer);
      input.value = question;
      send.click();
    } else if (++tries > 20) clearInterval(timer);
  }, 100);
}

/** Bouton qui ouvre le concierge, ou lui pose directement une question. */
export function AskButton({
  question,
  className,
  style,
  children,
}: {
  question?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => (question ? askConcierge(question) : openConcierge())}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

/**
 * Guide de démo aux couleurs de Sigilla : une carte flottante propose des questions à poser au concierge
 * (un clic ouvre le widget et envoie la question), avec un anneau qui pulse autour du lanceur.
 */
export function DemoGuide({ title, hint, questions }: { title: string; hint: string; questions: string[] }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let skip = false;
    try {
      skip = sessionStorage.getItem("demo-guide-dismissed") === "1";
    } catch {
      /* stockage indisponible */
    }
    const id = setTimeout(() => {
      if (skip) setDismissed(true);
      else setVisible(true);
    }, 2500);
    return () => clearTimeout(id);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("demo-guide-dismissed", "1");
    } catch {
      /* stockage indisponible */
    }
  }

  const show = visible && !dismissed;
  return (
    <>
      {show ? (
        <span
          aria-hidden
          className="anim-keep pointer-events-none fixed right-5 bottom-5 size-14 rounded-full border-2 border-[#9E2F45]"
          style={{ zIndex: 2147482900, animation: "ping-soft 2s ease-out infinite" }}
        />
      ) : null}
      <aside
        aria-label={title}
        className="anim-keep fixed right-5 bottom-24 w-[min(88vw,320px)] rounded-lg border border-[#2E2225] bg-[#171113] p-4 text-[#F3ECE6] shadow-[0_16px_40px_-12px_rgb(0_0_0/0.6)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          zIndex: 2147482950,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(12px)",
          pointerEvents: show ? "auto" : "none",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
            <Icon icon={SealIcon} size={16} className="text-[#E3B3BA]" />
            {title}
          </p>
          <button type="button" onClick={dismiss} aria-label="Close" className="text-[#A8999A] hover:text-[#F3ECE6]">
            <Icon icon={CloseIcon} size={16} />
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-[#A8999A]">{hint}</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {questions.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  askConcierge(q);
                }}
                className="anim-keep group flex w-full items-center justify-between gap-2 rounded-md border border-[#2E2225] bg-[#201719] px-3 py-2 text-left text-[13px] transition-colors duration-200 hover:border-[#9E2F45]"
              >
                {q}
                <Icon
                  icon={ArrowRightIcon}
                  size={14}
                  className="anim-keep shrink-0 text-[#E3B3BA] transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
