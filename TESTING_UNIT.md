# Testy Jednostkowe - Fitness Log

Przewodnik po testach jednostkowych w projekcie, napisanych z użyciem **Vitest** i **React Testing Library**.

## 📋 Spis treści

- [Uruchamianie testów](#-uruchamianie-testów)
- [Struktura testów](#-struktura-testów)
- [Pisanie testów](#-pisanie-testów)
- [Best Practices](#-best-practices)
- [Istniejące testy](#-istniejące-testy)

## 🚀 Uruchamianie testów

### Tryb zwykły

```bash
npm run test:unit
```

### Tryb watch (automatyczne przeładowanie)

```bash
npm run test:unit:watch
```

### Tryb UI (interaktywny dashboard)

```bash
npm run test:unit:ui
```

### Coverage (raport pokrycia kodu)

```bash
npm run test:unit:coverage
```

## 🏗️ Struktura testów

### Katalogi

```
src/
├── components/
│   └── __tests__/              # Testy komponentów
│       └── PersonalTab.test.tsx
├── lib/
│   └── hooks/
│   └── __tests__/              # Testy hooków
│   └── validation/
│       └── __tests__/          # Testy walidacji
│           └── example.test.ts
└── ...
```

### Konwencja nazewnictwa

- **Komponenty**: `ComponentName.test.tsx`
- **Utilitki**: `functionName.test.ts`
- **Hooków**: `hookName.test.ts`

## 💡 Pisanie testów

### Szablon testu

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Component Name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Scenario", () => {
    it("powinien robić coś", async () => {
      // Arrange - przygotowanie
      const user = userEvent.setup();
      render(<Component />);

      // Act - akcja
      await user.click(screen.getByRole("button"));

      // Assert - weryfikacja
      expect(screen.getByText("Expected")).toBeTruthy();
    });
  });
});
```

### Mockowanie

#### Mockowanie hooków

```typescript
vi.mock("@/lib/hooks/profile", () => ({
  useProfile: vi.fn(),
}));

// W teście:
vi.mocked(useProfile).mockReturnValue({
  data: mockData,
  loading: false,
});
```

#### Mockowanie komponentów

```typescript
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
```

#### Mockowanie funkcji

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue("value");
mockFn.mockResolvedValue(Promise.resolve("async value"));
mockFn.mockRejectedValue(new Error("error"));
```

### Praktyczne przykłady

#### Testowanie interakcji użytkownika

```typescript
it("powinien wysłać formularz", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByRole("textbox"), "wartość");
  await user.click(screen.getByRole("button", { name: /wyślij/i }));

  expect(onSubmit).toHaveBeenCalledWith("wartość");
});
```

#### Testowanie asynchronicznych operacji

```typescript
it("powinien załadować dane", async () => {
  const mockFetch = vi.fn().mockResolvedValue({ data: "test" });
  render(<Component fetchData={mockFetch} />);

  await waitFor(() => {
    expect(screen.getByText("test")).toBeTruthy();
  });
});
```

#### Testowanie zmian stanu

```typescript
it("powinien wyświetlić loading state", () => {
  vi.mocked(useHook).mockReturnValue({ loading: true });
  render(<Component />);

  expect(screen.getByText(/ładowanie/i)).toBeTruthy();
});
```

## ✅ Best Practices

### Struktura Arrange-Act-Assert

```typescript
it("powinien zmienić wartość", async () => {
  // ❌ ZŁE
  render(<Input />);
  const input = screen.getByRole("textbox");
  await user.type(input, "test");
  expect(input.value).toBe("test");

  // ✅ DOBRE
  // Arrange
  render(<Input />);
  const input = screen.getByRole("textbox");

  // Act
  await user.type(input, "test");

  // Assert
  expect(input.value).toBe("test");
});
```

### Używanie data-testid selektywnie

```typescript
// ❌ Nadużywanie data-testid
<input data-testid="email" />
expect(screen.getByTestId("email")).toBeTruthy();

// ✅ Preferować role/label
<input aria-label="Email" />
expect(screen.getByLabelText("Email")).toBeTruthy();
```

### Czyszczenie po testach

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Czyści wszystkie mocki
});

