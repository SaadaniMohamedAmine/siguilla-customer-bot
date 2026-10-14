import { Wordmark } from "@/components/ui/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-surface p-12 lg:flex lg:w-[55%]">
        <Wordmark size="md" />
        <div className="max-w-xl">
          <p className="font-serif text-[64px] leading-[1.05] text-text">
            &ldquo;Every answer, sealed by its source.&rdquo;
          </p>
          <p className="mt-6 text-body-lg text-text-muted">
            No-code AI support agents, trained on your docs.
          </p>
        </div>
        <svg
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 opacity-60"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
        >
          <circle cx="100" cy="100" r="99" stroke="var(--border)" />
          <circle cx="100" cy="100" r="70" stroke="var(--border)" />
        </svg>
      </div>
      <main className="flex flex-1 items-center justify-center p-6 lg:w-[45%]">
        <div className="w-full max-w-[420px] lg:hidden">
          <Wordmark size="md" className="mb-8 block text-center" />
        </div>
        {children}
      </main>
    </div>
  );
}
