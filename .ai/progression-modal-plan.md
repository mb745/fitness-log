# Plan implementacji modalu Progression

## 1. Przegląd
Modal pojawia się automatycznie po zakończeniu treningu i prezentuje podsumowanie sesji oraz sugestie progresji dla ćwiczeń. Jest niedomykalny, wymaga akcji użytkownika.

## 2. Wywołanie
- Trigger: sukces `POST /workout-sessions/:id/complete`.

## 3. Struktura komponentów
```
ProgressionModal (Shadcn Dialog, non-dismissible)
 ├── SessionSummarySection
 ├── SuggestionsList
 │    └── ExerciseSuggestionRow × n
 ├── ActionsBar (AcceptAll / RejectAll / ApplySelected)
 └── PreferencesLink (disable suggestions)
```

## 4. Szczegóły komponentów
### ExerciseSuggestionRow
- Pola: nazwa ćwiczenia, dzisiaj vs poprzednio, rekomendacja (↑reps/↑kg), checkbox accept.
- Typ: `SuggestionVM { planExerciseId:number; recommendation:"reps"|"weight"; value:number; accepted:boolean }`.

### ActionsBar
- Obsługuje trzy główne akcje:
  - Zaakceptuj wszystkie → PATCH bulk exercises.
  - Odrzuć wszystkie → zamyka modal.
  - Zastosuj wybrane → PATCH tylko zaznaczone.

## 5. Typy
- `SuggestionVM` powyżej.
- `PlanExercisePatchCommand` z `types.ts`.

## 6. Zarządzanie stanem
- Lokalny state listy sugestii (`useReducer`).
- `useProgressionSuggestions(sessionId)` hook – oblicza na froncie lub odbiera z analytics endpoint (spec: klient).

## 7. Integracja API
| Akcja | Endpoint |
|-------|----------|
| Apply suggestions | `/api/v1/workout-plans/:id/exercises/:planExerciseId` | PATCH |

## 8. Interakcje użytkownika
- Checkbox per ćwiczenie.
- Przycisk globalny updates.

## 9. Warunki i walidacja
- Jeśli brak sugestii → modal skip, redirect Dashboard.
- Disable przyciski podczas mutation.

## 10. Obsługa błędów
- PATCH error → toast + pozostaw modal.

## 11. Kroki implementacji
1. Hook generujący rekomendacje na podstawie session sets.
2. Zaimplementuj modal UI.
3. PATCH selected suggestions sequentially (Promise.all).
4. E2E test accepting suggestions.
