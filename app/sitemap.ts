import type { MetadataRoute } from "next";
import { DOCS_ORDER } from "@/lib/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const staticRoutes = ["/", "/pricing", "/docs", "/design-system", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
  const docsRoutes = DOCS_ORDER.map((slug) => ({ url: `${base}/docs/${slug}`, lastModified: now }));
  // TEMPORAIRE (test K6) : fixture d'injection indirecte à retirer avec public/qa/injection-test.html.
  const qaRoutes = [{ url: `${base}/qa/injection-test.html`, lastModified: now }];
  return [...staticRoutes, ...docsRoutes, ...qaRoutes];
}
