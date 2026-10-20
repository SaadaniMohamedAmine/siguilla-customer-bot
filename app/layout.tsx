import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { Slide, ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/ui/splash-screen";
import { SPLASH_COOKIE } from "@/lib/splash";
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
  const splashSeen = (await cookies()).has(SPLASH_COOKIE);
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
                {!splashSeen && <SplashScreen />}
                <NavigationLoader />
                {children}
                <ToastContainer
                  position="top-right"
                  transition={Slide}
                  theme="light"
                  // Style inline : il l'emporte sur les feuilles de react-toastify (fond blanc imposé en thème sombre),
                  // et suit le thème actif car les tokens changent avec la classe `dark`.
                  toastStyle={{ background: "var(--surface-raised)", color: "var(--text)" }}
                />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
