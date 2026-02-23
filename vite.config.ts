import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";
import pkg from "./package.json" with { type: "json" };

const manifest: Partial<ManifestOptions> = {
  name: pkg.name,
  short_name: pkg.name,
  description: pkg.description,
  scope: "/time-dashboard/",
  start_url: "/time-dashboard/",
  display: "standalone",
  icons: [
    {
      src: "/images/icon/192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/images/icon/256x256.png",
      sizes: "256x256",
      type: "image/png",
    },
    {
      src: "/images/icon/384x384.png",
      sizes: "384x384",
      type: "image/png",
    },
    {
      src: "/images/icon/512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  theme_color: "#242424",
  background_color: "#242424",
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
      includeAssets: ["images/*"],
    }),
  ],
  base: "/time-dashboard/",
});
