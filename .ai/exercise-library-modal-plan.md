# Plan implementacji modalu Biblioteka Ćwiczeń

## 1. Przegląd

Modal służy do wyszukiwania i dodawania ćwiczeń do planu w trakcie jego tworzenia/edycji. Zawiera listę wirtualizowaną, filtry oraz podgląd detali pojedynczego ćwiczenia.

## 2. Wywołanie

- Otwierany z komponentu `StepExercisePicker`.
- **API**: read-only; brak autoryzacji wymaganej.

## 3. Struktura komponentów

```
ExerciseLibraryModal
 ├── ModalHeader (SearchInput + Close)
 ├── FiltersBar (FilterDropdown Group, Type)
 └── VirtualizedExerciseList
      ├── ExerciseCard × n
      └── InfiniteScrollSentinel
```

## 4. Szczegóły komponentów

### SearchInput

- Debounce 300 ms, wartość w state `query`.
- Trigger refetch listy.

### FilterDropdown

- Enum typu i grupy mięśniowej (dane z cache dictionaries).
- Multi-select? – spec: pojedynczy wybór.

### VirtualizedExerciseList

- `react-window`/`@tanstack/react-virtual` list 100% height.
- Lazy-loaded miniaturki (IntersectionObserver).
- Infinite scroll via `page` param.

### ExerciseCard

- Pola: nazwa, badges (group, type), przycisk „Dodaj”.
- Klik poza przycisk → otwiera `ExerciseDetailModal`.
- Dodawanie → callback `onAdd(exercise)` zwraca DTO.

## 5. Typy

- `ExerciseDTO` (z `types.ts`).
- `ExerciseFilterState { query:string; muscle_group_id?:number; type?:ExerciseType; page:number }`.

## 6. Zarządzanie stanem

- React Query `useExercises(filters)` → `/api/v1/exercises`.
- Cache dictionaries (`useMuscleGroups`, `useMuscleSubgroups`).

## 7. Integracja API

| Endpoint            | Query params                                           |
| ------------------- | ------------------------------------------------------ |
| `/api/v1/exercises` | `q`, `muscle_group_id`, `type`, `page`, `page_size=20` |

## 8. Interakcje użytkownika

- Wpis tekstu → debounce search.
- Zmiana filtrów → refetch.
- Scroll na dół → `setPage(p+1)`.
- Klik „Dodaj” → zamyka modal, wysyła dane do parent (`ExerciseDTO` → `PlanExerciseDraft`).

## 9. Warunki i walidacja

- Debounce dla wyszukiwania (min 2 znaki).
- Brak wyników → EmptyState.

## 10. Obsługa błędów

- Network/500 → list placeholder z komunikatem + retry btn.

## 11. Kroki implementacji

1. Stwórz hook `useExercises`.
2. Zbuduj modal używając shadcn `Dialog` + `Sheet` (desktop side panel).
3. Wirtualizacja listy.
4. Implementuj lazy image.
5. Testy: debounce, filters, infinite scroll.
