import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
    setupFiles: resolve(__dirname, "./src/__tests__/setup.ts"),
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData.ts",
        "dist/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
