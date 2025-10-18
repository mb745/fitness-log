import path from "path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { LoginPage } from "./pages/loginPage";
import { test as setup } from "@playwright/test";

/**
 * PLAYWRIGHT GLOBAL SETUP
 *
 * Uruchamia się raz na początku całej suite testów.
 * Używane do:
 * - Zalogowania się testowego użytkownika
 * - Zapisania stanu sesji (storage state)
 * - Wstępnej konfiguracji testów
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = path.join(__dirname, "./auth.json");

setup("Global setup", async ({ page }) => {
  console.log("🔐 Executing global setup...");

  const loginPage = new LoginPage(page);

  try {
    // Naviguj do strony logowania
    await loginPage.goto();

    // Poczekaj na załadowanie strony
    await page.waitForLoadState("domcontentloaded");
    await loginPage.login(process.env.E2E_USERNAME || "test@example.com", process.env.E2E_PASSWORD || "password");

    // Zapisz stan sesji
    await page.context().storageState({ path: authFile });
    console.log("✅ Global setup completed successfully");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  }
});
