import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cspPlugin } from "./scripts/csp.js";

export default defineConfig(({ mode }) => ({
  // loadEnv also picks up VITE_* variables set in the Vercel dashboard (process.env).
  plugins: [react(), cspPlugin(loadEnv(mode, process.cwd(), "VITE_"))],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/three/") || id.includes("@react-three")) return "three";
          if (id.includes("leaflet")) return "leaflet";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/")) return "react";
          return undefined;
        },
      },
    },
  },
}));
