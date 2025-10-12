# Plan implementacji widoku Szczegóły Sesji Treningowej

## 1. Przegląd

Pokazuje pełne dane pojedynczego treningu w historii, w tym listę ćwiczeń i wyników serii.

## 2. Routing

- `/history/:sessionId`

## 3. Struktura komponentów

```
SessionDetailsPage
 ├── SessionHeader
 ├── ExerciseResultsTable × n
 └── StagnationBadge (optional)
```

## 4. Szczegóły komponentów

### ExerciseResultsTable

- Kolumny: Set, Target, Actual, Weight, Status.
- Responsive: horizontal scroll on mobile.

### StagnationBadge

- Klik → StagnationAlertModal.

## 5. Typy

- `WorkoutSessionDetailDTO`.

## 6. Stan

- `useSessionDetails(id)` → GET detail endpoint.

## 7. API

`GET /api/v1/workout-sessions/:id`

## 8. Interakcje

- Badge click modal.

## 9. Błędy

- 404 → redirect History + toast.

## 10. Kroki

1. Route page.
2. Table component.
3. Fetch hook + skeleton.
4. Badge logic.
