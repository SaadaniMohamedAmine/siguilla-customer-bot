import type { Metadata } from "next";

const OG_IMAGE = [{ url: "/opengraph-image", width: 1200, height: 630 }];

/** Métadonnées d'une page publique : titre (gabarit « — Sigilla »), description, partage Open Graph / Twitter. */
export function pageMeta(title: string, description: string, path?: string): Metadata {
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    // Un `openGraph` défini sur une page remplace celui du layout racine, image comprise : on la répète ici.
    openGraph: { title, description, type: "website", images: OG_IMAGE, ...(path ? { url: path } : {}) },
    twitter: { card: "summary_large_image", title, description, images: OG_IMAGE.map((i) => i.url) },
  };
}
