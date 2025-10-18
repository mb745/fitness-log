# Scenariusz Testowy: Tworzenie Planu Treningowego

## Opis Scenariusza

Użytkownik tworzy nowy plan treningowy w trzystopniowym kreatorze, a następnie weryfikuje jego pojawienie się na liście planów.

## Kroki Testowe i Atrybuty `data-testid`

### Krok 1: Nawigacja do Strony Planów Treningowych

**URL:** `/plans`

**Elementy do weryfikacji:**

- `data-testid="plans-page-container"` - Główny kontener strony
- `data-testid="plans-page-header"` - Nagłówek "Plany Treningowe"
- `data-testid="plans-grid"` - Grid z planami
- `data-testid="add-new-plan-button"` - Przycisk "Dodaj nowy plan"

**Akcja:**

```javascript
// Kliknij przycisk "Dodaj nowy plan"
await page.click('[data-testid="add-new-plan-button"]');
```

---

### Krok 2: Wizardard - Krok 1 (Podstawy)

**URL:** `/plans/new`
**Kreator:** Krok 1 z 3 - "Podstawy"

#### Elementy do interakcji:

- `data-testid="plan-wizard-form"` - Główny formularz kreatora
- `data-testid="plan-name-input"` - Input na nazwę planu
- `data-testid="schedule-day-2"` - Checkbox dla wtorku (value=2)
- `data-testid="wizard-next-button"` - Przycisk "Dalej"

#### Akcje:

```javascript
// 1. Wpisz nazwę planu
await page.fill('[data-testid="plan-name-input"]', "Mój Plan Treningowy");

// 2. Zaznacz wtorek (value=2)
await page.check('[data-testid="schedule-day-2"]');

// 3. Kliknij "Dalej"
await page.click('[data-testid="wizard-next-button"]');
```

#### Walidacja Kroku 1:

```javascript
// Sprawdź czy wartości zostały zapisane
await expect(page.locator('[data-testid="plan-name-input"]')).toHaveValue("Mój Plan Treningowy");
await expect(page.locator('[data-testid="schedule-day-2"]')).toBeChecked();
```

---

### Krok 3: Wizardard - Krok 2 (Ćwiczenia)

**Kreator:** Krok 2 z 3 - "Ćwiczenia"

#### Elementy do interakcji:

- `data-testid="add-exercises-button"` - Przycisk "Dodaj ćwiczenia"
- `data-testid="empty-exercises-message"` - Komunikat gdy brak ćwiczeń

#### Modał biblioteki ćwiczeń:

- `data-testid="exercise-library-modal"` - Modał ćwiczeń
- `data-testid="exercise-search-input"` - Input do wyszukiwania
- `data-testid="muscle-group-filter"` - Select do filtrowania grupy mięśni
- `data-testid="exercise-list-container"` - Kontener z listą ćwiczeń
- `data-testid="exercise-item-{exerciseId}"` - Pojedyncze ćwiczenie (np. `exercise-item-1`)
- `data-testid="exercise-modal-close-button"` - Przycisk zamknięcia modalu
- `data-testid="exercise-loading-indicator"` - Indykator ładowania
- `data-testid="exercise-no-results"` - Komunikat "Brak wyników"

#### Akcje:

```javascript
// 1. Kliknij "Dodaj ćwiczenia"
await page.click('[data-testid="add-exercises-button"]');

// 2. Czekaj na otwarcie modalu
await expect(page.locator('[data-testid="exercise-library-modal"]')).toBeVisible();

// 3. (Opcjonalnie) Wyszukaj ćwiczenie
await page.fill('[data-testid="exercise-search-input"]', "wyciskanie");

// 4. Kliknij na pierwsze ćwiczenie z listy (np. ID=1)
await page.click('[data-testid="exercise-item-1"]');

// 5. Modał powinien się zamknąć i ćwiczenie powinno się pojawić
await expect(page.locator('[data-testid="exercise-library-modal"]')).not.toBeVisible();
```

#### Walidacja Kroku 2:

```javascript
// Sprawdź czy ćwiczenie zostało dodane (komunikat powinien zniknąć)
await expect(page.locator('[data-testid="empty-exercises-message"]')).not.toBeVisible();
```

---

### Krok 4: Wizardard - Krok 3 (Podsumowanie)

**Kreator:** Krok 3 z 3 - "Podsumowanie"

#### Elementy do weryfikacji:

- `data-testid="summary-plan-name"` - Nazwa planu
- `data-testid="summary-exercises-count"` - Liczba ćwiczeń
- `data-testid="summary-total-sets"` - Łącznie serii
- `data-testid="summary-estimated-time"` - Szacowany czas

#### Akcje:

```javascript
// 1. Kliknij "Dalej" aby przejść do podsumowania
await page.click('[data-testid="wizard-next-button"]');

// 2. Czekaj na widoczność elementów podsumowania
await expect(page.locator('[data-testid="summary-plan-name"]')).toBeVisible();
```

#### Walidacja Kroku 3:

```javascript
// Sprawdź zawartość podsumowania
await expect(page.locator('[data-testid="summary-plan-name"]')).toContainText("Mój Plan Treningowy");
await expect(page.locator('[data-testid="summary-exercises-count"]')).toContainText("1");
```

---

### Krok 5: Potwierdzenie Planu

**Akcja:** Kliknij przycisk "Zakończ"

