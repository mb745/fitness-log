import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";

/**
 * EXAMPLE E2E TEST
 *
 * Plik demonstracyjny pokazujący best practices dla testów e2e w Playwright.
 *
 * Wytyczne:
 * - Page Object Model dla maintainability
 * - Locators zamiast CSS selektorów
 * - data-testid dla resilient element selection
 * - Browser contexts dla test isolation
 * - Proper waits dla asynchronicznych operacji
 * - Meaningful assertion messages
 */

test.describe("Authentication", () => {
  /**
   * Test logowania
   */
  test.describe("Login Flow", () => {
    test("should display login form", async ({ page }) => {
      // Arrange
      const loginPage = new LoginPage(page);

      // Act
      await loginPage.goto();

      // Assert
      expect(await loginPage.isVisible('[data-testid="email-input"]')).toBeTruthy();
      expect(await loginPage.isVisible('[data-testid="password-input"]')).toBeTruthy();
      expect(await loginPage.isVisible('[data-testid="login-button"]')).toBeTruthy();
    });

    test("should show error with invalid credentials", async ({ page }) => {
      // Arrange
      const loginPage = new LoginPage(page);
      const invalidEmail = "invalid@example.com";
      const invalidPassword = "wrongpassword";

      // Act
      await loginPage.goto();
      await loginPage.enterEmail(invalidEmail);
      await loginPage.enterPassword(invalidPassword);
      await loginPage.clickLoginButton();

      // Assert
      const errorVisible = await loginPage.isErrorVisible();
      expect(errorVisible).toBeTruthy();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain("Invalid credentials");
    });

    test("should navigate to dashboard on successful login", async ({ page, context }) => {
      // Arrange - czytaj auth state z globalnego setup
      await context.addCookies([
        {
          name: "session",
          value: "valid_session_token",
          url: "http://localhost:3000",
        },
      ]);

      const loginPage = new LoginPage(page);

      // Act
      await page.goto("/dashboard");

      // Assert
      await page.waitForURL("**/dashboard");
      expect(page.url()).toContain("/dashboard");
    });
  });

  /**
   * Test z visual regression - screenshot comparison
   */
  test("should match login page snapshot", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Visual comparison
    await expect(page).toHaveScreenshot("login-page.png");
  });

  /**
   * Test z browser context - izolacja stanu
   */
  test("should not share state between contexts", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Działania w pierwszym kontekście
    await page1.goto("/login");
    await page1.fill('[data-testid="email-input"]', "user1@example.com");

    // Drugi kontekst powinien być czysty
    await page2.goto("/login");
    const value = await page2.inputValue('[data-testid="email-input"]');
    expect(value).toBe("");

    await context1.close();
    await context2.close();
  });
});

/**
 * Test API - leverage API testing for backend validation
 */
test.describe("API Integration", () => {
  test("should validate login endpoint", async ({ request }) => {
    // Arrange
    const credentials = {
      email: "test@example.com",
      password: "test123456",
    };

    // Act
    const response = await request.post("/api/auth/login", {
      data: credentials,
    });

    // Assert
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("token");
    expect(json).toHaveProperty("user");
  });

  test("should return 401 with invalid credentials", async ({ request }) => {
    // Arrange
    const credentials = {
      email: "wrong@example.com",
      password: "wrongpassword",
    };

    // Act
    const response = await request.post("/api/auth/login", {
      data: credentials,
    });

    // Assert
    expect(response.status()).toBe(401);
  });
});

/**
 * Test z retries dla flaky testów
 */
test.describe("Retry Logic", () => {
  test.describe.configure({ retries: 2 });

  test("should handle network delays", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Symuluj network delay
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 500);
    });

    await loginPage.goto();
    expect(await loginPage.isVisible('[data-testid="login-button"]')).toBeTruthy();
  });
});
