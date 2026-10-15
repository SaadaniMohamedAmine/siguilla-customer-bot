import { Icon } from "@/components/ui/icon";
import { SealIcon } from "@/lib/icons";

/** Mini-visuels CSS des cartes de features (contenu de démo). `group-data-[inview=true]` = carte visible à l'écran. */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="border-border bg-surface relative mt-auto flex h-[112px] flex-col justify-center gap-2 overflow-hidden rounded-sm border p-3.5"
    >
      {children}
    </div>
  );
}

const Seal = ({ n }: { n: number }) => (
  <span className="bg-accent text-on-accent mx-[2px] inline-flex size-3.5 items-center justify-center rounded-full align-middle font-mono text-[9px]">
    {n}
  </span>
);

export function CitedVisual() {
  return (
    <Frame>
      <p className="text-text text-[12px] leading-5">
        Delivery takes 3–5 days
        <Seal n={1} /> and duties are added at checkout
        <Seal n={2} />.
      </p>
      <div className="text-text-muted flex items-center gap-1.5 font-mono text-[10px]">
        <Icon icon={SealIcon} size={12} className="text-link" />
        <span className="truncate">1 Shipping Policy · 2 FAQ</span>
      </div>
    </Frame>
  );
}

export function HandoffFeatureVisual() {
  return (
    <Frame>
      <p className="border-border bg-bg text-text-muted w-fit rounded-sm border px-2.5 py-1.5 text-[12px]">
        I can&apos;t find that in your docs.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-warning border-warning/40 rounded-full border px-2 py-0.5 text-[9px] tracking-wide uppercase">
          Handoff
        </span>
        <span className="text-text-muted text-[11px]">Bringing in your team…</span>
      </div>
    </Frame>
  );
}

export function AnalyticsVisual() {
  const bars = [35, 55, 42, 70, 50, 85, 62];
  return (
    <Frame>
      <div className="flex h-[52px] items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`anim-keep scale-y-0 flex-1 origin-bottom rounded-[2px] transition-transform duration-700 ease-[var(--ease-lux)] group-data-[inview=true]:scale-y-100 ${
              i === 5 ? "bg-accent" : "bg-border"
            }`}
            style={{ height: `${h}%`, transitionDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <p className="text-text-muted font-mono text-[10px]">12 unanswered · 94% resolved</p>
    </Frame>
  );
}

export function SizeVisual() {
  return (
    <Frame>
      <div className="text-text flex items-baseline justify-between font-mono text-[11px]">
        <span>4.5 KB</span>
        <span className="text-text-muted">limit 5 KB</span>
      </div>
      <div className="bg-border h-1.5 overflow-hidden rounded-full">
        <span className="anim-keep bg-accent block h-full w-0 rounded-full transition-[width] duration-[1400ms] ease-[var(--ease-lux)] group-data-[inview=true]:w-[90%]" />
      </div>
      <p className="text-text-muted font-mono text-[10px]">0 dependencies · isolated in Shadow DOM</p>
    </Frame>
  );
}
