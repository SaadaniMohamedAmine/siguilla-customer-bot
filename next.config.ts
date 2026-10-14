import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/workflows/ingest": ["./node_modules/@napi-rs/**/*", "./node_modules/pdfjs-dist/**/*"],
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.public.blob.vercel-storage.com",
      "font-src 'self'",
      "connect-src 'self' https://*.public.blob.vercel-storage.com https://vercel.com/api/blob",
      "frame-src 'self'",
      "frame-ancestors 'self'",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        // Le widget lui-même est servi cross-origin vers les sites clients : lui appliquer
        // frame-ancestors/CSP n'a pas de sens (ce n'est pas une page) et casserait les en-têtes
        // CORS ci-dessus posés pour lui spécifiquement.
        source: "/((?!widget/).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin()(nextConfig);
