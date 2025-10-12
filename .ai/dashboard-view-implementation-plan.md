# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard jest chronionym hubem głównym użytkownika. Jego celem jest zapewnienie szybkiego rozpoczęcia zaplanowanego treningu, prezentacja kluczowych statystyk aktywności oraz skróconego podsumowania ostatniego ukończonego treningu. Widok obsługuje również informację o aktywnym, niedokończonym treningu (banner).

## 2. Routing widoku

- **Ścieżka:** `/dashboard`
- **Ochrona:** wymaga sesji JWT (middleware przekieruje na `/login` przy braku `ctx.locals.user`).
- **SEO:** `noindex` (strona prywatna).

## 3. Struktura komponentów

```
DashboardPage
 ├── HeroCard
 ├── ActiveWorkoutBanner   (renderowany warunkowo)
 ├── QuickStatsGrid
 │    ├── StatTile ×4
 └── WorkoutSummaryCard   (ostatni ukończony trening)
```

## 4. Szczegóły komponentów

### HeroCard

- **Opis:** Wyświetla najbliższy zaplanowany trening (data, plan, CTA).
- **Elementy:** `Card` → `h2` nazwa planu | `p` data/godzina | `Button` Rozpocznij.
- **Interakcje:**
  - Klik "Rozpocznij" → `POST /api/v1/workout-sessions/:id/start`, na sukces `navigate('/workout/:id/active')`.
- **Walidacja:** przy niedostępności danych (brak planów) nie renderuje, a Dashboard pokazuje EmptyState.
- **Typy:** `WorkoutSessionDTO` (scheduled) | `HeroCardProps { session: WorkoutSessionDTO }`.
- **Propsy:** `session`, `onStart(): Promise<void>`.

### ActiveWorkoutBanner

- **Opis:** Sticky banner widoczny gdy istnieje sesja `in_progress`; nie można zamknąć.
- **Elementy:** `Banner` → nazwa planu, progres bar (serii), `Button` Kontynuuj.
- **Interakcje:** Klik → `navigate('/workout/:id/active')`.
- **Walidacja:** Sprawdza czy `status==='in_progress'`.
- **Typy:** `WorkoutSessionDetailDTO` (bez sets) | `ActiveBannerProps { session: WorkoutSessionDTO; progress: number }`.
- **Propsy:** `session`, `progress`.

### QuickStatsGrid

- **Opis:** Prezentuje 4 szybkie statystyki (treningi w tygodniu, w miesiącu, streak, liczba aktywnych planów).
- **Elementy:** Siatka 2×2 (mobile) lub 4×1 (desktop) z `StatTile`.
- **Interakcje:** Brak (read-only).
- **Walidacja:** None – fallback `0` przy braku danych.
- **Typy:** `QuickStatsVM { weeklyCount: number; monthlyCount: number; streak: number; plansActive: number }`.
- **Propsy:** `stats: QuickStatsVM`.

### WorkoutSummaryCard

- **Opis:** Skrót ostatniego ukończonego treningu (data, czas trwania, volume, CTA "Szczegóły").
- **Elementy:** `Card` z `h3`, badgem status, listą 3 kluczowych metryk.
- **Interakcje:** Klik CTA → `navigate('/history/:sessionId')`.
- **Walidacja:** Renderowany tylko jeśli istnieje zakończona sesja.
- **Typy:** `WorkoutSessionDTO` (completed).
- **Propsy:** `session`.

## 5. Typy

```typescript
// ViewModel dla QuickStats
export interface QuickStatsVM {
  weeklyCount: number; // ile ukończonych treningów od poniedziałku
  monthlyCount: number; // ile ukończonych treningów w bieżącym miesiącu
  streak: number; // ile dni z rzędu wykonano >=1 trening
  plansActive: number; // liczba aktywnych planów (0/1)
}
```

Pozostałe typy importujemy z `src/types.ts`:

- `WorkoutSessionDTO`
- `WorkoutSessionStatus`
- `UpcomingWorkoutDTO`

## 6. Zarządzanie stanem

Używamy dedykowanych hooków React Query + Zustanda (opcjonalnie) do współdzielenia między stronami:

