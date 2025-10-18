import { BasePage } from "./basePage";

/**
 * PLAN WIZARD PAGE OBJECT
 *
 * Enkapsuluje wszystkie operacje na stronie kreatora planu treningowego (/plans/new).
 * Obsługuje wszystkie 3 kroki: Podstawy, Ćwiczenia, Podsumowanie.
 * Zawiera metody do wypełniania pól formularza, dodawania ćwiczeń i nawigacji między krokami.
 */

export class PlanWizardPage extends BasePage {
  // Selektory - formualrz i główne elementy
  private readonly wizardForm = '[data-testid="plan-wizard-form"]';

  // Selektory - Krok 1: Podstawy
  private readonly planNameInput = '[data-testid="plan-name-input"]';
  private readonly scheduleDayCheckbox = (day: number) => `[data-testid="schedule-day-${day}"]`;

  // Selektory - Krok 2: Ćwiczenia
  private readonly addExercisesButton = '[data-testid="add-exercises-button"]';
  private readonly emptyExercisesMessage = '[data-testid="empty-exercises-message"]';

  // Selektory - Krok 3: Podsumowanie
  private readonly summaryPlanName = '[data-testid="summary-plan-name"]';
  private readonly summaryExercisesCount = '[data-testid="summary-exercises-count"]';
  private readonly summaryTotalSets = '[data-testid="summary-total-sets"]';
  private readonly summaryEstimatedTime = '[data-testid="summary-estimated-time"]';

  // Selektory - przyciski nawigacji
  private readonly backButton = '[data-testid="wizard-back-button"]';
  private readonly nextButton = '[data-testid="wizard-next-button"]';

  /**
   * Nawiguj do strony kreatora planu
   */
  async goto() {
    await this.page.goto("/plans/new");
  }

  /**
   * Poczekaj na załadowanie formularza kreatora
   */
  async waitForWizardLoad() {
    await this.waitForElement(this.wizardForm);
    // Wait for the first checkbox to be visible and enabled (form is fully interactive)
    await this.page.waitForSelector(this.scheduleDayCheckbox(1), { state: "visible", timeout: 5000 });
    // Additional wait to ensure react-hook-form is fully initialized
    await this.wait(500);
  }

  /**
   * Sprawdź czy formularz jest widoczny
   */
  async isWizardFormVisible() {
    return await this.isVisible(this.wizardForm);
  }

  // ============ KROK 1: PODSTAWY ============

  /**
   * Wpisz nazwę planu
   */
  async enterPlanName(name: string) {
    const input = this.page.locator(this.planNameInput);

    // Try up to 3 times to fill the input correctly
    for (let attempt = 0; attempt < 3; attempt++) {
      // Clear and fill the input
      await input.clear();
      await this.wait(100);
      await input.fill(name);
      await this.wait(200);

      // Verify the value was set correctly
      const value = await input.inputValue();
      if (value === name) {
        return; // Success!
      }

      // If not successful, wait a bit longer before retry
      await this.wait(1000);
    }

    // If we still haven't succeeded, throw an error
    throw new Error(`Failed to enter plan name "${name}" after 3 attempts`);
  }

  /**
   * Pobierz wartość nazwy planu
   */
  async getPlanNameValue() {
    return await this.getValue(this.planNameInput);
  }

  /**
   * Zaznacz dzień tygodnia (0-6, gdzie 0 = niedziela)
   * Wartości: 0=Nd, 1=Pn, 2=Wt, 3=Śr, 4=Cz, 5=Pt, 6=So
   */
  async selectScheduleDay(day: number) {
    const selector = this.scheduleDayCheckbox(day);

    // Try up to 3 times to check the checkbox
    for (let attempt = 0; attempt < 3; attempt++) {
      const isChecked = await this.page.isChecked(selector);
      if (isChecked) {
        return; // Already checked, success!
      }

      // Click the checkbox
      await this.click(selector);
      await this.wait(300);

      // Verify it was checked
      const nowChecked = await this.page.isChecked(selector);
      if (nowChecked) {
        return; // Success!
      }

      // Wait before retry
      await this.wait(200);
    }

    throw new Error(`Failed to select schedule day ${day} after 3 attempts`);
  }

  /**
   * Usuń zaznaczenie dnia tygodnia
   */
  async unselectScheduleDay(day: number) {
    const selector = this.scheduleDayCheckbox(day);

    // Try up to 3 times to uncheck the checkbox
    for (let attempt = 0; attempt < 3; attempt++) {
      const isChecked = await this.page.isChecked(selector);
      if (!isChecked) {
        return; // Already unchecked, success!
      }

      // Click the checkbox
      await this.click(selector);
      await this.wait(300);

      // Verify it was unchecked
      const nowUnchecked = !(await this.page.isChecked(selector));
      if (nowUnchecked) {
        return; // Success!
      }

      // Wait before retry
      await this.wait(200);
    }

    throw new Error(`Failed to unselect schedule day ${day} after 3 attempts`);
  }

  /**
   * Sprawdź czy dzień jest zaznaczony
   */
  async isScheduleDaySelected(day: number) {
    const selector = this.scheduleDayCheckbox(day);
    return await this.page.isChecked(selector);
  }

  /**
   * Zaznacz wiele dni naraz
   */
  async selectScheduleDays(days: number[]) {
    for (const day of days) {
      await this.selectScheduleDay(day);
    }
  }

