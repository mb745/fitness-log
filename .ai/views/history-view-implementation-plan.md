# Plan implementacji widoku Historia Treningów

## 1. Przegląd

Lista ukończonych i porzuconych treningów z możliwością filtrowania, rozwijania szczegółów oraz nieskończonego przewijania.

## 2. Routing

- `/history`

## 3. Struktura komponentów

```
HistoryPage
 ├── FilterBar
 ├── InfiniteScrollList
 │    └── WorkoutHistoryCard × n
 │         └── CollapsedDetails (expand)
 └── EmptyState
```

## 4. Szczegóły komponentów

### WorkoutHistoryCard

- Header: data, nazwa planu, status badge.
- Metrics: czas, ukończone/total sets.
- Expand/collapse arrow.
- Swipe left (mobile) → soft delete (hide local).

### FilterBar

- Plan select (Select), Status chips, DateRangePicker.

## 5. Typy

- `WorkoutHistoryDTO` list response.
- `HistoryFilterState { planId?:number; status?:WorkoutSessionStatus[]; from?:ISODateString; to?:ISODateString }`.

## 6. Stan

- React Query infinite `useInfiniteHistory(filters)` (page param).
- Local state filters (URL search params sync).

## 7. API

`GET /api/v1/workout-sessions?status=completed,abandoned&sort=-completed_at&page=n`.

## 8. Interakcje

- Scroll bottom → fetchNextPage.
- Filter change → refetch, reset pages.
- Expand → lazy load sets if not included.

## 9. Walidacja

- Ensure date range valid (from<=to).

## 10. Błędy

- Network → retry button inline.

## 11. Kroki

1. Hook `useInfiniteHistory`.
2. Zbuduj FilterBar.
3. Implement card with collapse.
4. Soft delete local state.
5. Tests filters and infinite scroll.
