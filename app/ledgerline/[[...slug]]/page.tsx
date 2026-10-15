import Link from "next/link";
import Script from "next/script";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { IconSvgElement } from "@hugeicons/react";
import { getDemoPages, getDemoPageTitle, getDemoContent, getDemoBotKey } from "@/lib/demo-sites";
import { DemoBanner } from "@/components/marketing/demo-banner";
import { DemoGuide, AskButton } from "@/components/marketing/demo-guide";
import { Reveal } from "@/components/marketing/reveal";
import { Icon } from "@/components/ui/icon";
import { AnalyticsIcon, ArrowRightIcon, FileIcon, LockIcon, RefreshIcon, SearchIcon, TuneIcon, UserAddIcon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Ledgerline Help Center",
  robots: { index: false, follow: false },
};

const NAVY = "#1F3A5F";
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const TOPICS: Record<string, { icon: IconSvgElement; blurb: string }> = {
  "getting-started": { icon: UserAddIcon, blurb: "Create your workspace and send your first invoice." },
  invoices: { icon: FileIcon, blurb: "Create, send and track invoices." },
  "bank-sync": { icon: RefreshIcon, blurb: "Connect your bank and match transactions." },
  vat: { icon: AnalyticsIcon, blurb: "VAT rates, reverse charge and reporting." },
  "plans-billing": { icon: TuneIcon, blurb: "Plans, limits and how you're billed." },
  security: { icon: LockIcon, blurb: "How we keep your data safe." },
};

