import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/ui/splash-screen";
import { NavigationLoader } from "@/components/ui/navigation-loader";
import { QueryProvider } from "@/components/query-provider";
import { instrumentSerif, instrumentSans, jetbrainsMono } from "@/lib/fonts";
import "@/styles/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const DESCRIPTION = "No-code AI support agents, trained on your docs and embedded anywhere in one line.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Sigilla — Every answer, sealed by its source.", template: "%s — Sigilla" },
  description: DESCRIPTION,
  applicationName: "Sigilla",
  openGraph: { title: "Sigilla", description: DESCRIPTION, url: SITE_URL, siteName: "Sigilla", type: "website" },
  twitter: { card: "summary_large_image", title: "Sigilla", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0E0A0B" },
    { media: "(prefers-color-scheme: light)", color: "#FAF6F2" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${instrumentSerif.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <QueryProvider>
              <TooltipProvider>
                <SplashScreen />
                <NavigationLoader />
                {children}
                <ToastContainer position="bottom-right" hideProgressBar closeButton={false} theme="dark" />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
