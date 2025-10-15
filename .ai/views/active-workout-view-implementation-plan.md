# Plan implementacji widoku Active Workout

## 1. Przegląd

Kluczowy widok umożliwiający użytkownikowi wykonywanie zaplanowanego treningu w czasie rzeczywistym: rejestrację serii, obsługę timera przerw, śledzenie postępu i zakończenie lub porzucenie sesji.

## 2. Routing widoku

- **Ścieżka:** `/workout/:id/active`
- **Parametry:** `id` – identyfikator sesji.

## 3. Struktura komponentów

```
ActiveWorkoutPage
 ├── FixedHeader
 │    ├── ProgressBar
 │    └── AbandonButton
 ├── ScrollArea
 │    ├── RestTimer (sticky when active)
 │    └── ExerciseList
 │         ├── ExerciseSection × n
 │         │     └── SessionSetRow × m
 ├── FixedFooter (mobile) – FinishButton
 └── ConfirmationDialogs (finish / abandon)
```

## 4. Szczegóły komponentów

### SessionSetRow

- Inputs: `NumberInput reps`, `NumberInput weight_kg`.
- Buttons: Complete ✓, Skip ⊘.
- Auto‐save: debounce 500 ms → `PATCH /session-sets/:id` (optimistic update).
- Validation: reps ≥0; weight ≥0.

### RestTimer

- Startuje automatycznie po ukończeniu serii (status completed).
- Controls: +30 s / –30 s / Pause / Skip.
- ARIA `role="timer"` ; live region polite.

### ProgressBar

- (completed+skipped)/total sets.
- Text „12 / 20 serii”.

### FixedFooter

- Button „Zakończ trening” – disabled jeśli mutation busy.

## 5. Typy

- `WorkoutSessionDetailDTO` (sesja + sets).
- `SessionSetDTO`.
- `ActiveWorkoutContext` VM `{ session:WorkoutSessionDetailDTO; currentSetId:number; timer?:TimerState; offlineQueue:SessionSetUpdateCommand[] }`.

## 6. Zarządzanie stanem

- Context `ActiveWorkoutProvider` (zustand) – persist do `localStorage('active-workout/:id')`.
- Sync interval 30 s: flush offline queue.
- EventEmitter dla timer tick.

## 7. Integracja API

| Akcja            | Endpoint                                | Metoda |
| ---------------- | --------------------------------------- | ------ |
| Pobierz sesję    | `/api/v1/workout-sessions/:id`          | GET    |
| Patch set        | `/api/v1/session-sets/:id`              | PATCH  |
| Complete session | `/api/v1/workout-sessions/:id/complete` | POST   |
| Abandon session  | `/api/v1/workout-sessions/:id/abandon`  | POST   |

## 8. Interakcje użytkownika

- Ukończ serię → start timer.
- Edycja pola → debounce PATCH.
- Skipped seria → status skipped, brak timera.
- Finish → ConfirmDialog; gdy nie wszystkie completed, show warning.
- Abandon → ConfirmDialog.

## 9. Warunki i walidacja

- Session status musi pozostać `in_progress`; inaczej redirect Dashboard.
- Timer nie renderuje po ostatniej serii.
- Offline: queue local updates; banner offline.

## 10. Obsługa błędów

- 403 (session not in_progress) → toast + redirect.
- 422 (invalid transition) → rollback optimistic.
- Network offline → store in queue, show banner.

## 11. Kroki implementacji

1. API hooks: `useActiveSession(id)`, `usePatchSet`, `useCompleteSession`.
2. Zaimplementuj context i persist.
3. Zbuduj komponenty UI (Header, ProgressBar, RestTimer, SessionSetRow, etc.).
4. Hook `useRestTimer` (manages countdown).
5. Implement optimistic updates & queue offline.
6. Accessibility test (keyboard, screen reader).
7. Perf: memo Section rows.
8. E2E scenario happy path & offline.