- `useActiveWorkout()` – `GET /api/v1/workout-sessions?status=in_progress&limit=1` (staleTime: 15 s)
- `useUpcomingWorkout()` – `GET /api/v1/workout-sessions?status=scheduled&sort=scheduled_for&limit=1` (staleTime: 15 s)
- `useQuickStats()` – `GET /api/v1/analytics/upcoming-workouts` → mapowanie do `QuickStatsVM` (staleTime: 60 s)
- `useLastCompletedWorkout()` – `GET /api/v1/workout-sessions?status=completed&sort=-completed_at&limit=1` (staleTime: 60 s)

## 7. Integracja API

| Akcja                      | Endpoint                                                               | Metoda | Typ zapytania  | Typ odpowiedzi                    |
| -------------------------- | ---------------------------------------------------------------------- | ------ | -------------- | --------------------------------- |
| Pobierz sesję in_progress  | `/api/v1/workout-sessions?status=in_progress&limit=1`                  | GET    | –              | `WorkoutSessionsListResponse`     |
| Pobierz najbliższy trening | `/api/v1/workout-sessions?status=scheduled&sort=scheduled_for&limit=1` | GET    | –              | `WorkoutSessionsListResponse`     |
| Start sesji                | `/api/v1/workout-sessions/:id/start`                                   | POST   | `EmptyPayload` | `WorkoutSessionDetailDTO`         |
| Pobierz szybkie statystyki | `/api/v1/analytics/upcoming-workouts`                                  | GET    | –              | `UpcomingWorkoutDTO[]` (mapujemy) |
| Pobierz ostatni ukończony  | `/api/v1/workout-sessions?status=completed&sort=-completed_at&limit=1` | GET    | –              | `WorkoutSessionsListResponse`     |

## 8. Interakcje użytkownika

| Interakcja                            | Rezultat                                             |
| ------------------------------------- | ---------------------------------------------------- |
| Klik "Rozpocznij" w HeroCard          | Wywołanie start API, przejście do aktywnego treningu |
| Klik "Kontynuuj" w Bannerze           | Nawigacja do aktywnego treningu                      |
| Klik kafel StatTile (przyszłość)      | _Brak (planowane rozwinięcie)_                       |
| Klik "Szczegóły" w WorkoutSummaryCard | Nawigacja do `/history/:sessionId`                   |

## 9. Warunki i walidacja

- HeroCard widoczny, jeśli istnieje zaplanowany trening **i** brak aktywnego.
- ActiveWorkoutBanner ma pierwszeństwo – render stopuje HeroCard.
- QuickStats używa fallback wartości `0` przy błędzie API.
- CTA „Rozpocznij” disabled w trakcie pending requestu, pokazuje `Spinner`.

## 10. Obsługa błędów

| Scenariusz                           | Obsługa                                             |
| ------------------------------------ | --------------------------------------------------- |
| 401/403 z jakiegokolwiek endpointu   | Global interceptor → `logout()` + redirect `/login` |
| 404 przy braku sesji                 | Komponenty stanu pustego (EmptyState, brak bannera) |
| 500/Network                          | Toast błędu + retry button w component overlay      |
| POST /start zwraca 409 (druga sesja) | Toast warning + odświeżenie active session hook     |

## 11. Kroki implementacji

1. Utwórz plik strony `src/pages/dashboard.astro` z protect gate (import `requireAuth` middleware).
2. Dodaj hooki React Query w `src/lib/hooks/workout-dashboard.ts` (4 hooki wymienione w sekcji 6).
3. Zaimplementuj komponenty prezentacyjne w `src/components/dashboard/`:
   - `HeroCard.tsx`
   - `ActiveWorkoutBanner.tsx`
   - `QuickStatsGrid.tsx` (+ `StatTile.tsx`)
   - `WorkoutSummaryCard.tsx`
4. Dodaj skeletony (Shadcn Skeleton) i stany pustego widoku.
5. Podłącz hooki w `DashboardPage` i warunkowo renderuj komponenty.
6. Integruj POST start z `supabase.auth.getSession()` token – użyj helpera `apiFetch`.
7. Dodaj testy komponentów (Vitest + Testing Library) dla renderu, stanów loading, błędów.
8. Dodaj linter rules & storybook stories dla każdego komponentu.
9. QA: sprawdź mobile/desktop, klawiatura, czytelność banneru.
10. Deploy na vercel preview i uzyskaj akceptację PM.
