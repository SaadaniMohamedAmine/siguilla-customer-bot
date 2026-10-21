import { getTranslations } from "next-intl/server";

// Décalage : la page démarre sous le splash / loader de navigation (~0,8 à 1 s). Volontairement court : la question tapée
// est le plus grand élément du hero, donc le LCP (Lighthouse) arrive à BASE + 1700 ms.
const BASE = 100;
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const fade = (ms: number) => ({ animation: `mock-fade 600ms var(--ease-lux) ${ms + BASE}ms both` }) as React.CSSProperties;

/** Mock du widget : la conversation se joue seule (chronologie 100 % CSS, sans JS). */
export async function HeroWidgetMock() {
  const t = await getTranslations("HomeVisuals");
  return (
    <div
      className="hero-in anim-keep border-border overflow-hidden rounded-lg border shadow-[var(--shadow-lift)]"
      style={at(350)}
    >
      <div className="border-border bg-surface flex items-center gap-2 border-b px-4 py-2.5">
        <span className="bg-error/50 h-2.5 w-2.5 rounded-full" />
        <span className="bg-warning/50 h-2.5 w-2.5 rounded-full" />
        <span className="bg-success/50 h-2.5 w-2.5 rounded-full" />
        <span className="text-text-muted ml-3 font-mono text-[11px]">atelierlune.com</span>
      </div>
      <div className="relative h-[360px] bg-[#FAF6F2] p-6">
        <p className="text-[11px] tracking-[0.2em] text-[#8A2438] uppercase">{t("newSeason")}</p>
        <p className="mt-2 font-serif text-2xl text-[#1A1214]">Bougie Cuir &amp; Encens Noir</p>

        <div
          className="anim-keep absolute right-5 bottom-5 w-[280px] rounded-md border border-[#E4D6CE] bg-white shadow-[var(--shadow-lift)]"
          style={fade(1100)}
        >
          <div className="flex items-center gap-2 border-b border-[#E4D6CE] px-3 py-2">
            <span className="bg-accent text-on-accent flex h-6 w-6 items-center justify-center rounded-md font-serif text-[13px]">
              S
            </span>
            <span className="text-[13px] font-medium text-[#1A1214]">Concierge</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <p
              className="anim-keep self-end rounded-md bg-[#F4EDE8] px-2.5 py-1.5 text-[12px] text-[#1A1214]"
              style={{ animation: `mock-type 800ms steps(28, end) ${1700 + BASE}ms both` }}
            >
              {t("mockQ")}
            </p>

            <div className="relative">
              <span
                aria-hidden
                className="anim-keep absolute top-0 left-0 inline-flex items-center gap-1 rounded-md border border-[#E4D6CE] bg-white px-2.5 py-2.5"
                style={{ animation: `mock-dots 1100ms linear ${2700 + BASE}ms both` }}
              >
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="anim-keep h-1.5 w-1.5 rounded-full bg-[#8A2438]"
                    style={{ animation: `mock-dot 700ms ease-in-out ${d}ms infinite` }}
                  />
                ))}
              </span>
              <p
                className="anim-keep rounded-md border border-[#E4D6CE] bg-white px-2.5 py-1.5 text-[12px] text-[#1A1214]"
                style={fade(3800)}
              >
                {t("mockA")}
                <span
                  className="bg-accent text-on-accent anim-keep mx-[2px] inline-flex h-3.5 w-3.5 items-center justify-center rounded-full font-mono text-[9px]"
                  style={{ animation: `mock-stamp 500ms cubic-bezier(0.2, 0.9, 0.3, 1.2) ${4300 + BASE}ms both` }}
                >
                  1
                </span>
              </p>
            </div>

            <p className="anim-keep border-t border-[#E4D6CE] pt-2 text-[10px] text-[#6B5A5D]" style={fade(4600)}>
              {t("mockSealed", { shipping: t("shipping") })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
