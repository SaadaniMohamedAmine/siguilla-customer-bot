import Link from "next/link";
import Script from "next/script";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDemoPages, getDemoPageTitle, getDemoContent, getDemoBotKey } from "@/lib/demo-sites";
import { DemoBanner } from "@/components/marketing/demo-banner";

export const metadata: Metadata = {
  title: "Ledgerline Help Center",
  robots: { index: false, follow: false },
};

export default async function LedgerlinePage({ params }: PageProps<"/ledgerline/[[...slug]]">) {
  const { slug } = await params;
  const page = slug?.[0];
  const publicKey = await getDemoBotKey("ledgerline");
  const pages = getDemoPages("ledgerline");

  return (
    <div
      style={{
        background: "#FFFFFF",
        color: "#1E293B",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <DemoBanner />
      <header className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
        <Link href="/ledgerline" className="text-base font-semibold" style={{ color: "#1F3A5F" }}>
          Ledgerline
        </Link>
        <span className="text-sm text-slate-500">Help Center</span>
      </header>

      <div className="mx-auto grid max-w-4xl gap-8 px-8 py-12 sm:grid-cols-[200px_1fr]">
        <nav className="page-in anim-keep flex flex-col gap-1 text-sm">
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/ledgerline/${p.slug}`}
              className="anim-keep rounded-sm px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50"
              style={page === p.slug ? { background: "#EEF2F7", color: "#1F3A5F", boxShadow: "inset 2px 0 0 #1F3A5F" } : { color: "#64748B" }}
            >
              {p.title}
            </Link>
          ))}
        </nav>

        {!page ? (
          <div className="page-in anim-keep">
            <h1 className="text-2xl font-semibold" style={{ color: "#1F3A5F" }}>
              How can we help?
            </h1>
            <p className="mt-2 text-slate-600">Invoicing, bank sync, VAT and account help for Ledgerline.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {pages.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/ledgerline/${p.slug}`}
                  className="hero-in anim-keep rounded-md border border-slate-200 p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#1F3A5F] hover:shadow-md"
                  style={{ "--d": `${150 + i * 70}ms` } as React.CSSProperties}
                >
                  <p className="font-medium" style={{ color: "#1F3A5F" }}>
                    {p.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          (() => {
            const content = getDemoContent("ledgerline", page);
            if (!content) notFound();
            return (
              <article className="page-in anim-keep text-sm text-slate-600" style={{ lineHeight: 1.8 }}>
                <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                  {getDemoPageTitle("ledgerline", page)}
                </p>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  components={{
                    h1: (p) => (
                      <h1 className="mt-4 mb-2 text-xl font-semibold" style={{ color: "#1F3A5F" }} {...p} />
                    ),
                    h2: (p) => (
                      <h2 className="mt-6 mb-2 text-lg font-semibold" style={{ color: "#1F3A5F" }} {...p} />
                    ),
                    p: (p) => <p className="mt-3" {...p} />,
                    ul: (p) => <ul className="mt-3 ml-5 list-disc" {...p} />,
                  }}
                >
                  {content}
                </Markdown>
              </article>
            );
          })()
        )}
      </div>

      {publicKey ? <Script src="/widget/v1.js" data-bot={publicKey} strategy="afterInteractive" /> : null}
    </div>
  );
}
