import { test, expect } from "@playwright/test";
import { PlansPage } from "../pages/plansPage";
import { PlanWizardPage } from "../pages/planWizardPage";

/**
 * PRZYKŁADOWE TESTY DLA PLANS I PLAN WIZARD
 *
 * Te testy demonstrują użycie Page Object Model pattern
 * przy testowaniu widoku /plans oraz kreatora planu /plans/new
 */

test.describe("Plan Wizard - Page Object Model Examples", () => {
  test.use({ storageState: `../fitness-log/tests/e2e/auth.json` });

  let plansPage: PlansPage;
  let wizard: PlanWizardPage;

  test.beforeEach(async ({ page }) => {
    plansPage = new PlansPage(page);
    wizard = new PlanWizardPage(page);
  });

  test("Navigate to plans page and verify layout", async () => {
    // Test - przejdź do planów
    await plansPage.goto();
    await plansPage.waitForPageLoad();

    // Assertions
    expect(await plansPage.isHeaderVisible()).toBe(true);
    expect(await plansPage.getHeaderText()).toContain("Plany Treningowe");

    // The grid might not be visible if empty, but the "Add new plan" button should always be visible
    const isGridVisible = await plansPage.isPlansGridVisible();
    const isAddButtonVisible = await plansPage.isAddNewPlanButtonVisible();

    expect(isGridVisible || isAddButtonVisible).toBe(true);
    expect(isAddButtonVisible).toBe(true);
  });

  test("Navigate to plan wizard from plans page", async () => {
    // Setup
    await plansPage.goto();

    // Test - kliknij "Dodaj nowy plan"
    await plansPage.addNewPlan();

    // Assertions
    expect(await wizard.isWizardFormVisible()).toBe(true);
    expect(await wizard.isOnWizardPage()).toBe(true);
  });

  test("Fill plan wizard step 1", async () => {
    // Setup
    await wizard.goto();
    await wizard.waitForWizardLoad();

    // Test - wypełnij krok 1
    const planName = "Upper Body - Test Plan";
    const scheduleDays = [1, 3, 5]; // Poniedziałek, Środa, Piątek

    await wizard.enterPlanName(planName);
    await wizard.selectScheduleDays(scheduleDays);

    // Assertions
    expect(await wizard.getPlanNameValue()).toBe(planName);
    expect(await wizard.getSelectedScheduleDays()).toEqual(scheduleDays);

    // Verify button is enabled to go to next step
    expect(await wizard.isNextButtonDisabled()).toBe(false);
  });

  test("Navigate through wizard steps", async () => {
    // Setup
    await wizard.setupWizardAtStep2("Test Plan", [1, 2, 3]);

    // We should be on step 2 now
    expect(await wizard.isAddExercisesButtonVisible()).toBe(true);
    expect(await wizard.isEmptyExercisesMessageVisible()).toBe(true);

    // Test - wróć do kroku 1
    await wizard.goToPreviousStep();
    expect(await wizard.isBackButtonDisabled()).toBe(true); // Na kroku 1, przycisk "Wstecz" disabled

    // Test - idź do kroku 2
    await wizard.goToNextStep();
    expect(await wizard.isEmptyExercisesMessageVisible()).toBe(true);
  });

  test("Verify wizard summary step", async () => {
    // Setup - przejdź do kroku 3 (podsumowanie)
    await wizard.goto();
    await wizard.completeStep1("Full Body Workout", [1, 3, 5]);

    // Idź przez krok 2 (bez dodawania ćwiczeń - jeśli możliwe)
    // await wizard.goToNextStep();

    // Test - sprawdź czy podsumowanie jest widoczne
    // expect(await wizard.isSummaryStepVisible()).toBe(true);

    // Assertions
    // expect(await wizard.getSummaryPlanName()).toContain('Full Body Workout');
  });

  test("Get plan cards from plans page", async () => {
    // Setup
    await plansPage.goto();
    await plansPage.waitForPageLoad();

    // Test - pobierz liczbę planów
    const planCount = await plansPage.getPlanCardsCount();

    // Assertions - jeśli są plany
    if (planCount > 0) {
      // Możemy pobrać szczegóły pierwszego planu (jeśli znamy ID)
      const firstPlanId = 1; // Przykładowy ID
      if (await plansPage.hasPlanCard(firstPlanId)) {
        const planName = await plansPage.getPlanName(firstPlanId);
        expect(planName).toBeTruthy();
      }
    }
  });
});

test.describe("Plans Page - CRUD Operations", () => {
  test.use({ storageState: `../fitness-log/tests/e2e/auth.json` });
  let plansPage: PlansPage;

  test.beforeEach(async ({ page }) => {
    plansPage = new PlansPage(page);

    // Login
    await plansPage.goto();
  });

  test("Check plan visibility and details", async () => {
    // Test - sprawdź czy plany się ładują
    await plansPage.waitForPageLoad();

    const isGridVisible = await plansPage.isPlansGridVisible();
    const isAddButtonVisible = await plansPage.isAddNewPlanButtonVisible();

    // Either the grid should be visible (if there are plans) or the add button should be visible
    expect(isGridVisible || isAddButtonVisible).toBe(true);

    // Test - jeśli istnieją plany, pobrań ich detale
    const planCount = await plansPage.getPlanCardsCount();
    if (planCount > 0) {
      // Znalezienie pierwszego planu - wymagane znanie jego ID
      const firstPlanId = 1;
      const hasCard = await plansPage.hasPlanCard(firstPlanId);

      if (hasCard) {
        const name = await plansPage.getPlanName(firstPlanId);
        expect(name).toBeTruthy();

        // Sprawdzenie czy ćwiczenia są załadowane
        const exercisesVisible = await plansPage.isPlanExercisesListVisible(firstPlanId);
        if (exercisesVisible) {
          await plansPage.getPlanExercisesCount(firstPlanId);
        }
      }
    }
  });

  test("Test cancel delete plan", async () => {
    // Setup - jeśli znamy ID planu
    const testPlanId = 1;

    if (await plansPage.hasPlanCard(testPlanId)) {
      // Test - spróbuj usunąć ale anuluj
      await plansPage.cancelDeletePlan(testPlanId);

      // Assertions - plan powinien nadal istnieć
      const stillExists = await plansPage.hasPlanCard(testPlanId);
      expect(stillExists).toBe(true);
    }
  });
});
