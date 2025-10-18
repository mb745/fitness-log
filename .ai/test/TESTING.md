# 🧪 Testing Guide

Kompletny przewodnik po testowaniu w projekcie **fitness-log**.

## Spis treści

- [Quick Start](#quick-start)
- [Unit Tests (Vitest)](#unit-tests-vitest)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Instalacja

```bash
npm install
```

### Uruchamianie testów

```bash
# Testy jednostkowe - watch mode
npm test

# Testy jednostkowe - single run
npm run test:run

# Testy jednostkowe - z UI
npm run test:ui

# Testy e2e
npm run e2e

# Testy e2e - z UI
npm run e2e:ui

# Testy e2e - debug mode
npm run e2e:debug

# Codegen dla e2e (nagrywanie testów)
npm run e2e:codegen

# Coverage raport
npm run test:coverage
```

---

## Unit Tests (Vitest)

### 📍 Lokalizacja

Testy jednostkowe znajdują się obok kodu, którą testują:

```
src/
├── lib/
│   ├── validation/
│   │   ├── index.ts
│   │   └── __tests__/
│   │       └── validation.spec.ts
│   ├── services/
│   │   ├── userService.ts
│   │   └── __tests__/
│   │       └── userService.spec.ts
│   └── utils.ts
└── components/
    └── __tests__/
        └── component.spec.ts
```

### 🎯 Konwencje

- **Nazwy plików**: `*.spec.ts` lub `*.test.ts`
- **Lokalizacja**: folder `__tests__` obok testowanego kodu
- **Struktura**: describe > it > Arrange-Act-Assert
- **Nazwy testów**: zaczynaj od "should" - `should do something`

### ✍️ Przykład testu

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it("should create user with valid data", () => {
    // Arrange
    const userData = { email: "test@example.com", name: "John" };

    // Act
    const result = service.createUser(userData);

    // Assert
    expect(result.email).toBe("test@example.com");
  });

  it("should throw error on invalid email", () => {
    // Arrange
    const userData = { email: "invalid", name: "John" };

    // Act & Assert
    expect(() => service.createUser(userData)).toThrow();
  });
});
```

### 🔧 Konfiguracja

Plik: `vitest.config.ts`

```typescript
- environment: 'jsdom' - dla komponentów React
- globals: true - dostęp do describe, it, expect bez importów
- coverage: reportery i thresholds
- setupFiles: ['./vitest.setup.ts'] - globalna konfiguracja
```

### 📦 Setup File

Plik: `vitest.setup.ts`

Zawiera:

- Cleanup po każdym teście
- Mock localStorage/sessionStorage
- Mock window.matchMedia
- Mock IntersectionObserver, ResizeObserver
- Global mocks i custom matchers

### 💡 Best Practices

1. **Jeden test = jeden scenariusz**

   ```typescript
   // ✅ Dobry test
   it("should add two numbers correctly", () => {
     expect(add(5, 3)).toBe(8);
   });

   // ❌ Zły test - testuje wiele rzeczy
   it("should handle math operations", () => {
     expect(add(5, 3)).toBe(8);
     expect(subtract(5, 3)).toBe(2);
     expect(multiply(5, 3)).toBe(15);
   });
   ```

2. **Używaj early returns dla error conditions**

   ```typescript
   // ✅ Dobry handler
   function validateUser(user: User) {
     if (!user.email) {
       throw new Error("Email required");
     }
     if (!user.password) {
       throw new Error("Password required");
     }
     // happy path
   }

   // ❌ Zły - głębokie zagnieżdżenie
   if (user.email) {
     if (user.password) {
       // happy path
     }
   }
   ```

3. **Mock-i zamiast integracji**

   ```typescript
   // ✅ Mockuj API calls
   const mockApi = vi.fn().mockResolvedValue({ id: 1 });

   // ❌ Unikaj faktycznych API calls w testach
   ```

4. **Inline snapshots dla złożonych danych**

   ```typescript
   // ✅ Czytelne snapshot-y
   expect(user).toMatchInlineSnapshot(`
     {
       "email": "test@example.com",
       "id": 1,
     }
   `);
   ```

5. **Descriptive matcher messages**

   ```typescript
   // ✅ Z message-m
   expect(result, "User should be created").toBeDefined();

   // ❌ Bez message-u
   expect(result).toBeDefined();
   ```

---

## E2E Tests (Playwright)

### 📍 Lokalizacja

Testy e2e znajdują się w folderze `tests/e2e/`:

```
tests/
└── e2e/
    ├── pages/
    │   ├── basePage.ts
    │   ├── loginPage.ts
    │   ├── dashboardPage.ts
    │   └── planPage.ts
    ├── global-setup.ts
    ├── global-teardown.ts
    └── auth.spec.ts
    └── plans.spec.ts
```

### 🎯 Page Object Model

Page Object Model (POM) enkapsuluje logikę interakcji ze stronami:

```typescript
// ✅ Page Object Model
export class LoginPage extends BasePage {
  private readonly emailInput = '[data-testid="email-input"]';
  private readonly loginButton = '[data-testid="login-button"]';

  async login(email: string, password: string) {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
    await this.waitForURL("**/dashboard");
  }
}

// Test
test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login("test@example.com", "password123");
});