  /**
   * Pobierz zaznaczone dni tygodnia
   */
  async getSelectedScheduleDays() {
    const selectedDays: number[] = [];
    for (let i = 0; i < 7; i++) {
      const isSelected = await this.isScheduleDaySelected(i);
      if (isSelected) {
        selectedDays.push(i);
      }
    }
    return selectedDays;
  }

  // ============ KROK 2: ĆWICZENIA ============

  /**
   * Kliknij przycisk "Dodaj ćwiczenia"
   */
  async clickAddExercisesButton() {
    await this.click(this.addExercisesButton);
  }

  /**
   * Sprawdź czy przycisk "Dodaj ćwiczenia" jest widoczny
   */
  async isAddExercisesButtonVisible() {
    return await this.isVisible(this.addExercisesButton);
  }

  /**
   * Sprawdź czy wiadomość "Brak ćwiczeń" jest widoczna
   */
  async isEmptyExercisesMessageVisible() {
    return await this.isVisible(this.emptyExercisesMessage);
  }

  /**
   * Pobierz liczbę dodanych ćwiczeń
   */
  async getExercisesCount() {
    const count = await this.page.locator('[class*="border"][class*="rounded"]').count();
    // Rough estimate - dokładniej działało by z data-testid
    return Math.max(0, count - 2); // Subtract form container and other elements
  }

  // ============ KROK 3: PODSUMOWANIE ============

  /**
   * Pobierz tekst podsumowania (nazwa planu)
   */
  async getSummaryPlanName() {
    return await this.getText(this.summaryPlanName);
  }

  /**
   * Pobierz tekst podsumowania (liczba ćwiczeń)
   */
  async getSummaryExercisesCount() {
    return await this.getText(this.summaryExercisesCount);
  }

  /**
   * Pobierz tekst podsumowania (łączna liczba serii)
   */
  async getSummaryTotalSets() {
    return await this.getText(this.summaryTotalSets);
  }

  /**
   * Pobierz tekst podsumowania (szacowany czas)
   */
  async getSummaryEstimatedTime() {
    return await this.getText(this.summaryEstimatedTime);
  }

  /**
   * Sprawdź czy krok podsumowania jest widoczny
   */
  async isSummaryStepVisible() {
    return (await this.isVisible(this.summaryPlanName)) && (await this.isVisible(this.summaryExercisesCount));
  }

  // ============ NAWIGACJA ============

  /**
   * Kliknij przycisk "Wstecz"
   */
  async clickBackButton() {
    await this.click(this.backButton);
  }

  /**
   * Kliknij przycisk "Dalej" / "Zakończ"
   */
  async clickNextButton() {
    await this.click(this.nextButton);
  }

  /**
   * Sprawdź czy przycisk "Wstecz" jest disabled
   */
  async isBackButtonDisabled() {
    return await this.page.isDisabled(this.backButton);
  }

  /**
   * Sprawdź czy przycisk "Dalej" / "Zakończ" jest disabled
   */
  async isNextButtonDisabled() {
    return await this.page.isDisabled(this.nextButton);
  }

  /**
   * Pobierz tekst przycisku "Dalej" / "Zakończ"
   */
  async getNextButtonText() {
    return await this.getText(this.nextButton);
  }

  /**
   * Przejdź do następnego kroku
   */
  async goToNextStep() {
    await this.clickNextButton();
    await this.wait(300); // Czekaj na animację
  }

  /**
   * Wróć do poprzedniego kroku
   */
  async goToPreviousStep() {
    await this.clickBackButton();
    await this.wait(300); // Czekaj na animację
  }

  // ============ FULL WORKFLOW ============

  /**
   * Wypełnij krok 1 (Podstawy)
   */
  async fillStep1(planName: string, scheduleDays: number[]) {
    await this.enterPlanName(planName);
    await this.selectScheduleDays(scheduleDays);
  }

  /**
   * Przejdź przez krok 1 i idź do kroku 2
   */
  async completeStep1(planName: string, scheduleDays: number[]) {
    await this.fillStep1(planName, scheduleDays);
    await this.goToNextStep();
  }

  /**
   * Poczekaj aż strona załaduje i przejdź przez wszystkie kroki (bez ćwiczeń)
   */
  async startWizard(planName: string, scheduleDays: number[]) {
    await this.waitForWizardLoad();
    await this.completeStep1(planName, scheduleDays);
  }

  /**
   * Zaloguj się, przejdź do kreatora i wypełnij podstawowe info
   */
  async setupWizardAtStep2(planName: string, scheduleDays: number[]) {
    await this.goto();
    await this.startWizard(planName, scheduleDays);
  }

  /**
   * Utwórz plan bez ćwiczeń (Test: tworzenie planu z błędem - brak ćwiczeń)
   */
  async attemptCreatePlanWithoutExercises(planName: string, scheduleDays: number[]) {
    await this.setupWizardAtStep2(planName, scheduleDays);
    // Brak dodania ćwiczeń
    // Przejdź do kroku 3 (podsumowanie)
    await this.goToNextStep();
    // Spróbuj wysłać (przycisk powinien być disabled)
    return await this.isNextButtonDisabled();
  }

  /**
   * Pobierz aktualny URL
   */
  async getCurrentURL() {
    return await this.page.url();
  }

  /**
   * Sprawdź czy jesteśmy na stronie kreatora planu
   */
  async isOnWizardPage() {
    const url = await this.getCurrentURL();
    return url.includes("/plans/new");
  }
}
