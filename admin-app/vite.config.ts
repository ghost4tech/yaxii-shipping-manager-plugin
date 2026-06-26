import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import prefixSelector from "postcss-prefix-selector";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const styleScope = "#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app";

function scopeSelector(selector: string, prefixedSelector: string): string {
  if (selector.includes("#yaxii-shipping-manager-admin-app")) {
    return selector;
  }

  if (selector === ":root" || selector === ":host") {
    return styleScope;
  }

  if (selector.startsWith(".")) {
    return `${styleScope}${selector}, ${prefixedSelector}`;
  }

  return prefixedSelector;
}

export default defineConfig({
  base: "",
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  css: {
    postcss: {
      plugins: [
        prefixSelector({
          prefix: styleScope,
          transform(_prefix, selector, prefixedSelector) {
            return scopeSelector(selector, prefixedSelector);
          },
        }),
      ],
    },
  },
  build: {
    outDir: "../assets/admin",
    emptyOutDir: true,
    manifest: true,
    sourcemap: false,
    rollupOptions: {
      input: "src/main.tsx",
    },
  },
});
