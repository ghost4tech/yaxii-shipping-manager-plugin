import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "../assets/admin"),
    emptyOutDir: true,
    manifest: true,
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, "src/wp-admin-main.tsx"),
    },
  },
});
