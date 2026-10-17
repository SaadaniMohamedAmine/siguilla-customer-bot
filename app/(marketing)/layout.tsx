import Script from "next/script";
import { SkipLink } from "@/components/ui/skip-link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <MarketingNav />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <SiteFooter />
      {process.env.NEXT_PUBLIC_LANDING_BOT_KEY ? (
        <Script
          src="/widget/v1.js"
          data-bot={process.env.NEXT_PUBLIC_LANDING_BOT_KEY}
          strategy="lazyOnload"
        />
      ) : null}
    </div>
  );
}
