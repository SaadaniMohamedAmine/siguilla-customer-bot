import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-h1 text-text font-serif">Privacy Policy</h1>
      <p className="text-small text-text-muted mt-2">Last updated 2026.</p>

      <div className="text-body text-text-muted mt-10 flex flex-col gap-8">
        <section>
          <h2 className="text-h3 text-text font-serif">What we process</h2>
          <p className="mt-2">
            Your account details (name, email), the content of the sources you upload or connect (PDFs,
            crawled pages, Notion pages), conversations your visitors have with your agents, and an optional
            email address a visitor may leave when requesting a human.
          </p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">Sub-processors</h2>
          <p className="mt-2">
            Vercel (hosting and file storage), Neon (database), Groq and Google Gemini (answer generation and
            embeddings), Stripe (payments, test mode only), and Notion (if you connect a workspace).
          </p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">What we don&apos;t do</h2>
          <p className="mt-2">We never sell your data, and we don&apos;t use advertising cookies.</p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">The widget</h2>
          <p className="mt-2">
            The embeddable widget stores a random visitor identifier in your visitors&apos; browser
            `localStorage` to keep a conversation going across page reloads. No cross-site tracking.
          </p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">Deleting your data</h2>
          <p className="mt-2">You can delete your account and organization at any time from Settings.</p>
        </section>
        <section>
          <h2 className="text-h3 text-text font-serif">Contact</h2>
          <p className="mt-2">
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "Use the contact link on the homepage."}
          </p>
        </section>
      </div>
    </div>
  );
}
