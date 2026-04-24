import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// B2: split heavy vendors (react, three) into their own long-lived chunks so
// route-level code-splitting doesn't re-download them on every navigation.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("/three/")) return "vendor-three";
          if (id.includes("/react-router")) return "vendor-router";
          if (id.includes("/react-dom/") || id.includes("/react/")) return "vendor-react";
          if (id.includes("/zustand/")) return "vendor-state";
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
