import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sigilla",
    short_name: "Sigilla",
    description: "Every answer, sealed by its source.",
    background_color: "#0E0A0B",
    theme_color: "#0E0A0B",
    display: "standalone",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
