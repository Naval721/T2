import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ── esbuild: Strip console logs and debugger statements in production ──
  esbuild: {
    // Drop console and debugger in production to hide code execution details & env logs from DevTools
    drop: mode === "production" ? ["console", "debugger"] : [],
    // Legal comments stripped in production
    legalComments: mode === "production" ? "none" : "inline",
  },

  build: {
    // ── SECURITY: Never emit source maps to production ──────────────────
    sourcemap: false,

    // ── SECURITY: Minify with esbuild (built-in, no extra dep) ─────────
    minify: "esbuild",

    target: "es2015",

    rollupOptions: {
      output: {
        // ── SECURITY: Hash-only chunk names — no readable module paths ──
        chunkFileNames: "assets/[hash:12].js",
        entryFileNames: "assets/[hash:12].js",
        assetFileNames: "assets/[hash:12].[ext]",

        // ── Vendor splitting for caching ─────────────────────────────
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) return "v0";
          if (id.includes("node_modules/@radix-ui")) return "v1";
          if (id.includes("node_modules/fabric")) return "v2";
          if (
            id.includes("node_modules/xlsx") ||
            id.includes("node_modules/file-saver") ||
            id.includes("node_modules/jszip")
          ) return "v3";
        },
      },

      // ── Safe treeshaking — don't strip side-effect modules ───────────
      treeshake: {
        // Leave moduleSideEffects as default (true) so init code is kept
        preset: "recommended",
      },
    },

    chunkSizeWarningLimit: 1000,
  },

  optimizeDeps: {
    include: ["react", "react-dom", "fabric", "xlsx", "file-saver", "jszip"],
  },
}));
