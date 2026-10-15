"use client";

/** Carte de feature : lift + bordure accent au survol, avec un reflet qui suit la souris. */
export function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="anim-keep group border-border bg-bg hover:border-accent relative h-full overflow-hidden rounded-md border p-6 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-lux)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
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
      <h2 className="text-h3 text-text relative font-serif">{title}</h2>
      <p className="text-body text-text-muted relative mt-2">{body}</p>
    </div>
  );
}
