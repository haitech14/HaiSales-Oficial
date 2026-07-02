import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    open: "http://127.0.0.1:8080/",
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "data-vendor": ["@tanstack/react-query", "@supabase/supabase-js"],
          charts: ["recharts"],
          pdf: ["jspdf"],
          canvas: ["html2canvas"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      devOptions: { enabled: false },
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "HaiSales",
        short_name: "HaiSales",
        description: "Plataforma de ventas HaiSales",
        theme_color: "#0F766E",
        background_color: "#0f172a",
        display: "standalone",
        icons: [{ src: "favicon.ico", sizes: "64x64", type: "image/x-icon" }],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg}"] },
    }),
    process.env.ANALYZE === "true"
      ? visualizer({ filename: "dist/stats.html", gzipSize: true, open: false })
      : undefined,
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
