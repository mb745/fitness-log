// Skip vitest config loading when Playwright is running
let config;

if (process.env.PLAYWRIGHT_TEST === "true") {
  // Export empty config for Playwright context
  config = {};
} else {
  // Only import vitest when actually running vitest tests
  const { defineConfig } = await import("vitest/config");
  const react = (await import("@astrojs/react")).default;
  const path = await import("path");

  config = defineConfig({
    plugins: [react()],
    test: {
      // Środowisko do testów - jsdom dla komponentów React
      environment: "jsdom",
      // Pliki setup dla globalnej konfiguracji
      setupFiles: ["./vitest.setup.ts"],
      // Globals disabled to prevent conflicts with Playwright
      globals: false,
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
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      exclude: ["node_modules", "dist", "tests/e2e/**"],
      // Inline snapshots
      snapshotFormat: {
        printBasicPrototype: false,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
    },
  });
}

export default config;
