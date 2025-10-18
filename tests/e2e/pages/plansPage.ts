import { BasePage } from "./basePage";

/**
 * PLANS PAGE OBJECT
 *
 * Enkapsuluje wszystkie operacje na stronie listy planów treningowych (/plans).
 * Zawiera metody do interakcji z kartami planów, ich aktywacją/usuwaniem,
 * oraz nawigacją do kreatora nowego planu.
 */

export class PlansPage extends BasePage {
  // Selektory - nagłówek i container
  private readonly pageHeader = '[data-testid="plans-page-header"]';
  private readonly pageContainer = '[data-testid="plans-page-container"]';
  private readonly loadingIndicator = '[data-testid="plans-loading-indicator"]';
  private readonly errorMessage = '[data-testid="plans-error-message"]';

  // Selektory - grid i karty
  private readonly plansGrid = '[data-testid="plans-grid"]';
  private readonly addNewPlanButton = '[data-testid="add-new-plan-button"]';

  /**
   * Nawiguj do strony planów
   */
  async goto() {
    await this.page.goto("/plans");
  }

  /**
   * Poczekaj na załadowanie strony
   */
  async waitForPageLoad() {
    await this.waitForElement(this.pageContainer);
    // Wait for loading indicator to disappear or for content to appear
    await Promise.race([
      this.page.waitForSelector(this.loadingIndicator, { state: "hidden", timeout: 10000 }).catch(() => null),
      this.page.waitForSelector(this.plansGrid, { timeout: 10000 }).catch(() => null),
      this.page.waitForSelector(this.addNewPlanButton, { timeout: 10000 }).catch(() => null),
    ]);
    // Additional wait to ensure React has finished rendering
    await this.wait(300);
  }

  /**
   * Sprawdź czy strona się ładuje
   */
  async isLoading() {
    return await this.isVisible(this.loadingIndicator);
  }

  /**
   * Sprawdź czy jest wiadomość o błędzie
   */
  async hasError() {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Pobierz wiadomość błędu
   */
  async getErrorMessage() {
    return await this.getText(this.errorMessage);
  }

  /**
   * Sprawdź czy grid planów jest widoczny
   */
  async isPlansGridVisible() {
    return await this.isVisible(this.plansGrid);
  }

  /**
   * Pobierz ilość kart planów
   */
  async getPlanCardsCount() {
    const count = await this.page.locator('[data-testid^="plan-card-"]').count();
    return count;
  }

  /**
   * Sprawdź czy plan o danym ID istnieje na stronie
   */
  async hasPlanCard(planId: number) {
    const selector = `[data-testid="plan-card-${planId}"]`;
    return await this.isVisible(selector);
  }

  /**
   * Pobierz nazwę planu
   */
  async getPlanName(planId: number) {
    const selector = `[data-testid="plan-name-${planId}"]`;
    return await this.getText(selector);
  }

  /**
   * Pobierz liczbę ćwiczeń w planie
   */
  async getPlanExercisesCount(planId: number) {
    const selector = `[data-testid="plan-exercises-list-${planId}"] p`;
    const count = await this.page.locator(selector).count();
    return count;
  }

  /**
   * Sprawdź czy lista ćwiczeń dla planu jest widoczna
   */
  async isPlanExercisesListVisible(planId: number) {
    const selector = `[data-testid="plan-exercises-list-${planId}"]`;
    return await this.isVisible(selector);
  }

  /**
   * Pobierz details konkretnego ćwiczenia w planie
   */
  async getPlanExerciseDetails(planId: number, exerciseId: number) {
    const selector = `[data-testid="plan-exercise-item-${planId}-${exerciseId}"]`;
    return await this.getText(selector);
  }

  /**
   * Kliknij przycisk "Aktywuj plan"
   */
  async clickActivatePlanButton(planId: number) {
    const selector = `[data-testid="activate-plan-button-${planId}"]`;
    await this.click(selector);
  }

  /**
   * Sprawdź czy przycisk "Aktywuj plan" jest widoczny
   */
  async isActivatePlanButtonVisible(planId: number) {
    const selector = `[data-testid="activate-plan-button-${planId}"]`;
    return await this.isVisible(selector);
  }

  /**
   * Kliknij przycisk "Usuń plan"
   */
  async clickDeletePlanButton(planId: number) {
    const selector = `[data-testid="delete-plan-button-${planId}"]`;
    await this.click(selector);
  }

  /**
   * Potwierdź usunięcie planu (obsługuje dialog)
   */
  async confirmDeletePlan(planId: number) {
    // Obsługuj dialog confirm
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.clickDeletePlanButton(planId);
  }

  /**
   * Anuluj usunięcie planu (reject dialog)
   */
  async cancelDeletePlan(planId: number) {
    // Obsługuj dialog confirm
    this.page.once("dialog", (dialog) => dialog.dismiss());
    await this.clickDeletePlanButton(planId);
  }

  /**
   * Sprawdź czy przycisk "Usuń plan" jest widoczny
   */
  async isDeletePlanButtonVisible(planId: number) {
    const selector = `[data-testid="delete-plan-button-${planId}"]`;
    return await this.isVisible(selector);
  }

  /**
   * Kliknij przycisk "Dodaj nowy plan"
   */
  async clickAddNewPlanButton() {
    await this.click(this.addNewPlanButton);
  }

  /**
   * Sprawdź czy przycisk "Dodaj nowy plan" jest widoczny
   */
  async isAddNewPlanButtonVisible() {
    return await this.isVisible(this.addNewPlanButton);
  }

  /**
   * Dodaj nowy plan (kliknij na "Dodaj nowy plan" i poczekaj na nawigację)
   */
  async addNewPlan() {
    await this.clickAddNewPlanButton();
    await this.waitForURL("**/plans/new");
  }

  /**
   * Sprawdź czy nagłówek strony jest widoczny
   */
  async isHeaderVisible() {
    return await this.isVisible(this.pageHeader);
  }

  /**
   * Pobierz tekst nagłówka
   */
  async getHeaderText() {
    return await this.getText(this.pageHeader);
  }
}