afterEach(() => {
  cleanup(); // Czyści DOM (automatycznie w vitest.setup.ts)
});
```

### Testowanie błędów

```typescript
it("powinien wyświetlić błąd", async () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const errorMock = vi.fn().mockRejectedValue(new Error("Network error"));
  render(<Component onError={errorMock} />);

  await waitFor(() => {
    expect(screen.getByText(/błąd/i)).toBeTruthy();
  });

  consoleErrorSpy.mockRestore();
});
```

## 📝 Istniejące testy

### PersonalTab.test.tsx

Kompleksowy test suite dla komponentu `PersonalTab` z formularzem profilu użytkownika.

**Kategorie testów:**

1. **Rendering** (3 testy)
   - Renderowanie wszystkich pól formularza
   - Button submit z poprawnym tekstem
   - Wszystkie opcje w select płci

2. **Form Population** (3 testy)
   - Wypełnianie formularza danymi z profilu
   - Obsługa brakujących danych (undefined)
   - Aktualizacja formularza gdy zmienia się profil

3. **User Interactions** (3 testy)
   - Zmiana wartości pól (waga, wzrost)
   - Zmiana opcji w select
   - Czyszczenie wartości

4. **Form Submission** (6 testów)
   - Wysyłanie danych do API
   - Toast przy sukcesie
   - Toast przy błędzie
   - Resetowanie formularza po sukcesie
   - Zamykanie toast

5. **Loading State** (3 testy)
   - Wyłączanie buttona podczas aktualizacji
   - Zmiana tekstu ("Zapisz" → "Zapisywanie…")
   - Przywracanie normalnego stanu

6. **Edge Cases** (3 testy)
   - Obsługa null w profile
   - Wysyłanie tylko zmienionych pól
   - Obsługa wartości dziesiętnych

7. **Integration** (2 testy)
   - Pełny cykl: załadowanie → zmiana → submit
   - Wiele zmian w sekwencji

**Razem: 23 testy**

Uruchomienie:

```bash
npm run test:unit -- PersonalTab.test.tsx
```

## 🔧 Konfiguracja

### vitest.config.ts

```typescript
{
  environment: "jsdom",           // DOM testing
  setupFiles: ["./vitest.setup.ts"],
  globals: true,                  // describe/it bez importu
  coverage: {
    provider: "v8",
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
}
```

### vitest.setup.ts

Zawiera:

- ✅ Mockowanie localStorage/sessionStorage
- ✅ Mockowanie window.matchMedia
- ✅ Mockowanie IntersectionObserver
- ✅ Mockowanie ResizeObserver
- ✅ Custom matchers (toBeInTheDocument, toHaveTextContent, itd.)

## 📊 Custom Matchers

```typescript
// toBeInTheDocument - sprawdza czy element jest w DOM
expect(element).toBeInTheDocument();

// toHaveTextContent - sprawdza tekst elementu
expect(element).toHaveTextContent("tekst");

// toBeDisabled - sprawdza czy element jest disabled
expect(button).toBeDisabled();

// toHaveValue - sprawdza wartość input/select
expect(input).toHaveValue("value");
```

## 🐛 Troubleshooting

### Test timeout

```typescript
// Zwiększ timeout dla konkretnego testu
it("powinien załadować dane", async () => {
  // test code
}, 10000); // 10 sekund
```

### "element not found"

```typescript
// ❌ ZŁE - element jeszcze nie w DOM
expect(screen.getByText("Loading")).toBeTruthy();

// ✅ DOBRE - czekaj na pojawienie się
await waitFor(() => {
  expect(screen.getByText("Loading")).toBeTruthy();
});
```

### Mock nie działa

```typescript
// Upewnij się że vi.mock() jest na TOP LEVEL
vi.mock("@/lib/hooks"); // ✅ Na poziomie modułu

describe("test", () => {
  // vi.mock tutaj NIE ZADZIAŁA ❌
});
```

## 🔗 Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
