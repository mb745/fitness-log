// Guard against loading vitest when Playwright is running
if (process.env.PLAYWRIGHT_TEST === "true") {
  // eslint-disable-next-line no-console
  console.log("Skipping vitest setup - Playwright is running");
  // Export empty to prevent errors
  export {};
} else {
  // Only load vitest modules when not in Playwright context
  const vitest = await import("vitest");
  const testingLibrary = await import("@testing-library/react");

  const { expect, afterEach, vi } = vitest;
  const { cleanup } = testingLibrary;

  /**
   * SETUP FILE dla wszystkich testów Vitest
   *
   * Plik jest automatycznie ładowany przez vitest.config.ts
   * Zawiera globalną konfigurację, mocki i custom asserty
   */

  // ============================================================
  // CLEANUP
  // ============================================================

  /**
   * Czyści DOM po każdym teście
   * Zapewnia izolację testów i brak efektów ubocznych
   */
  afterEach(() => {
    cleanup();
  });

  // ============================================================
  // GLOBAL MOCKS
  // ============================================================

  /**
   * Mock localStorage - imituje browser Storage API
   */
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  /**
   * Mock sessionStorage
   */
  Object.defineProperty(window, "sessionStorage", {
    value: localStorageMock,
  });

  /**
   * Mock window.matchMedia dla media queries
   */
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  /**
   * Mock IntersectionObserver
   */
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  /**
   * Mock ResizeObserver
   */
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  // ============================================================
  // ENVIRONMENT
  // ============================================================

  /**
   * Ustaw zmienne środowiskowe dla testów
   */
  process.env.VITEST = "true";

  // ============================================================
  // CUSTOM MATCHERS (opcjonalnie - dodaj jeśli potrzebujesz)
  // ============================================================

  /**
   * Przykład custom matchera - można dodać więcej jeśli potrzeba
   * expect(element).toBeInTheDocument()
   *
   * Note: Wrapped in try-catch to avoid conflicts with Playwright's expect
   * This file may be loaded when Playwright runs due to tsconfig including all files
   */
  try {
    expect.extend({
      /**
       * Matcher: toBeInTheDocument
       * Sprawdza czy element jest w dokumencie
       */
      toBeInTheDocument(element: HTMLElement | null) {
        const pass = element !== null && document.body.contains(element);
        return {
          pass,
          message: () => `expected element to be in document${!pass ? ", but it was not" : ""}`,
        };
      },

      /**
       * Matcher: toHaveTextContent
       * Sprawdza czy element zawiera określony tekst
       */
      toHaveTextContent(element: HTMLElement | null, text: string | RegExp) {
        if (!element) {
          return {
            pass: false,
            message: () => "expected element to exist",
          };
        }

        const content = element.textContent || "";
        const textToMatch = typeof text === "string" ? text : text.source;
        const pass = typeof text === "string" ? content.includes(text) : text.test(content);

        return {
          pass,
          message: () =>
            `expected element to have text content "${textToMatch}"${!pass ? `, but it has "${content}"` : ""}`,
        };
      },

      /**
       * Matcher: toBeDisabled
       * Sprawdza czy element jest disabled
       */
      toBeDisabled(element: HTMLElement | null) {
        const pass = element !== null && (element as HTMLButtonElement | HTMLInputElement).disabled === true;
        return {
          pass,
          message: () => `expected element to be disabled${!pass ? ", but it was not" : ""}`,
        };
      },

      /**
       * Matcher: toHaveValue
       * Sprawdza wartość input/select/textarea
       */
      toHaveValue(element: HTMLElement | null, value: string | number) {
        if (!element) {
          return {
            pass: false,
            message: () => "expected element to exist",
          };
        }

        const elementValue = (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
        const pass = String(elementValue) === String(value);

        return {
          pass,
          message: () => `expected element to have value "${value}"${!pass ? `, but it has "${elementValue}"` : ""}`,
        };
      },
    });
  } catch {
    // Silently ignore if expect is already defined (e.g., by Playwright)
    // This can happen when this file is loaded due to tsconfig including all files
  }

  // ============================================================
  // CONSOLE MOCKING (opcjonalnie - suppress console w testach)
  // ============================================================

  /**
   * Opcjonalnie: wycisz console.error i console.warn w testach
   * aby skupić się na rzeczywistych błędach
   */
  // vi.spyOn(console, 'error').mockImplementation(() => {});
  // vi.spyOn(console, 'warn').mockImplementation(() => {});
}
