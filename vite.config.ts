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
  build: {
    // ── SECURITY: Never emit source maps to production ──────────────
    sourcemap: false,

    // ── SECURITY: Aggressive minification via esbuild (built-in) ────
    minify: "esbuild",

    // ── SECURITY: Strip all console.log / debugger statements ───────
    target: "es2015",

    rollupOptions: {
      output: {
        // ── SECURITY: Obfuscate chunk / asset file names ─────────────
        // Uses a hash-only pattern — no readable module names
        chunkFileNames: "assets/[hash:12].js",
        entryFileNames: "assets/[hash:12].js",
        assetFileNames: "assets/[hash:12].[ext]",

        // ── Keep vendor chunks separate so user code stays tiny ──────
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) return "v0";
          if (id.includes("node_modules/@radix-ui")) return "v1";
          if (id.includes("node_modules/fabric")) return "v2";
          if (id.includes("node_modules/xlsx") || id.includes("node_modules/file-saver") || id.includes("node_modules/jszip")) return "v3";
        },
      },

      // ── SECURITY: Treeshake aggressively to reduce surface area ───
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },

    chunkSizeWarningLimit: 1000,

    // ── SECURITY: Vite esbuild drop options ─────────────────────────
    // Drop all debugger statements and console.* calls at build time
  },

  esbuild: {
    // Remove all debugger keywords from the bundle
    drop: ["debugger", "console"],
    // Obfuscate identifiers
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    // Legal comments stripped
    legalComments: "none",
  },

  optimizeDeps: {
    include: ["react", "react-dom", "fabric", "xlsx", "file-saver", "jszip"],
  },
}));
