import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig(({ mode }) => {
  const isCapacitor = mode === "capacitor";

  return {
  base: isCapacitor ? "./" : "/",
  plugins: [
    react(),
    tailwindcss(),
    // When building for Capacitor, virtual:pwa-register has no provider
    // (VitePWA is excluded). Provide a no-op stub so the import resolves.
    ...(isCapacitor ? [{
      name: "pwa-register-stub",
      resolveId(id: string) {
        if (id === "virtual:pwa-register") return "\0virtual:pwa-register";
      },
      load(id: string) {
        if (id === "\0virtual:pwa-register")
          return "export function registerSW() { return () => {}; }";
      },
    }] : []),
    ...(!isCapacitor ? [VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "Finventree - Smart Inventory",
        short_name: "Finventree",
        description:
          "Smart Inventory & Wallet Manager for Smartphone Resellers",
        theme_color: "#064a98",
        background_color: "#064a98",
        start_url: "/",
        scope: "/",
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
      },
    })] : []),
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
      plugins: [
        ...(process.env.ANALYZE ? [visualizer({
          filename: "stats.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
        })] : []),
      ],
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
  };
});