export default async function LedgerlinePage({ params }: PageProps<"/ledgerline/[[...slug]]">) {
  const { slug } = await params;
  const page = slug?.[0];
  const publicKey = await getDemoBotKey("ledgerline");
  const pages = getDemoPages("ledgerline");

  return (
    <div
      style={{
        background: "#F8FAFC",
        color: "#1E293B",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <DemoBanner />
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <Link href="/ledgerline" className="flex items-center gap-2.5 text-base font-semibold" style={{ color: NAVY }}>
          <span
            className="flex size-7 items-center justify-center rounded-md text-sm text-white"
            style={{ background: NAVY }}
          >
            L
          </span>
          Ledgerline
          <span className="text-sm font-normal text-slate-400">Help Center</span>
        </Link>
        <AskButton
          className="anim-keep inline-flex items-center gap-2 rounded-md border border-slate-200 px-3.5 py-1.5 text-sm text-slate-600 transition-colors duration-200 hover:border-slate-400"
        >
          <Icon icon={SearchIcon} size={15} />
          Ask a question
        </AskButton>
      </header>

      {!page ? (
        <main>
          <section
            className="px-8 py-20 text-center text-white"
            style={{ background: `radial-gradient(ellipse at 50% 0%, #2C5282 0%, ${NAVY} 45%, #14284A 100%)` }}
          >
            <p className="hero-in anim-keep text-xs font-medium tracking-[0.2em] uppercase text-sky-200" style={at(0)}>
              Help Center
            </p>
            <h1 className="hero-in anim-keep mt-3 text-4xl font-semibold" style={at(120)}>
              How can we help?
            </h1>
            <p className="hero-in anim-keep mx-auto mt-3 max-w-md text-sky-100/80" style={at(240)}>
              Invoicing, bank sync, VAT and account help for Ledgerline.
            </p>
            <div className="hero-in anim-keep mx-auto mt-8 max-w-xl" style={at(360)}>
              <AskButton
                className="anim-keep flex w-full items-center gap-3 rounded-xl bg-white px-5 py-4 text-left text-slate-500 shadow-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <Icon icon={SearchIcon} size={20} className="text-slate-400" />
                <span className="flex-1">Ask anything about invoices, VAT or bank sync…</span>
                <span className="rounded-md px-2.5 py-1 text-xs font-medium text-white" style={{ background: NAVY }}>
                  Ask
                </span>
              </AskButton>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-8 py-16">
            <Reveal>
              <h2 className="text-xl font-semibold" style={{ color: NAVY }}>
                Browse by topic
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((p, i) => {
                const t = TOPICS[p.slug];
                return (
                  <Reveal key={p.slug} delay={i * 80} className="h-full">
                    <Link
                      href={`/ledgerline/${p.slug}`}
                      className="anim-keep group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#1F3A5F] hover:shadow-lg"
                    >
                      <span
                        className="flex size-10 items-center justify-center rounded-lg"
                        style={{ background: "#EEF2F7", color: NAVY }}
                      >
                        <Icon icon={t.icon} size={20} />
                      </span>
                      <p className="mt-4 font-semibold" style={{ color: NAVY }}>
                        {p.title}
                      </p>
                      <p className="mt-1 flex-1 text-sm text-slate-500">{t.blurb}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: NAVY }}>
                        Read article
                        <Icon
                          icon={ArrowRightIcon}
                          size={14}
                          className="anim-keep transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

            <Reveal className="mt-12">
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-6 text-white"
                style={{ background: NAVY }}
              >
                <div>
                  <p className="text-lg font-semibold">Can&apos;t find your answer?</p>
                  <p className="mt-1 text-sm text-sky-100/80">Ask our assistant — it answers from these help articles.</p>
                </div>
                <AskButton
                  className="anim-keep rounded-md bg-white px-5 py-2.5 text-sm font-medium transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ color: NAVY }}
                >
                  Ask the assistant
                </AskButton>
              </div>
            </Reveal>
          </section>
        </main>
      ) : (
        <div className="mx-auto grid max-w-4xl gap-8 px-8 py-12 sm:grid-cols-[210px_1fr]">
          <nav className="page-in anim-keep flex flex-col gap-1 text-sm">
            <Link href="/ledgerline" className="mb-2 text-xs font-medium text-slate-400 hover:text-slate-600">
              ← All topics
            </Link>
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/ledgerline/${p.slug}`}
                className="anim-keep rounded-md px-3 py-2 transition-colors duration-200 hover:bg-white"
                style={
                  page === p.slug
                    ? { background: "#fff", color: NAVY, boxShadow: `inset 2px 0 0 ${NAVY}`, fontWeight: 500 }
                    : { color: "#64748B" }
                }
              >
                {p.title}
              </Link>
            ))}
          </nav>
          {(() => {
            const content = getDemoContent("ledgerline", page);
            if (!content) notFound();
            return (
              <article
                className="page-in anim-keep rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600"
                style={{ lineHeight: 1.8 }}
              >
                <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                  {getDemoPageTitle("ledgerline", page)}
                </p>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  components={{
                    h1: (p) => <h1 className="mt-2 mb-2 text-2xl font-semibold" style={{ color: NAVY }} {...p} />,
                    h2: (p) => <h2 className="mt-7 mb-2 text-lg font-semibold" style={{ color: NAVY }} {...p} />,
                    p: (p) => <p className="mt-3" {...p} />,
                    ul: (p) => <ul className="mt-3 ml-5 list-disc" {...p} />,
                  }}
                >
                  {content}
                </Markdown>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
                  <p>Was this not what you needed?</p>
                  <AskButton
                    className="anim-keep rounded-md px-4 py-2 text-sm font-medium text-white transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-110"
                    style={{ background: NAVY }}
                  >
                    Ask the assistant
                  </AskButton>
                </div>
              </article>
            );
          })()}
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white px-8 py-8 text-center text-xs text-slate-400">
        © Ledgerline — illustrative brand for the Sigilla demo.
      </footer>

      {publicKey ? (
        <>
          <Script src="/widget/v1.js" data-bot={publicKey} strategy="afterInteractive" />
          <DemoGuide
            title="Try the assistant"
            hint="It answers from Ledgerline's help articles, with sources. Pick a question:"
            questions={[
              "How do I connect my bank account?",
              "How does the reverse charge work for VAT?",
              "What is the difference between the plans?",
            ]}
          />
        </>
      ) : null}
    </div>
  );
}
