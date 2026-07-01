import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
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
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
