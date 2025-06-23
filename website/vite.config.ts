import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "happy-dom",
    globals: true,
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 4173,
    host: true, // Allow external connections
  },
  build: {
    // Additional optimizations
    minify: "esbuild", // Use esbuild for minification (default)
    sourcemap: false, // Disable sourcemaps in production for smaller size
    cssCodeSplit: true, // Enable CSS code splitting
    cssMinify: true, // Enable CSS minification
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: {
          // Separate vendor code if needed
        },
        // Reduce chunk size warnings
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Show more detailed size report
    reportCompressedSize: true,
    chunkSizeWarningLimit: 100, // Warn if chunks exceed 100kb
  },
  css: {
    // Optimize CSS processing
    postcss: {
      plugins: [
        // Add CSS optimization plugins if needed
      ],
    },
  },
  plugins: [
    mode === "analyze" &&
      visualizer({
        open: false,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
      }),
  ].filter(Boolean),
}));