```javascript
// Kliknij "Zakończ" (przycisk zmienia tekst na ostatnim kroku)
await page.click('[data-testid="wizard-next-button"]');

// Czekaj na przekierowanie do dashboardu lub strony planów
await page.waitForURL(/\/(dashboard|plans)/);
```

---

### Krok 6: Weryfikacja Planu na Liście

**URL:** `/plans`

#### Elementy do weryfikacji:

- `data-testid="plans-grid"` - Grid planów
- `data-testid="plan-card-{planId}"` - Karta planu (np. `plan-card-5`)
- `data-testid="plan-name-{planId}"` - Nazwa planu
- `data-testid="plan-exercises-list-{planId}"` - Lista ćwiczeń
- `data-testid="plan-exercise-item-{planId}-{exerciseId}"` - Pojedyncze ćwiczenie

#### Akcje:

```javascript
// Nawiguj do strony planów
await page.goto("/plans");

// Czekaj na załadowanie gridu
await expect(page.locator('[data-testid="plans-grid"]')).toBeVisible();
```

#### Walidacja Kroku 6:

```javascript
// Sprawdź czy nowy plan się pojawił
const planName = "Mój Plan Treningowy";
const planCard = page.locator('[data-testid="plans-grid"]').locator("text=" + planName);

await expect(planCard).toBeVisible();

// Sprawdź czy ćwiczenie jest widoczne na karcie
await expect(page.locator('[data-testid*="plan-exercises-list-"]')).toBeVisible();
```

---

## Mapowanie `data-testid` do Plików

| data-testid                 | Plik                     | Komponent              |
| --------------------------- | ------------------------ | ---------------------- |
| plan-wizard-form            | PlanWizard.tsx           | form                   |
| plan-name-input             | PlanWizard.tsx           | Input (nazwa)          |
| schedule-day-\*             | PlanWizard.tsx           | Checkbox (dni)         |
| wizard-back-button          | PlanWizard.tsx           | Button (Wstecz)        |
| wizard-next-button          | PlanWizard.tsx           | Button (Dalej/Zakończ) |
| add-exercises-button        | StepExercises.tsx        | Button                 |
| empty-exercises-message     | StepExercises.tsx        | p                      |
| summary-plan-name           | StepSummary.tsx          | p                      |
| summary-exercises-count     | StepSummary.tsx          | p                      |
| summary-total-sets          | StepSummary.tsx          | p                      |
| summary-estimated-time      | StepSummary.tsx          | p                      |
| exercise-library-modal      | ExerciseLibraryModal.tsx | div                    |
| exercise-search-input       | ExerciseLibraryModal.tsx | Input                  |
| muscle-group-filter         | ExerciseLibraryModal.tsx | Select                 |
| exercise-list-container     | ExerciseLibraryModal.tsx | div                    |
| exercise-item-\*            | ExerciseLibraryModal.tsx | div (virtualized item) |
| exercise-modal-close-button | ExerciseLibraryModal.tsx | Button                 |
| exercise-loading-indicator  | ExerciseLibraryModal.tsx | p                      |
| exercise-no-results         | ExerciseLibraryModal.tsx | p                      |
| plans-page-container        | PlansPage.tsx            | div                    |
| plans-page-header           | PlansPage.tsx            | div                    |
| plans-loading-indicator     | PlansPage.tsx            | p                      |
| plans-error-message         | PlansPage.tsx            | p                      |
| plans-grid                  | PlansGrid.tsx            | div                    |
| add-new-plan-button         | PlansGrid.tsx            | Button                 |
| plan-card-\*                | WorkoutPlanCard.tsx      | div                    |
| plan-name-\*                | WorkoutPlanCard.tsx      | h2                     |
| plan-exercises-list-\*      | WorkoutPlanCard.tsx      | div                    |
| plan-exercise-item-\*       | WorkoutPlanCard.tsx      | p                      |
| activate-plan-button-\*     | WorkoutPlanCard.tsx      | Button                 |
| delete-plan-button-\*       | WorkoutPlanCard.tsx      | Button                 |

---

## Notatki do Implementacji Testu Playwright'a

```typescript
// tests/e2e/workout-plan-wizard.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Workout Plan Wizard - Full Scenario", () => {
  test("should create a workout plan and verify it on the list", async ({ page }) => {
    // Step 1: Navigate to plans page
    await page.goto("/plans");

    // Step 2: Click "Add new plan"
    await page.click('[data-testid="add-new-plan-button"]');
    await page.waitForURL("**/plans/new");

    // Step 3: Fill basics - name and day
    await page.fill('[data-testid="plan-name-input"]', "Mój Plan Treningowy");
    await page.check('[data-testid="schedule-day-2"]');
    await page.click('[data-testid="wizard-next-button"]');

    // Step 4: Add exercise
    await page.click('[data-testid="add-exercises-button"]');
    await expect(page.locator('[data-testid="exercise-library-modal"]')).toBeVisible();

    // Select first exercise
    const firstExercise = page.locator('[data-testid^="exercise-item-"]').first();
    await firstExercise.click();
    await page.click('[data-testid="wizard-next-button"]');

    // Step 5: Verify summary
    await expect(page.locator('[data-testid="summary-plan-name"]')).toContainText("Mój Plan Treningowy");

    // Step 6: Submit
    await page.click('[data-testid="wizard-next-button"]');
    await page.waitForURL(/\/(dashboard|plans)/);

    // Step 7: Verify on list
    await page.goto("/plans");
    await expect(page.locator("text=Mój Plan Treningowy")).toBeVisible();
  });
});
```