// ❌ Bez POM - kod rozprzestrzenia się po wszystkich testach
test("should login", async ({ page }) => {
  await page.fill('[data-testid="email-input"]', "test@example.com");
  await page.fill('[data-testid="password-input"]', "password123");
  await page.click('[data-testid="login-button"]');
});
```

### 🔐 Autentykacja

Globalne setup loguje się raz i zapisuje auth state:

```typescript
// global-setup.ts
const authFile = path.join(__dirname, 'auth.json');
await context.storageState({ path: authFile });

// playwright.config.ts
use: {
  storageState: 'tests/e2e/auth.json',
}
```

### 📸 Visual Testing

```typescript
// Screenshot comparison
await expect(page).toHaveScreenshot('login-page.png');

// Update baseline
npx playwright test --update-snapshots
```

### 🐛 Debugging

```bash
# Debug mode - step through test
npm run e2e:debug

# Trace viewer - replay test actions
npx playwright show-trace trace.zip

# Codegen - record test actions
npm run e2e:codegen
```

### 🔧 Konfiguracja

Plik: `playwright.config.ts`

```typescript
- timeout: 30s - timeout dla testu
- expect.timeout: 5s - timeout dla asercji
- retries: 2 (w CI) - retry na fail
- trace: 'on-first-retry' - nagrywaj trace na fail
- screenshot: 'only-on-failure' - screenshot na fail
- video: 'retain-on-failure' - video na fail
```

### ✍️ Przykład testu

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");

    // Assert
    expect(page.url()).toContain("/dashboard");
  });

  test("should show error with invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.enterEmail("wrong@example.com");
    await loginPage.enterPassword("wrongpass");
    await loginPage.clickLoginButton();

    expect(await loginPage.isErrorVisible()).toBeTruthy();
  });
});
```

### 💡 Best Practices

1. **Używaj data-testid dla selektorów**

   ```typescript
   // ✅ Resilient
   [data-testid="login-button"]

   // ❌ Fragile
   button.btn-primary
   .form-section > div:nth-child(2) > button
   ```

2. **Browser contexts dla izolacji**

   ```typescript
   // ✅ Każdy test ma czysty stan
   test("test1", async ({ browser }) => {
     const context = await browser.newContext();
     const page = await context.newPage();
   });

   // ❌ Test mogą wpływać na siebie
   ```

3. **Proper waits dla async operacji**

   ```typescript
   // ✅ Czekaj na element
   await page.waitForSelector('[data-testid="result"]');
   await page.waitForURL("**/dashboard");

   // ❌ Fixed delays
   await page.waitForTimeout(5000);
   ```

4. **API testing dla backend validation**

   ```typescript
   // ✅ Szybkiej i niezawodne
   const response = await request.post("/api/login", {
     data: { email, password },
   });
   expect(response.status()).toBe(200);

   // ❌ UI-only testing - powolne
   ```

5. **Meaningful assertions**

   ```typescript
   // ✅ Czysta asercja
   expect(page.url()).toContain("/dashboard");
   expect(await loginPage.isErrorVisible()).toBeTruthy();

   // ❌ Nieczysta
   expect(await page.textContent("body")).toBeTruthy();
   ```

---

## Best Practices

### Coverage

Minimalne wymagane pokrycie:

- **Walidacje Zod**: ≥80%
- **API helpers**: ≥80%
- **Utils**: ≥80%
- **Krytyczne reguły biznesowe**: >80%

Nie dążyć do 100% pokrycia - fokus na testowaniu ważnych scenariuszy.

```bash
# Generowanie coverage raportu
npm run test:coverage

# Raport HTML
open coverage/index.html
```

### Watch Mode

Podczas development-u używaj watch mode-u:

```bash
# Watch all tests
npm test

# Watch specific tests
npm test -t "LoginPage"

# UI mode - wizualna nawigacja
npm run test:ui
```

### Naming Convention

```
✅ Good
- should add two numbers correctly
- should throw error on invalid email
- should navigate to dashboard on login
- should handle network errors gracefully

❌ Bad
- test1
- login
- doesNotThrowError
- anotherTest
```

---

## CI/CD Integration

### GitHub Actions

Testy uruchamiają się automatycznie na każdy push/PR.

```yaml
# .github/workflows/test.yml
- run: npm run test:run # Unit tests
- run: npm run e2e # E2E tests
```

### Zmienne środowiskowe dla testów

```bash
# .env.test
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123456
TEST_BASE_URL=http://localhost:3000
```

### Reporter-y

```
Unit Tests:
  - Console output (list)
  - HTML report: coverage/index.html
  - Coverage: coverage/lcov-report/index.html

E2E Tests:
  - HTML report: test-results/index.html
  - JUnit: test-results/junit.xml
  - JSON: test-results/results.json
```

---

## Troubleshooting

### Test się "flakuje" (czasem pasa, czasem pada)

```typescript
// ✅ Użyj proper waits
await page.waitForURL("**/dashboard");
await page.waitForLoadState("networkidle");

// ❌ Unikaj
await page.waitForTimeout(2000);
```

### Screenshot comparison fails

```bash
# Zaktualizuj baseline-y
npx playwright test --update-snapshots

# Porównaj
npx playwright test --headed
```

### Timeout errors

```bash
# Zwiększ timeout w playwright.config.ts
timeout: 60 * 1000,

# Lub dla specificznego testu
test.setTimeout(60000);
```

### "Element not found" errors

```typescript
// ✅ Używaj data-testid
[data-testid="element"]

// Sprawdź selektor
await page.pause();  // Pauza do manualne inspektuje
```

---

## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Zod Validation Docs](https://zod.dev/)

---

**Ostatnia aktualizacja**: 16.10.2025
