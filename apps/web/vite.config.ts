import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const apiProxy = {
  target: "http://127.0.0.1:3000",
  changeOrigin: true,
  ws: true,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": apiProxy,
    },
  },
  preview: {
    proxy: {
      "/api": apiProxy,
    },
  },
});
