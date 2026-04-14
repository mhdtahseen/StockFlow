import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
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
        background_color: "#064a98",
        display: "standalone",
        display_override: ["fullscreen", "standalone", "minimal-ui"],
        categories: ["business", "finance"],
        lang: "en",
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
        screenshots: [
          {
            src: "screenshot-desktop.png",
            sizes: "2880x1642",
            type: "image/png",
            form_factor: "wide",
            label: "StockFlow Desktop Dashboard",
          },
          {
            src: "screenshot-mobile.png",
            sizes: "1170x2532",
            type: "image/png",
            form_factor: "narrow",
            label: "StockFlow Mobile Dashboard",
          },
        ],
        shortcuts: [
          {
            name: "Inventory",
            short_name: "Inventory",
            description: "View and manage stock",
            url: "/inventory",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Add Entry",
            short_name: "Add",
            description: "Add new phone stock",
            url: "/add",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Ledger",
            short_name: "Ledger",
            description: "View financial transactions",
            url: "/ledger",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
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
