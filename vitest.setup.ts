import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

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
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete store[key];
      });
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
})) as IntersectionObserver;

/**
 * Mock ResizeObserver
 */
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as ResizeObserver;

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
 */
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

// ============================================================
// CONSOLE MOCKING (opcjonalnie - suppress console w testach)
// ============================================================

/**
 * Opcjonalnie: wycisz console.error i console.warn w testach
 * aby skupić się na rzeczywistych błędach
 */
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
