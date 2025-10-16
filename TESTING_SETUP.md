# 🚀 Testing Environment Setup - Summary

Kompletne środowisko testowe zostało skonfigurowane dla projektu **fitness-log**. Oto podsumowanie tego co zostało wdrożone.

## ✅ Zainstalowane pakiety

### Unit Testing - Vitest

```bash
vitest                    # Test runner
@vitest/ui              # UI mode dla visualizacji testów
@vitest/coverage-v8     # Coverage reporting
```

### E2E Testing - Playwright

```bash
@playwright/test        # Playwright test framework
```

### DOM Testing - Testing Library

```bash
@testing-library/react        # React component testing
@testing-library/user-event   # User interaction simulation
```

### Environment

```bash
jsdom                   # DOM implementation dla Node.js
@types/node            # TypeScript types
```

---

## 📁 Nowe pliki i struktury

### Konfiguracyjne

1. **vitest.config.ts** - Konfiguracja Vitest
   - Environment: jsdom
   - Globals: true
   - Setup file: vitest.setup.ts
   - Coverage configuration

2. **vitest.setup.ts** - Global setup dla wszystkich testów
   - localStorage/sessionStorage mock
   - window.matchMedia mock
   - IntersectionObserver/ResizeObserver mock
   - Global cleanup

3. **playwright.config.ts** - Konfiguracja Playwright
   - Tylko Chromium/Desktop Chrome
   - Trace recording na failure
   - Screenshot/video na failure
   - Global setup/teardown

4. **tests/e2e/global-setup.ts** - Autentykacja dla e2e testów
   - Login testowego użytkownika
   - Zapis auth state (storage)

5. **tests/e2e/global-teardown.ts** - Cleanup po testach

### Example Tests

1. **src/lib/validation/**tests**/example.test.ts**
   - Example unit tests dla Vitest
   - Pokazuje best practices
   - Mocking, assertions, async handling

2. **src/components/**tests**/example.component.test.tsx**
   - Example React component test
   - Testing Library integration
   - User event simulation

3. **tests/e2e/auth.spec.ts**
   - Example E2E tests dla Playwright
   - Page Object Model pattern
   - API testing
   - Visual regression

### Page Objects

1. **tests/e2e/pages/basePage.ts**
   - Base class dla wszystkich page objects
   - Common methods dla interakcji

2. **tests/e2e/pages/loginPage.ts**
   - Login page object
   - Enkapsuluje logikę logowania

---

## 📦 Package.json - Nowe skrypty

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:debug": "playwright test --debug",
    "e2e:codegen": "playwright codegen http://localhost:3000"
  }
}
```

---

## 🎯 Jak uruchamiać testy

### Testy jednostkowe

```bash
# Watch mode - recommended dla development
npm test

# UI mode - wizualna nawigacja
npm run test:ui

# Single run - CI/CD
npm run test:run

# Coverage report
npm run test:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy e2e
npm run e2e

# UI mode
npm run e2e:ui

# Debug mode - step through test
npm run e2e:debug

# Nagrywanie testów
npm run e2e:codegen
```

---

## 📝 Struktura testów

### Unit Tests Location

```
src/
├── lib/
│   ├── validation/
│   │   ├── index.ts
│   │   └── __tests__/
│   │       └── *.spec.ts
│   ├── services/
│   │   └── __tests__/
│   │       └── *.spec.ts
│   └── utils.ts
└── components/
    └── __tests__/
        └── *.spec.tsx
```

### E2E Tests Location

```
tests/
└── e2e/
    ├── pages/
    │   ├── basePage.ts
    │   ├── loginPage.ts
    │   └── *.ts (Page Objects)
    ├── global-setup.ts
    ├── global-teardown.ts
    └── *.spec.ts (Test files)
```

---

## 🔧 Konfiguracyjne ustawienia

### Vitest Configuration

- **Environment**: jsdom dla komponentów React
- **Globals**: true - dostęp do describe, it, expect bez importów
- **Coverage Thresholds**: 70% dla wszystkich metryk
- **Setup Files**: vitest.setup.ts dla globalnej konfiguracji

### Playwright Configuration

- **Browser**: Chromium only
- **Timeout**: 30s dla testu, 5s dla asercji
- **Retries**: 2 (w CI), 0 (lokalnie)
- **Trace**: on-first-retry
- **Screenshot**: only-on-failure
- **Video**: retain-on-failure

---

## 🧪 Best Practices już wdrożone

### Unit Testing

✅ Globals enabled - reduce boilerplate
✅ jsdom environment - test React components
✅ Setup file - clean, isolated tests
✅ Early returns - guard clauses pattern
✅ Arrange-Act-Assert - clear test structure
✅ Mocking with vi - consistent test doubles
✅ Coverage tracking - meaningful thresholds

### E2E Testing

✅ Page Object Model - maintainable tests
✅ data-testid attributes - resilient selectors
✅ Browser contexts - test isolation
✅ Global setup - reusable auth state
✅ Trace recording - debugging support
✅ Visual regression - screenshot comparison
✅ API testing - backend validation

---

## 🔐 Autentykacja dla E2E

**Global Setup** (`tests/e2e/global-setup.ts`) automatycznie:

1. Loguje testowego użytkownika
2. Zapisuje auth state do `tests/e2e/auth.json`
3. Reuses auth state w każdym teście

Zmienne środowiskowe:

```bash
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123456
```

---

## 📊 Coverage Setup

```bash
# Generuj coverage report
npm run test:coverage

# Report location: coverage/index.html

# Thresholds (vitest.config.ts):
- lines: 70%
- functions: 70%
- branches: 70%
- statements: 70%
```

---

## 🐛 Debugging

### Unit Tests

```bash
# Watch mode z filtrami
npm test -t "Test name"

# UI mode dla wizualnej nawigacji
npm run test:ui
```

### E2E Tests

```bash
# Debug mode - step through
npm run e2e:debug

# Trace viewer - replay actions
npx playwright show-trace trace.zip

# Codegen - record test
npm run e2e:codegen
```

---

## ❌ Troubleshooting

### "Element not found" w e2e

→ Używaj `data-testid` zamiast selektorów CSS
→ Sprawdzaj selektor z `await page.pause()`

### Test się "flakuje"

→ Używaj proper waits (`waitForURL`, `waitForLoadState`)
→ Unikaj `waitForTimeout()`

### Timeout errors

→ Zwiększ timeout w config
→ Sprawdź czy aplikacja działa (`npm run dev`)

### Coverage threshold failed

→ Zwiększ pokrycie testami
→ Lub zmniejsz thresholds w `vitest.config.ts`

---

## 📚 Dokumentacja

Pełny przewodnik po testowaniu: [TESTING.md](./TESTING.md)

Zawiera:

- Detailowe wytyczne dla Vitest
- Detailowe wytyczne dla Playwright
- Best practices i konwencje
- Troubleshooting guide
- Zasoby zewnętrzne

---

## 🎓 Następne kroki

1. **Dodaj data-testid** do komponentów logowania i rejestracji
2. **Napisz unit testy** dla `src/lib/validation/`
3. **Napisz unit testy** dla `src/lib/utils.ts`
4. **Napisz unit testy** dla API helpers
5. **Napisz e2e testy** dla głównych user flows
6. **Setup CI/CD** - uruchamiaj testy na każdy push

---

## 📞 Support

- **Vitest Docs**: https://vitest.dev/
- **Playwright Docs**: https://playwright.dev/
- **Testing Library Docs**: https://testing-library.com/
- **Zod Docs**: https://zod.dev/

---

**Setup ukończony**: 16.10.2025 ✨
