import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <footer className="border-border border-t px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <Wordmark size="sm" />
            <p className="text-small text-text-muted mt-2 max-w-xs">
              &ldquo;Every answer, sealed by its source.&rdquo;
            </p>
          </div>
          <div className="text-small flex gap-12">
            <div className="flex flex-col gap-2">
              <p className="label-caps mb-1">Product</p>
              <Link href="/pricing" className="text-text-muted hover:text-text">
                Pricing
              </Link>
              <Link href="/docs" className="text-text-muted hover:text-text">
                Docs
              </Link>
              <Link href="/demo" className="text-text-muted hover:text-text">
                Live demo
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="label-caps mb-1">Legal</p>
              <Link href="/privacy" className="text-text-muted hover:text-text">
                Privacy
              </Link>
              <Link href="/terms" className="text-text-muted hover:text-text">
                Terms
              </Link>
            </div>
            {process.env.NEXT_PUBLIC_AUTHOR_URL ? (
              <div className="flex flex-col gap-2">
                <p className="label-caps mb-1">Built by</p>
                <a
                  href={process.env.NEXT_PUBLIC_AUTHOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-text-muted hover:text-text"
                >
                  Portfolio
                </a>
              </div>
            ) : null}
          </div>
        </div>
        <p className="text-small text-text-muted mx-auto mt-8 max-w-5xl">
          © 2026 Sigilla — A portfolio project.
        </p>
      </footer>
    </div>
  );
}
