import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: "autoUpdate",
    workbox: {
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
    },
    manifest: {
      name: "StockFlow - Smart Inventory",
      short_name: "StockFlow",
      description:
        "Smart Inventory & Wallet Manager for Smartphone Resellers",
      theme_color: "#064a98",
      background_color: "#F9FAFB",
      display: "standalone",
      display_override: ["fullscreen", "standalone", "minimal-ui"],
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
  }), cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-zxing": ["@zxing/browser", "@zxing/library"],
          "vendor-charts": ["recharts"],
          "vendor-xlsx": ["xlsx"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});