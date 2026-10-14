import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/marketing/pricing-cards";

export const metadata: Metadata = { title: "Pricing" };

const FAQ = [
  {
    q: "How do citations work?",
    a: "Every answer is grounded in the sources you connected. Each sentence that uses a source gets a numbered seal linking back to the exact page or URL.",
  },
  {
    q: "What happens when the answer isn't in my docs?",
    a: "Your agent declines rather than guessing, and offers to bring in a human from your team.",
  },
  {
    q: "Which sources can I connect?",
    a: "PDFs, websites up to 100 pages per site, and Notion workspaces (Pro and Team).",
  },
  { q: "Can I remove the “Sealed by Sigilla” badge?", a: "Yes, on Pro and Team." },
  {
    q: "Is this a real product?",
    a: "Sigilla is a portfolio project. Payments run in Stripe test mode; no real charges.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-h1 text-text font-serif">Simple plans. Exceptional answers.</h1>
        <p className="text-body-lg text-text-muted mt-3">Ground every answer in your documentation.</p>
        <p className="border-border bg-surface-raised text-small text-text-muted mt-4 inline-block rounded-sm border px-3 py-1.5 font-mono">
          Demo mode — payments use Stripe test mode. Card: 4242 4242 4242 4242
        </p>
      </div>

      <PricingCards />

      <div className="border-border bg-surface mt-16 rounded-md border p-8 text-center">
        <p className="text-h3 text-text font-serif">How answers stay honest</p>
        <p className="text-body text-text-muted mt-2">
          Below a similarity threshold you control, your agent declines to answer and offers a human instead.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-h2 text-text font-serif">Frequently asked questions</h2>
        <div className="divide-border border-border mt-6 flex flex-col divide-y border-t">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="text-body-lg text-text cursor-pointer list-none marker:content-none">
                {item.q}
              </summary>
              <p className="text-body text-text-muted mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link href="/docs">
          <Button variant="ghost">Read the docs</Button>
        </Link>
      </div>
    </div>
  );
}
