import { defineConfig } from "vitest/config";
import react from "@astrojs/react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Środowisko do testów - jsdom dla komponentów React
    environment: "jsdom",
    // Pliki setup dla globalnej konfiguracji
    setupFiles: ["./vitest.setup.ts"],
    // Globals - dostęp do describe, it, expect bez importów
    globals: true,
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        ".next/",
        "coverage/",
        "**/*.config.*",
        "**/mockData",
        "**/*.spec.ts",
        "**/*.test.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    // Include/exclude patterns
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist"],
    // Inline snapshots
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
