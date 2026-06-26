import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
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
