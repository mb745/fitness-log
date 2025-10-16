import { chromium, FullConfig } from "@playwright/test";
import path from "path";

/**
 * PLAYWRIGHT GLOBAL SETUP
 *
 * Uruchamia się raz na początku całej suite testów.
 * Używane do:
 * - Zalogowania się testowego użytkownika
 * - Zapisania stanu sesji (storage state)
 * - Wstępnej konfiguracji testów
 */

const authFile = path.join(__dirname, "auth.json");

async function globalSetup(config: FullConfig) {
  console.log("🔐 Executing global setup...");

  // Pomiń setup jeśli już istnieje plik auth
  try {
    const fs = await import("fs").then((m) => m.promises);
    await fs.access(authFile);
    console.log("✅ Auth file found, skipping login...");
    return;
  } catch {
    // File doesn't exist, continue with login
  }

  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    // Naviguj do strony logowania
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });

    // Poczekaj na załadowanie strony
    await page.waitForLoadState("domcontentloaded");

    // Wpisz dane testowe (dostosuj do twojej aplikacji)
    // UWAGA: Użyj zmiennych środowiskowych w CI!
    const testEmail = process.env.TEST_EMAIL || "test@example.com";
    const testPassword = process.env.TEST_PASSWORD || "test123456";

    // Zaloguj się
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    // Poczekaj na redirekcję do dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Zapisz stan sesji
    await context.storageState({ path: authFile });
    console.log("✅ Global setup completed successfully");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
