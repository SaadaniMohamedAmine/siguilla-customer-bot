export function HeroWidgetMock() {
  return (
    <div className="border-border overflow-hidden rounded-lg border shadow-[var(--shadow-lift)]">
      <div className="border-border bg-surface flex items-center gap-2 border-b px-4 py-2.5">
        <span className="bg-error/50 h-2.5 w-2.5 rounded-full" />
        <span className="bg-warning/50 h-2.5 w-2.5 rounded-full" />
        <span className="bg-success/50 h-2.5 w-2.5 rounded-full" />
        <span className="text-text-muted ml-3 font-mono text-[11px]">atelierlune.com</span>
      </div>
      <div className="relative h-[360px] bg-[#FAF6F2] p-6">
        <p className="text-[11px] tracking-[0.2em] text-[#8A2438] uppercase">New season</p>
        <p className="mt-2 font-serif text-2xl text-[#1A1214]">Bougie Cuir &amp; Encens Noir</p>

        <div className="absolute right-5 bottom-5 w-[280px] rounded-md border border-[#E4D6CE] bg-white shadow-[var(--shadow-lift)]">
          <div className="flex items-center gap-2 border-b border-[#E4D6CE] px-3 py-2">
            <span className="bg-accent text-on-accent flex h-6 w-6 items-center justify-center rounded-md font-serif text-[13px]">
              S
            </span>
            <span className="text-[13px] font-medium text-[#1A1214]">Concierge</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <p className="self-end rounded-md bg-[#F4EDE8] px-2.5 py-1.5 text-[12px] text-[#1A1214]">
              Do your candles ship to Switzerland?
            </p>
            <p className="rounded-md border border-[#E4D6CE] bg-white px-2.5 py-1.5 text-[12px] text-[#1A1214]">
              Yes — 3–5 business days, duties and VAT calculated at checkout
              <span className="bg-accent text-on-accent mx-[2px] inline-flex h-3.5 w-3.5 items-center justify-center rounded-full font-mono text-[9px]">
                1
              </span>
            </p>
            <p className="border-t border-[#E4D6CE] pt-2 text-[10px] text-[#6B5A5D]">
              Sealed by 2 sources — Shipping Policy · FAQ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
