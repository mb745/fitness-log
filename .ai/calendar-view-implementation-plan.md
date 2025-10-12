# Plan implementacji widoku Kalendarz

## 1. Przegląd
Widok kalendarza prezentuje zaplanowane, trwające oraz ukończone treningi w układzie miesięcznym i tygodniowym. Pozwala na podgląd szczegółów sesji oraz wykonanie akcji (start, kontynuuj, odwołaj).

## 2. Routing widoku
- **Ścieżka:** `/calendar`

## 3. Struktura komponentów
```
CalendarPage
 ├── ViewToggle (Week/Month)
 ├── CalendarComponent (react-big-calendar)
 │    └── CalendarEvent
 └── SessionDetailsPanel (Drawer on mobile, side panel desktop)
```

## 4. Szczegóły komponentów
### CalendarComponent
- `react-big-calendar` z lokalizacją pl (date-fns).
- Event accessor status → kolor.
- Select empty slot → shortcut „Zaplanuj trening” (future scope).

### CalendarEvent
- Tooltip data, status badge.
- OnClick → set `selectedSession`.

### SessionDetailsPanel
- Pokazuje nazwę planu, listę ćwiczeń, status i akcje.
- Buttons:
  - „Rozpocznij” (status scheduled) → POST start.
  - „Kontynuuj” (in_progress) → navigate active.
  - „Odwołaj” (scheduled) → DELETE.

## 5. Typy
- `WorkoutSessionDTO`, `WorkoutSessionStatus`.
- `CalendarEventVM { id:number; title:string; start:Date; end:Date; status:WorkoutSessionStatus }`.

## 6. Zarządzanie stanem
- Hook `useCalendarSessions(from,to)` → `GET /api/v1/workout-sessions?status=[all]&from=&to=`.
- Selected session in local state.

## 7. Integracja API
| Akcja | Endpoint |
|-------|----------|
| Pobierz sesje zakresu | `/api/v1/workout-sessions?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| Start sesji | `/api/v1/workout-sessions/:id/start` |
| Delete sesji | `/api/v1/workout-sessions/:id` (DELETE) |

## 8. Interakcje użytkownika
- Zmiana miesiąca/tyg → refetch.
- Click event → open panel.
- Click akcja → mutate + refetch range.

## 9. Warunki i walidacja
- Przy próbie startu jeśli istnieje in_progress → backend 409, front toast + redirect active.

## 10. Obsługa błędów
- 500 fetch → overlay z retry.

## 11. Kroki implementacji
1. Zainstaluj `react-big-calendar` + styles.
2. Zbuduj `useCalendarSessions` (caches by range key).
3. Mapuj DTO → eventVM.
4. Stwórz `SessionDetailsPanel` z responsywnym drawer.
5. Testy date navigation + status colors.
