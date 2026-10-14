import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-h1 text-text font-serif">Terms of Service</h1>
      <p className="text-small text-text-muted mt-2">Last updated 2026.</p>

      <div className="text-body text-text-muted mt-10 flex flex-col gap-8">
        <section>
          <h2 className="text-h3 text-text font-serif">A portfolio project</h2>
          <p className="mt-2">
            Sigilla is a demonstration project. It is provided &ldquo;as is&rdquo;, with no uptime guarantee
            or service-level agreement. Payments run through Stripe in test mode — no real charges are ever
            made.
          </p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">Acceptable use</h2>
          <p className="mt-2">
            Don&apos;t upload or crawl content that is illegal, infringing, or that you don&apos;t have the
            right to use.
          </p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">Plan limits</h2>
          <p className="mt-2">
            Each plan has limits on agents, sources, crawled pages and monthly messages — see{" "}
            <a href="/pricing" className="text-link hover:underline">
              Pricing
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">Changes</h2>
          <p className="mt-2">These terms may be updated from time to time.</p>
        </section>
      </div>
    </div>
  );
}
