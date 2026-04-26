import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("/three/"))         return "vendor-three";
          if (id.includes("/react-router"))   return "vendor-router";
          if (id.includes("/react-dom/") || id.includes("/react/")) return "vendor-react";
          if (id.includes("/zustand/"))       return "vendor-state";
          if (id.includes("/cmdk/"))          return "vendor-cmdk";
          if (id.includes("/sonner/"))        return "vendor-sonner";
          if (id.includes("/framer-motion/")) return "vendor-motion";
        },
      },
    },
  },
  server: { host: "127.0.0.1", port: 5174 },
});
