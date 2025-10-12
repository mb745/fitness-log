# Plan implementacji widoku Kreator Planów Treningowych

## 1. Przegląd
Widok umożliwia tworzenie oraz edycję planu treningowego. Wariant mobilny wykorzystuje 4-krokowy wizard, desktop – pojedynczą stronę z sekcjami. Formularz wspiera auto-zapis, walidację Zod i drag-and-drop kolejności ćwiczeń.

## 2. Routing widoku
- **Nowy plan:** `/plans/new`
- **Edycja:** `/plans/:id/edit`

## 3. Struktura komponentów (mobile wizard)
```
PlanWizard
 ├── StepperHeader
 ├── StepContent (switch by step)
 │    ├── StepBasics
 │    ├── StepExercisePicker
 │    ├── StepConfiguration
 │    └── StepSummary
 └── WizardFooter (Back / Next / Save)
```
Desktop: `PlanFormPage` renderuje wszystkie sekcje w kolejności.

## 4. Szczegóły komponentów
### StepBasics
- **Pola:** Nazwa (input), Typ harmonogramu (radio weekly/interval), Days picker lub Interval days.
- **Walidacja:** Nazwa wymag., unikalna wśród user (validate async na blur), XOR days vs interval.
- **Typy:** `WorkoutPlanCreateCommand` subset.

### StepExercisePicker
- **Opis:** Button „Dodaj ćwiczenia” otwiera `ExerciseLibraryModal`.
- **Stan:** lista wybranych ćwiczeń (minimalnie 1).

### StepConfiguration
- **Opis:** Edycja parametrów każdego ćwiczenia.
- **Elementy:** `DraggableExerciseList` → `ExerciseConfigRow`.
- **Walidacja:** target_sets>0, target_reps>0.
- **Drag-and-drop:** użyj `@dnd-kit`.

### StepSummary
- **Opis:** podsumowanie planu, szacowany czas (sets × rest).

### Auto-save Indicator
- Toast lub label „Zapisano” / „Zapisywanie…” (debounce 2 s).

## 5. Typy
`WorkoutPlanCreateCommand`, `WorkoutPlanUpdateCommand`, `PlanExerciseCreateInput` plus lokalny `PlanDraftVM` (dodaje pole `isDirty`).

## 6. Zarządzanie stanem
- `usePlanDraft(id?)` hook → zustand store z persystencją w localStorage (`plans/new`).
- Throttled effect zapisujący POST (create) lub PATCH (update) co 2 s jeśli `isDirty`.
- React Hook Form + ZodResolver (`workoutPlanSchema`).

## 7. Integracja API
| Scenariusz | Endpoint | Metoda |
|------------|----------|--------|
| Create | `/api/v1/workout-plans` | POST |
| Update | `/api/v1/workout-plans/:id` | PATCH |
| Bulk replace exercises | `/api/v1/workout-plans/:id/exercises` | POST |

## 8. Interakcje użytkownika
- Na mobile „Dalej” waliduje krok; „Zakończ” śle final save i redirect `/plans`.
- Drag ćwiczenia → aktualizuje order_index, oznacza draft dirty.
- Close/route away → prompt jeśli dirty.

## 9. Warunki i walidacja
- ≥1 exercise w podsumowaniu.
- schedule_days wymagane przy weekly, interval_days przy interval.
- Unikalność order_index.

## 10. Obsługa błędów
- 409 przy create (duplikat nazwy) → pokaz inline error.
- 422 biznes (brak exercises) → toast error.
- Autosave fail (network) → banner „Offline – zapiszę później”.

## 11. Kroki implementacji
1. Zdefiniuj `workoutPlanSchema` w `src/lib/validation/workout-plan.validation.ts`.
2. Stwórz hook `usePlanDraft` i komponent `PlanWizard`.
3. Implementuj sekcje i desktop form.
4. Podłącz auto-save z debounced mutation.
5. Testy unit wizard nav + schema validation.
6. dnd-kit implementacja drag listy.
7. Storybook + e2e happy path create / edit.
