import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
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
      includeAssets: ["favicon.ico.png", "haisaleslogo.png"],
      manifest: {
        name: "HaiSales",
        short_name: "HaiSales",
        description: "Plataforma de ventas HaiSales",
        theme_color: "#0F766E",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "favicon.ico.png", sizes: "192x192", type: "image/png" },
          { src: "haisaleslogo.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg}"] },
    }),
    process.env.ANALYZE === "true"
      ? visualizer({ filename: "dist/stats.html", gzipSize: true, open: false })
      : undefined,
  ].filter(Boolean),
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
});
