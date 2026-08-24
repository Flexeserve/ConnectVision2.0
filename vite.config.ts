import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  // GitHub Pages serves from a /ConnectVision2.0/ subpath; Railway serves
  // from the app's own domain root, so only the gh-pages build needs it.
  base: process.env.DEPLOY_TARGET === "gh-pages" ? "/ConnectVision2.0/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
