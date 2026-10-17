import type { Metadata } from "next";

/** Métadonnées d'une page publique : titre (gabarit « — Sigilla »), description, partage Open Graph / Twitter. */
export function pageMeta(title: string, description: string, path?: string): Metadata {
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: { title, description, type: "website", ...(path ? { url: path } : {}) },
    twitter: { card: "summary_large_image", title, description },
  };
}
