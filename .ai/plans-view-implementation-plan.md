# Plan implementacji widoku Lista Planów Treningowych

## 1. Przegląd
Widok pozwala użytkownikowi przeglądać, aktywować oraz usuwać własne plany treningowe. Prezentuje je w postaci kart w siatce z opcją filtrowania nieaktyw­nych planów oraz przyciskiem FAB umożliwiającym przejście do kreatora nowego planu.

## 2. Routing widoku
- **Ścieżka:** `/plans`
- **Ochrona:** wymaga autoryzacji użytkownika.

## 3. Struktura komponentów
```
PlansPage
 ├── HeaderBar (tytuł + toggle „Pokaż nieaktywne”)
 ├── PlansGrid
 │    ├── WorkoutPlanCard × N
 │    └── EmptyState (gdy brak planów)
 └── FloatingActionButton(+)
```

## 4. Szczegóły komponentów
### WorkoutPlanCard
- **Opis:** Karta pojedynczego planu.
- **Elementy:** Nazwa, badge aktywności, harmonogram (tekst), liczba ćwiczeń, menu (⋮) z akcjami.
- **Interakcje:**
  - Click głównej części → `navigate('/plans/:id/edit')`.
  - Menu: „Aktywuj” → `POST /workout-plans/:id/activate`; „Usuń” → `DELETE`.
- **Walidacja:** `disabled` klastra menu podczas pending requestu.
- **Typy:** `WorkoutPlanDTO`, `WorkoutPlanCardProps { plan: WorkoutPlanDTO; onActivate(), onDelete() }`.

### FloatingActionButton
- **Opis:** Przycisk dodania nowego planu.
- **Elementy:** Ikona +.
- **Interakcje:** Klik → `navigate('/plans/new')`.

### HeaderBar
- **Opis:** Pasek z tytułem i przełącznikiem „Pokaż nieaktywne”.
- **Typy:** `showInactive:boolean`, `onToggle()`.

### EmptyState
- **Opis:** Pokazywany, gdy brak planów (po filtrze lub w ogóle). CTA kieruje do kreatora.

## 5. Typy
```typescript
type PlansFilterState = {
  showInactive: boolean;
};
```
Używamy `WorkoutPlansListResponse`, `WorkoutPlanDTO` z `types.ts`.

## 6. Zarządzanie stanem
- React Query `useWorkoutPlans(showInactive)` → `GET /api/v1/workout-plans?is_active={flag}`
- Lokalny state `showInactive` (persisted w localStorage).
- Mutacje:
  - `useActivatePlanMutation` (`POST /activate`) → invalidacja listy.
  - `useDeletePlanMutation` (`DELETE`) → optimistic remove; on 409 fallback do `PATCH is_active=false`.

## 7. Integracja API
| Akcja | Endpoint | Metoda |
|-------|----------|--------|
| Pobierz plany | `/api/v1/workout-plans?is_active={bool}` | GET |
| Aktywuj | `/api/v1/workout-plans/:id/activate` | POST |
| Usuń | `/api/v1/workout-plans/:id` | DELETE |
| Soft-delete fallback | `/api/v1/workout-plans/:id` | PATCH (body `{ is_active:false }`) |

## 8. Interakcje użytkownika
- Klik FAB → przenosi do kreatora.
- Toggle „Pokaż nieaktywne” → refetch listy.
- Klik karty → edycja planu.
- Aktywacja → toast sukcesu, badge „Aktywny”.
- Usuwanie → ConfirmDialog → toast + optimistic fade.

## 9. Warunki i walidacja
- Max 1 plan aktywny: po aktywacji refetch gwarantuje spójność, front wyróżnia tylko `is_active===true`.
- Ładowanie: Skeleton Grid placeholder.
- EmptyState dla obu przypadków (brak planów lub filtr ukrył).

## 10. Obsługa błędów
- 401/403 → global logout.
- 409 przy DELETE → automatycznie patch `is_active=false` i toast info „Plan używany – zdezaktywowano”.
- 500 → toast error, retry button.

## 11. Kroki implementacji
1. Utwórz stronę `src/pages/plans.astro` z guardem auth.
2. Implementuj hook `useWorkoutPlans` w `src/lib/hooks/workout-plans.ts`.
3. Zbuduj komponenty `WorkoutPlanCard`, `HeaderBar`, `FloatingActionButton`, `EmptyState`.
4. Dodaj React Query mutacje aktywuj/usuń.
5. Dodaj confirm dialog (Shadcn AlertDialog) dla delete.
6. Dodaj testy komponentów i e2e cypress (happy path activate/delete).
7. Storybook stories dla karty i gridu.
