import { Page, BrowserContext } from "@playwright/test";

/**
 * BASE PAGE CLASS
 *
 * Klasa bazowa dla Page Object Model.
 * Zawiera wspólne metody używane przez wszystkie page objects.
 */

export class BasePage {
  protected page: Page;
  protected context: BrowserContext;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
  }

  /**
   * Naviguj do URL
   */
  async goto(url: string) {
    await this.page.goto(url);
  }

  /**
   * Poczekaj na element
   */
  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Kliknij element
   */
  async click(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Wpisz tekst
   */
  async fill(selector: string, text: string) {
    await this.page.fill(selector, text);
  }

  /**
   * Pobierz wartość z input
   */
  async getValue(selector: string) {
    return await this.page.inputValue(selector);
  }

  /**
   * Pobierz tekst elementu
   */
  async getText(selector: string) {
    return await this.page.textContent(selector);
  }

  /**
   * Sprawdź czy element jest widoczny
   */
  async isVisible(selector: string) {
    return await this.page.isVisible(selector);
  }

  /**
   * Poczekaj na URL
   */
  async waitForURL(urlPattern: string | RegExp, timeout = 5000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Pobierz aktualny URL
   */
  async getCurrentURL() {
    return this.page.url();
  }

  /**
   * Odśwież stronę
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Cofnij stronę
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Poczekaj określoną ilość czasu
   */
  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Weź screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
