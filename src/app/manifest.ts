import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CDM 2026 — Pronostics",
    short_name: "CDM 2026",
    description: "Pronostics Coupe du Monde 2026 entre amis et famille",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080e1a",
    theme_color: "#080e1a",
    categories: ["sports", "games"],
    icons: [
      { src: "/api/icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/api/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
