import { FullConfig } from "@playwright/test";

/**
 * PLAYWRIGHT GLOBAL TEARDOWN
 *
 * Uruchamia się raz na końcu całej suite testów.
 * Używane do:
 * - Czyszczenia zasobów
 * - Wylogowania użytkownika z testowej sesji
 * - Archiwiowania logów/raportów
 */

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Executing global teardown...");

  try {
    // Tutaj możesz dodać logikę cleanup-u:
    // - Czyszczenie danych testowych z bazy
    // - Wylogowanie
    // - Zamknięcie połączeń

    console.log("✅ Global teardown completed successfully");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Nie rzucaj błędu tutaj, aby testy mogły się normalnie skończyć
  }
}

export default globalTeardown;
