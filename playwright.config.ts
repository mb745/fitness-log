import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.prod") });
/**
 * PLAYWRIGHT CONFIGURATION
 *
 * Konfiguracja dla testów end-to-end (e2e)
 * Wytyczne:
 * - Tylko przeglądarka Chromium/Desktop Chrome
 * - Browser contexts dla izolacji testów
 * - Page Object Model dla maintainability
 * - Locators dla resilient element selection
 * - Trace recording dla debugowania błędów
 * - Visual comparison gdzie potrzeba
 *
 * Dokumentacja: https://playwright.dev/docs/intro
 */

export default defineConfig({
  // Katalog z testami E2E
  testDir: "tests/e2e",
  // Timeout dla całego testu (w ms)
  timeout: 30 * 1000,

  // Timeout dla asercji/waiters
  expect: {
    timeout: 5000,
  },

  // Fullyparallel execution
  fullyParallel: true,

  // Liczba fail-ów po której zatrzymać suite
  forbidOnly: !!process.env.CI,

  // Retry-e dla flaky testów w CI
  retries: process.env.CI ? 2 : 2,

  // Liczba worker-ów (paralelne testy)
  workers: process.env.CI ? 1 : undefined,

  // Reporter konfiguracja
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],

  // Output folder dla artifact-ów
  outputDir: "test-results/output",

  // Web Server - uruchomi aplikację przed testami
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Projekty - konfiguracja dla różnych przeglądarek/urządzeń
  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
      fullyParallel: true,
      teardown: "teardown",
    },

    {
      name: "teardown",
      testMatch: /global-teardown\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  // // Global setup/teardown
  // globalSetup: "./tests/e2e/global-setup.ts",
  // globalTeardown: "./tests/e2e/global-teardown.ts",

  // Use configuration
  use: {
    // Base URL dla testów
    baseURL: "http://localhost:3000",

    // Trace recording dla błędów
    trace: "on-first-retry",

    // Screenshot na fail
    screenshot: "only-on-failure",

    // Video na fail
    video: "retain-on-failure",

    // Test ID attribute
    testIdAttribute: "data-testid",

    // Keyboard/Mouse delay dla bardziej naturalnych akcji
    launchOptions: {
      slowMo: 0,
    },
  },
});
