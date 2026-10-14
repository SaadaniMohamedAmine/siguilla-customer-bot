import type { MetadataRoute } from "next";
import { DOCS_ORDER } from "@/lib/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const staticRoutes = ["/", "/pricing", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
  const docsRoutes = DOCS_ORDER.map((slug) => ({ url: `${base}/docs/${slug}`, lastModified: now }));
  return [...staticRoutes, ...docsRoutes];
}
