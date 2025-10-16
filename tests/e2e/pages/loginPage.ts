import { Page } from "@playwright/test";
import { BasePage } from "./basePage";

/**
 * LOGIN PAGE OBJECT
 *
 * Enkapsuluje wszystkie operacje na stronie logowania.
 * Ułatwia pisanie testów i zmianę selektorów w jednym miejscu.
 */

export class LoginPage extends BasePage {
  // Selektory
  private readonly emailInput = '[data-testid="email-input"]';
  private readonly passwordInput = '[data-testid="password-input"]';
  private readonly loginButton = '[data-testid="login-button"]';
  private readonly errorMessage = '[data-testid="error-message"]';
  private readonly registerLink = '[data-testid="register-link"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Naviguj do strony logowania
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Wpisz email
   */
  async enterEmail(email: string) {
    await this.fill(this.emailInput, email);
  }

  /**
   * Wpisz hasło
   */
  async enterPassword(password: string) {
    await this.fill(this.passwordInput, password);
  }

  /**
   * Kliknij przycisk logowania
   */
  async clickLoginButton() {
    await this.click(this.loginButton);
  }

  /**
   * Zaloguj się (kombinacja wszystkich kroków)
   */
  async login(email: string, password: string) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLoginButton();

    // Poczekaj na redirekcję do dashboard
    await this.waitForURL("**/dashboard");
  }

  /**
   * Pobierz wiadomość błędu
   */
  async getErrorMessage() {
    return await this.getText(this.errorMessage);
  }

  /**
   * Sprawdź czy wiadomość błędu jest widoczna
   */
  async isErrorVisible() {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Kliknij link do rejestracji
   */
  async clickRegisterLink() {
    await this.click(this.registerLink);
  }
}
