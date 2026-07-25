import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.js",
  },
  server: {
    // Local dev proxy only — not used in production
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
