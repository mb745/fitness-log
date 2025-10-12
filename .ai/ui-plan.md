# Architektura UI dla Fitness Log MVP

## 1. Przegląd struktury UI

Fitness Log to aplikacja webowa do planowania i rejestrowania treningów siłowych z mechanizmami automatycznej progresji. Architektura UI opiera się na podejściu mobile-first z adaptacyjnym interfejsem dostosowanym do kontekstu użycia.

### Kluczowe założenia projektowe

- **Mobile-first**: Priorytet dla doświadczenia mobilnego, szczególnie podczas aktywnego treningu
- **Jeden aktywny kontekst**: Tylko jeden plan aktywny i jeden trening w trakcie jednocześnie
- **Zero cache**: Dane zawsze aktualne z API (staleTime: 0)
- **Optimistic updates**: Natychmiastowy feedback UI z synchronizacją w tle
- **Dostępność**: WCAG 2.1 Level AA - kontrast 4.5:1, ARIA, nawigacja klawiaturowa

### Stack technologiczny

- Framework: Astro 5 (SSG/SSR) + React 19 (komponenty interaktywne)
- Styling: Tailwind 4 + Shadcn/ui
- Formularze: react-hook-form + Zod (współdzielone schematy z backend)
- Stan: AuthContext, ActiveWorkoutContext, React Query (staleTime: 0)
- API: Service layer w src/lib/services/ (abstrakcja HTTP)
- Drag-and-drop: @dnd-kit/core z alternatywą klawiaturową

## 2. Lista widoków

### 2.1 Widoki publiczne

#### Landing Page `/`

- **Cel**: Konwersja do rejestracji, prezentacja wartości
- **Komponenty**: Hero z CTA, FeatureCard×3
- **Kluczowe info**: Opis wartości ("Planuj. Trenuj. Progresuj."), 3 główne funkcje
- **Dostępność**: Skip link, alt texts, focus states

#### Login `/login`

- **Cel**: Autoryzacja użytkowników
- **Komponenty**: Form (email, hasło), Button z loading state, Toast
- **Bezpieczeństwo**: Rate limiting (API), brak ujawniania błędnego pola, ARIA live regions
- **US**: US-002

#### Register `/register`

- **Cel**: Rejestracja nowych użytkowników
- **Komponenty**: Form (email, hasło, potwierdzenie), PasswordStrengthIndicator, Checkbox
- **Przepływ**: Register → Auto-login → POST /api/v1/profile → Dashboard
- **US**: US-001

### 2.2 Widoki chronione

#### Dashboard `/dashboard`

- **Cel**: Centralny hub, szybki start treningu, przegląd statusu
- **Sekcje**:
  - Hero card: Najbliższy trening + CTA "Rozpocznij teraz"
  - Banner aktywnego treningu (jeśli in_progress) - sticky, nie można zamknąć
  - Quick stats: treningi w tygodniu/miesiącu, streak (grid 2×2 mobile, 4×1 desktop)
  - Ostatni ukończony trening
- **Komponenty**: HeroCard, ActiveWorkoutBanner, QuickStats, WorkoutSummaryCard
- **Interakcje**:
  - "Rozpocznij teraz" → POST /workout-sessions/:id/start → `/workout/:id/active`
  - "Kontynuuj trening" → `/workout/:id/active`
- **Stany**:
  - Loading: Skeleton dla wszystkich sekcji
  - Pusty: "Brak planów. Utwórz pierwszy!" + CTA
  - Aktywny trening: Banner z progress bar
- **Queries**:
  - GET /workout-sessions?status=scheduled&sort=scheduled_for&limit=1
  - GET /workout-sessions?status=in_progress&limit=1
  - GET /analytics/upcoming-workouts
- **US**: US-008

#### Workout Plans List `/plans`

- **Cel**: Zarządzanie planami użytkownika
- **Layout**: Grid 1 col (mobile), 2 cols (desktop)
- **Kluczowe info**: Lista planów, wyróżnienie aktywnego (badge, border), dla każdego: nazwa, harmonogram (readable), liczba ćwiczeń
- **Komponenty**: WorkoutPlanCard×N, FloatingActionButton (+), EmptyState, ConfirmDialog
- **Interakcje**:
  - FAB "+" → `/plans/new`
  - "Aktywuj" → POST /workout-plans/:id/activate
  - "Usuń" → DELETE → jeśli 409: auto PATCH is_active=false BEZ komunikatu
- **Filtry**: Toggle "Pokaż nieaktywne"
- **Ograniczenia**: Tylko 1 aktywny plan, BRAK startu treningu stąd
- **US**: US-005 (częściowo), US-006

#### Create/Edit Workout Plan `/plans/new` | `/plans/:id/edit`

- **Cel**: Kreator planu z wyborem ćwiczeń i konfiguracją
- **Layout**:
  - Mobile: Wizard 4-step
  - Desktop: Single-page form z sekcjami
- **Kroki Wizarda**:
  1. Podstawowe info: nazwa, typ harmonogramu (radio: "Dni tygodnia" / "Co X dni")
  2. Wybór ćwiczeń: Modal z biblioteką
  3. Konfiguracja: serie, reps, przerwy, kolejność (drag-and-drop + strzałki)
  4. Podsumowanie: Preview + szacowany czas
- **Komponenty**: FormWizard, RadioGroup, ExerciseLibraryModal, DraggableExerciseList, ExerciseConfigRow
- **Auto-save**: Debounce 2s, dirty indicator, prompt przy opuszczaniu
- **Walidacja**: workoutPlanSchema (Zod), min 1 ćwiczenie, XOR dla harmonogramu, inline errors
- **Edycja używanego planu**: BEZ warningów, zmiany tylko na przyszłe treningi
- **US**: US-005, US-006

#### Exercise Library Modal (kontekstowy modal)

- **Kontekst**: TYLKO podczas tworzenia/edycji planu
- **Cel**: Wyszukiwanie i wybór ćwiczeń
- **Komponenty**: SearchInput (debounce 300ms), FilterDropdown×2 (grupa, typ), VirtualizedExerciseList, ExerciseCard
- **Layout**: Fullscreen (mobile), Side panel 40% (desktop)
- **Interakcje**:
  - Search → GET /exercises?q={query}
  - Filter → GET /exercises?muscle_group_id={id}&type={type}
  - "Dodaj" → Zamknij modal, dodaj do formularza
  - Click kartę → ExerciseDetailModal
- **Optymalizacja**: Virtual scrolling, lazy load images, pagination (page_size=20)
- **US**: US-004

#### Exercise Detail Modal

- **Trigger**: Click na ExerciseCard
- **Sekcje**:
  - Hero: nazwa, ilustracja duża
  - Metadata: grupa, podgrupa, typ, zakres reps
  - Instrukcje: lista kroków
  - Historia: wykres volume ostatnie 12 tygodni (recharts line chart)
- **Komponenty**: ImageHero, MetadataBadges, InstructionsList, VolumeChart
- **Volume**: Suma(serie × reps × ciężar) per sesja
- **US**: US-004

#### Calendar `/calendar`

- **Cel**: Przegląd treningów w kontekście czasowym
- **Widoki**: Miesięczny (desktop default), Tygodniowy (mobile default) z toggle
- **Komponenty**: Calendar (custom Shadcn lub react-big-calendar), CalendarEvent, SessionDetailsPanel
- **Status colors**:
  - Scheduled: niebieski
  - In Progress: pomarańczowy (pulsing)
  - Completed: zielony
  - Abandoned: szary
- **SessionDetailsPanel**: Header (data, status), nazwa planu + link, lista ćwiczeń, akcje ("Rozpocznij", "Kontynuuj", "Odwołaj")
- **Interakcje**:
  - Dzień pusty → "Zaplanuj trening"
  - "Rozpocznij" → POST /workout-sessions/:id/start
  - "Odwołaj" → DELETE /workout-sessions/:id
- **Nawigacja**: Prev/Next, "Dzisiaj" button
- **US**: US-007

#### Active Workout `/workout/:id/active`

- **Cel**: Wykonywanie treningu - NAJWAŻNIEJSZY WIDOK
- **Layout struktura**:

  ```
  [Fixed Header]
    Progress bar (12/20 serii)
    Przycisk "Porzuć"

  [Scrollable Content]
    Timer przerw (sticky gdy aktywny)
    Lista ćwiczeń (vertical scroll)
      - Bieżące (wyróżnione, auto-scroll)
      - Poprzednie (collapsed)
      - Następne (preview)

  [Fixed Footer mobile]
    "Zakończ trening"
  ```

- **SessionSetRow** (kluczowy):
  - Inputs: Reps, Weight (kg)
  - Status: pending | completed | skipped
  - Buttons: "Zakończ serię" (green), "Pomiń"
  - Edycja → auto-save debounce 500ms → PATCH /session-sets/:id
- **Timer przerw** (BEZ vibration):
  - Auto-start po ukończeniu serii
  - Sticky panel, duża czcionka
  - Buttons: +30s, -30s, Pomiń, Pause
  - Audio optional (toggle w Preferencjach)
  - ARIA: role="timer" aria-live="polite"
  - NIE pokazuj po ostatniej serii
- **Progress Bar**: Fixed top, (completed + skipped) / total × 100, "12 / 20 serii"
- **Zakończenie**: Button zawsze dostępny, dialog jeśli nie wszystkie, POST /complete → ProgressionModal
- **Porzucenie**: Dialog, POST /abandon → Dashboard
- **State**: ActiveWorkoutContext + localStorage backup, optimistic updates, periodic sync 30s
- **Offline**: localStorage queue, banner "Offline", retry przy online event
- **Blokada**: Modal "Masz aktywny trening" z [Wróć] [Porzuć]
- **Optymalizacja**: React.memo SessionSetRow, useCallback, rozdzielony stan timera
- **Accessibility**: Touch targets 60px, ARIA z kontekstem, focus management, screen reader announcements
- **US**: US-009, US-010, US-011, US-012, US-013, US-014

#### Progression Modal (non-dismissible)

- **Trigger**: Auto po zakończeniu treningu
- **Sekcje**:
  1. Podsumowanie: czas, serie, wolumen
  2. Sugestie per ćwiczenie:
     - Dzisiaj vs poprzednio
     - Konkretna rekomendacja
     - Checkbox akceptacji
  3. Akcje: [Zaakceptuj wszystkie] [Odrzuć wszystkie] [Zastosuj wybrane]
  4. Link: "Wyłącz sugestie"
- **Logika sugestii**:
  - Wszystkie na min reps nie max → zwiększ reps 1-2
  - Wszystkie na max reps → zwiększ ciężar 2.5-5%
  - Mixed → brak sugestii
- **Zachowanie**: Non-dismissible (Escape NIE zamyka), po akcji PATCH /workout-plans/:id/exercises/:exerciseId → Dashboard
- **US**: US-015

#### History `/history`

- **Cel**: Przegląd wykonanych i porzuconych treningów
- **Layout**: TYLKO lista chronologiczna (nie kalendarz)
- **Komponenty**: WorkoutHistoryCard×N, FilterBar, EmptyState, InfiniteScroll
- **Kluczowe info**: Data, nazwa planu, status badge, czas, serie (ukończone/wszystkie), miniaturowy podgląd (collapsed)
- **Filtry**: Dropdown (plan), Chips (status), DateRangePicker
- **Expanded**: Pełna lista serii, badge "Stagnacja", "Zobacz szczegóły"
- **Interakcje**: Click → expand/collapse, click "Stagnacja" → StagnationModal, swipe → soft delete (hide)
- **Queries**: GET /workout-sessions?status=completed,abandoned&sort=-completed_at&page={n}
- **US**: US-017

#### Workout Session Details `/history/:sessionId`

- **Cel**: Szczegółowy widok pojedynczej sesji
- **Komponenty**: SessionHeader, ExerciseResultsTable×N, StagnationBadge
- **Tabela serii**:
  ```
  Set | Target | Actual | Weight | Status
  1   | 8-12   | 12     | 50kg   | ✓ Completed
  2   | 8-12   | 11     | 50kg   | ✓ Completed
  3   | 8-12   | 0      | 0kg    | ⊘ Skipped
  ```

#### Stagnation Alert Modal

- **Trigger**: Click badge "Stagnacja"
- **Cel**: Analiza ostatnich 5 treningów + sugestie
- **Sekcje**:
  1. Komunikat: "Brak poprawy w [Nazwa] w ostatnich 5 treningach"
  2. Wykres/tabela: 5 treningów (data, serie, reps, ciężar, volume)
  3. Sugestie:
     - Zwiększ ciężar 5%
     - Zmień zakres reps
     - Zamień na alternatywne (dropdown)
  4. Akcje: [Zastosuj] [Odrzuć], Checkbox "Wyłącz alerty dla tego ćwiczenia"
- **Komponenty**: LineChart/Table, RadioGroup, ExerciseDropdown
- **Queries**: GET /workout-sessions?exercise_id={id}&status=completed&limit=5
- **US**: US-016

#### Profile `/profile`

- **Cel**: Zarządzanie danymi, preferencjami, kontem
- **Layout**: Tabs (desktop), Accordion (mobile)
- **Sekcje**:
  1. **Dane osobowe**: Weight (0-500 kg), Height (100-250 cm), Gender, DOB
  2. **Ograniczenia**: Textarea (kontuzje)
  3. **Konto**: Email (read-only), "Zmień hasło" (Supabase), "Wyloguj"
  4. **Preferencje**: Units (kg/lbs display), Timer sound (toggle), Progression suggestions (toggle), Stagnation alerts (toggle)
  5. **O aplikacji**: Wersja, Polityka, Regulamin, Kontakt
- **Komponenty**: Tabs, Form (auto-save 2s), Toggle, ConfirmDialog
- **Walidacja**: profileSchema (Zod), inline errors
- **US**: US-003, US-018

## 3. Mapa podróży użytkownika

### 3.1 Onboarding nowego użytkownika

```
Landing → [Zarejestruj się] → Register → Submit
  ↓
Auto-login + POST /profile
  ↓
Dashboard (pusty) → [Utwórz pierwszy plan] → Create Plan Wizard
  Step 1: Nazwa + harmonogram
  Step 2: Wybór ćwiczeń (modal)
  Step 3: Konfiguracja (serie, reps, przerwy)
  Step 4: Podsumowanie
  ↓ [Zapisz]
Plans List → Toast "Plan utworzony!"
  ↓
Calendar (system auto-generuje sesje)
```

### 3.2 Typowy cykl treningu

```
Dashboard → Widzi "Następny trening: Push - Dziś 18:00"
  ↓ [Rozpocznij teraz]
POST /workout-sessions/:id/start
  ↓
Active Workout
  - Wykonuje serie
  - Rejestruje wyniki (auto-save 500ms)
  - Timer odmierza przerwy
  - Progress bar: 18/20
  ↓ [Ostatnia seria] [Zakończ trening]
POST /complete
  ↓
Progression Modal (non-dismissible)
  - Przegląda sugestie
  - Zaznacza checkboxy
  ↓ [Zastosuj wybrane]
PATCH /workout-plans/:id/exercises/:exerciseId (per zaakceptowana)
  ↓
Dashboard (zaktualizowane statystyki)
```

### 3.3 Edycja istniejącego planu

```
Plans List → [Edytuj] → Edit Plan (formularz z aktualnymi danymi)
  ↓ Zmienia target_sets
  ↓ Auto-save po 2s: PATCH
  ↓ [Dodaj ćwiczenie] → Exercise Library Modal
  ↓ Wybiera → Modal zamyka się
  ↓ Konfiguruje parametry
  ↓ Auto-save
  ↓ [< Powrót]
Plans List (zmieniony plan, przyszłe treningi zaktualizowane)
```

### 3.4 Obsługa stagnacji

```
Active Workout → Wyniki podobne do ostatnich 4
  ↓ [Zakończenie]
Progression Modal → Brak nowych sugestii (stagnacja jeszcze nie wykryta)
  ↓
Dashboard → System analizuje w tle: 5 ostatnich
  ↓ Badge "Stagnacja" przy ćwiczeniu
Active Workout → Badge widoczny
  ↓ [Click badge]
Stagnation Modal
  - Wykres 5 treningów
  - Sugestie: zwiększ ciężar / zmień zakres / zamień
  ↓ Wybiera "Zwiększ ciężar 5%"
  ↓ [Zastosuj]
PATCH /workout-plans/:id/exercises/:exerciseId
  ↓
Active Workout (zaktualizowany ciężar)
```

### 3.5 Blokada wielu treningów

```
Active Workout (trening A in_progress) → Użytkownik wychodzi
  ↓
Dashboard → Banner "Aktywny trening: Push - 35 min temu"
  ↓ [Kontynuuj] → Active Workout

ALTERNATYWNIE:
Dashboard (trening A in_progress) → Próba rozpocząć nowy
  ↓ [Rozpocznij teraz]
Modal: "Masz aktywny trening Push"
  Options: [Wróć do treningu] [Porzuć aktywny]
  ↓ [Wróć] → Active Workout A
  ↓ [Porzuć] → POST /abandon → Nowy startuje
```

### 3.6 Automatyczny soft delete

```
Plans List → Plan "Push" używany w 5 sesjach
  ↓ [Usuń]
Confirm Dialog → [Usuń]
  ↓
DELETE /workout-plans/:id → 409 Conflict
  ↓
Service layer wykrywa → Auto PATCH is_active=false BEZ komunikatu
  ↓
Plans List refresh → Plan ukryty (domyślnie tylko active)
  ↓ [Toggle "Pokaż nieaktywne"] → Widzi z badge "Nieaktywny"
```

## 4. Układ i struktura nawigacji

### 4.1 Nawigacja główna

**Mobile (<768px)**: Bottom Navigation Bar (fixed)

```
[Dashboard] [Plans] [Calendar] [History] [Profile]
   🏠        📋       📅         📊         👤
```

**Desktop (≥768px)**: Sidebar (collapsible, default expanded)

```
[Logo]
─────────
📊 Dashboard
📋 Plany
📅 Kalendarz
📜 Historia
👤 Profil
─────────
[Collapse ◀]
```

**Accessibility**: Tab order logiczny, role="navigation", active state (underline + bold), focus visible (outline 2px)

### 4.2 Nawigacja kontekstowa

- **Breadcrumbs** (desktop): Dashboard > Plany > Edytuj plan "Push"
- **Back button** (mobile): [←] Edytuj plan
- **Modals**: Close (×) jeśli dismissible, Progression Modal non-dismissible

### 4.3 Punkty wejścia do kluczowych akcji

**Rozpoczęcie treningu** (tylko 2 miejsca):

1. Dashboard: "Następny trening" card → "Rozpocznij teraz"
2. Calendar: Click sesję scheduled → Panel → "Rozpocznij"

**Tworzenie planu**:

1. Plans List: FAB (+)
2. Dashboard pusty: CTA "Utwórz pierwszy plan"

**Dodawanie ćwiczeń**: Tylko z Create/Edit Plan → "Dodaj ćwiczenie"

### 4.4 Stany nawigacji

- **Aktywny trening**: Banner sticky na Dashboard/Calendar, badge 🔴 na Dashboard icon, deep link → `/workout/:id/active`
- **Notyfikacje**: Badge "Stagnacja" inline (nie notification center), Toast top-right (desktop) / top-center (mobile)

## 5. Kluczowe komponenty UI

### 5.1 Współdzielone komponenty

**ExerciseCard**

- Użycie: Biblioteka, plany, historia
- Warianty: library (ilustracja + metadata + "Dodaj"), plan (nazwa + target + drag handle + edit/delete), history (nazwa + actual wyniki)

**WorkoutPlanCard**

- Użycie: Lista planów
- Layout: Card z header (nazwa, badge), body (harmonogram, liczba ćwiczeń), footer (action buttons)

**SessionSetRow**

- Użycie: Aktywny trening
- Props: set, setNumber, totalSets, previousResult, onComplete, onSkip
- Optymalizacja: React.memo() z custom comparison

**Timer**

- Użycie: Przerwy w treningu
- Stan: useReducer dla countdown
- Side effects: Audio, ARIA live

**ProgressBar**

- Użycie: Aktywny trening, dashboard stats
- Warianty: linear, circular
- Props: completed, total, showLabel, segments (opcjonalnie kolorowe per ćwiczenie)

**Calendar**

- Użycie: Calendar view
- Decyzja: Custom Shadcn vs react-big-calendar (do weryfikacji)
- Wymagania: Responsive (weekly/monthly toggle), event rendering z statusem

**Modal / Dialog**

- Warianty: Dismissible (Shadcn default), Non-dismissible (custom: Progression), Bottom Sheet (mobile), Side Panel (desktop: Exercise Library)

### 5.2 Formularze

**Form wrapper** (react-hook-form + Zod)

- Features: Auto-save (configurable debounce), dirty tracking, inline validation, loading states

**Input, Select, Textarea** (Shadcn/ui rozszerzenia)

- Number input z +/- buttons
- ARIA (aria-invalid, aria-describedby)
- Touch targets min 44px

**DatePicker, MultiSelectCheckbox, RadioGroup**

- Pełna nawigacja klawiaturowa, clear labels

### 5.3 Layout components

- **DashboardGrid**: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- **PageHeader**: Breadcrumbs/back, title, action buttons
- **EmptyState**: Ilustracja, komunikat, CTA
- **Skeleton**: Card, list, text - zgodne z finalnymi layoutami

### 5.4 Feedback components

- **Toast** (sonner lub Shadcn): Top-right (desktop), top-center (mobile), auto-dismiss 5s (success) / 10s (error)
- **ConfirmDialog**: Destructive actions, props: title, description, confirmLabel, variant (danger)
- **Badge**: Status (scheduled, in_progress, completed, abandoned), Alert (stagnacja), Info (aktywny, dirty)

### 5.5 Accessibility helpers

- **VisuallyHidden**: Screen reader only content
- **FocusTrap**: Modals, dialogs (@radix-ui built-in)
- **SkipLink**: Top każdej strony, target main content

## 6. Responsywność i breakpointy

### Breakpoints (Tailwind)

- xs: <640px (phone portrait)
- sm: 640px (phone landscape)
- **md: 768px** ← główny breakpoint mobile/desktop
- lg: 1024px (tablet landscape)
- xl: 1280px (desktop)
- 2xl: 1536px (large desktop)

### Adaptive patterns

| Element          | Mobile (<768px)    | Desktop (≥768px) |
| ---------------- | ------------------ | ---------------- |
| Nawigacja        | Bottom bar         | Sidebar          |
| Dashboard        | 1 kolumna          | 2-3 kolumny      |
| Kalendarz        | Tygodniowy         | Miesięczny       |
| Formularz planu  | Wizard             | Single-page      |
| Modal            | Bottom sheet       | Centered         |
| Exercise Library | Fullscreen         | Side panel 40%   |
| Timer            | Fullscreen overlay | Sticky panel     |
| SessionSetRow    | Vertical stack     | Horizontal       |

### Touch targets

- Minimum: 44×44px (Apple) / 48×48px (Material)
- Active Workout buttons: 60px height
- Inputs: 48px min
- Spacing między interactive: 8px min

## 7. Stany aplikacji i obsługa błędów

### 7.1 Loading states

- Initial: Skeleton screens (matching layout)
- Action: Spinner w przycisku + disabled
- Infinite scroll: Loader na dole
- Background sync: Timestamp "Zsynchronizowano 2 min temu"

### 7.2 Empty states

- Plans: "Jeszcze nie masz planów. Utwórz pierwszy!" + CTA
- Calendar: "Brak treningów. Aktywuj plan."
- History: "Nie wykonałeś jeszcze treningów."
- Dashboard (nowy): Guided onboarding z CTA

### 7.3 Error states

**400 Validation**: Inline pod polami, toast dla globalnych, ARIA live

**401 Unauthenticated**: Auto refresh token, jeśli fail → redirect /login, zapis current path

**409 Conflict**: Service layer wykrywa → auto PATCH is_active=false → BEZ komunikatu → UI refresh

**422 Business Rule**: Toast z komunikatem

**429 Rate Limit**: Toast "Zbyt wiele żądań", retry z exponential backoff

**Network Error**: Toast "Brak połączenia. Zmiany zapisane lokalnie.", banner persistent "Offline", retry queue w localStorage, online event listener

**500 Server**: Toast "Błąd serwera", retry button, po 3× "Skontaktuj się z pomocą"

### 7.4 Edge cases

**Aktywny trening >24h**: Banner "Trening >24h. Sprawdź.", CTA "Porzuć"

**Wygasła sesja podczas treningu**: Zapis w localStorage, modal "Sesja wygasła. Zaloguj się.", po login restore + sync

**Jednoczesne edycje**: Last write wins (brak websocket), opcjonalnie timestamp "Ostatnia zmiana: 5 min temu"

## 8. Dostępność (WCAG 2.1 Level AA)

### 8.1 Kolor i kontrast

**Minimalne kontrasty**:

- Normalny tekst (<18pt): 4.5:1
- Duży tekst (≥18pt): 3:1
- UI components: 3:1

**Status colors** (z sufficient contrast):

- Scheduled: hsl(210, 100%, 45%) niebieski
- In Progress: hsl(30, 100%, 50%) pomarańczowy + pulsing
- Completed: hsl(145, 60%, 40%) zielony
- Abandoned: hsl(0, 0%, 50%) szary
- Error: hsl(0, 84%, 60%) czerwony

**Nie polegaj tylko na kolorze**: Dodatkowo ikony, labels, patterns

### 8.2 Typografia

- Minimum: 16px (1rem) body text
- Scale: 1rem, 1.125rem, 1.25rem, 1.5rem, 2rem, 2.5rem
- Weights: 400, 500, 600, 700
- Line height: 1.5 (body), 1.2 (headings)

### 8.3 Nawigacja klawiaturowa

- Tab order: Logiczny top→bottom, left→right
- Focus visible: Outline 2px, offset 2px, high contrast
- Skip links: "Przejdź do głównej treści"
- **Skróty**: Tab/Shift+Tab (nawigacja), Enter/Space (aktywacja), Escape (zamknij modal jeśli dismissible), ↑↓ (alternatywa drag-and-drop)

**Drag-and-drop alternatywa**:

```html
<button aria-label="Przenieś ćwiczenie w górę" onClick="{moveUp}">↑</button>
<button aria-label="Przenieś ćwiczenie w dół" onClick="{moveDown}">↓</button>
```

### 8.4 ARIA attributes

**Timer**:

```html
<div role="timer" aria-live="polite" aria-atomic="true">
  <span aria-label="Pozostało 90 sekund">1:30</span>
</div>
```

**Progress bar**:

```html
<div
  role="progressbar"
  aria-valuenow="{12}"
  aria-valuemin="{0}"
  aria-valuemax="{20}"
  aria-label="Postęp treningu: 12 z 20 serii ukończonych"
/>
```

**Przyciski z kontekstem**:

```html
<button aria-label="Oznacz serię 1 z 4 jako ukończoną">Zakończ serię</button>
```

**Live regions**:

```html
<div role="status" aria-live="polite" aria-atomic="true">{/* "Seria 3 ukończona. Następna seria: 4" */}</div>
```

**Modals**:

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Sugestie progresji</h2>
</div>
```

### 8.5 Screen reader support

**Announcements** (aria-live):

- "Seria ukończona"
- "Timer przerwy: 90 sekund"
- "Trening zakończony. Czas: 45 minut"
- "Plan zapisany"

**Alt texts**: Wszystkie ilustracje z opisem  
**Form labels**: Zawsze explicit `<label for="">` lub `aria-label`  
**Button labels**: Opisowe (aria-label jeśli icon-only)

### 8.6 Focus management

**Po akcjach**:

- Ukończenie serii → focus na następnej
- Otwarcie modal → focus na pierwszy interactive w modal
- Zamknięcie modal → focus na element który otworzył
- Submit form → focus na komunikat

**Focus trap**: @radix-ui/react-dialog (Shadcn) ma built-in

## 9. Bezpieczeństwo UI

### 9.1 Autoryzacja na poziomie route

- **Public**: `/`, `/login`, `/register`
- **Protected**: Wszystkie pozostałe

**Implementacja**:

```tsx
// Astro middleware
if (!PUBLIC_ROUTES.includes(url.pathname)) {
  const session = await supabase.auth.getSession();
  if (!session) return redirect("/login");
  context.locals.user = session.user;
}

// React hook
function useAuth() {
  const { user, loading } = useContext(AuthContext);
  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
  }, [user, loading]);
  return { user, loading };
}
```

### 9.2 Obsługa sesji

- JWT: Automatycznie przez Supabase
- Refresh: Auto, transparent
- Timeout: 1h (Supabase default), auto-refresh w tle

**Wygaśnięcie podczas treningu**:

1. Wykryj 401
2. Attempt refresh
3. Jeśli fail: zapisz stan localStorage → modal → redirect /login
4. Po login: restore + sync

### 9.3 Input sanitization

- React JSX auto-escaping
- Unikaj dangerouslySetInnerHTML
- User content: DOMPurify jeśli potrzebne

### 9.4 HTTPS Only

- Enforcement: Hosting level
- HSTS: `Strict-Transport-Security: max-age=31536000`

### 9.5 Rate Limiting

- Implementacja: API level
- UI: Toast przy 429, retry z exponential backoff

## 10. Optymalizacja wydajności

### 10.1 Code splitting

- Astro: Auto per-route
- React lazy:

```tsx
const ExerciseLibraryModal = lazy(() => import("./ExerciseLibraryModal"));
<Suspense fallback={<Skeleton />}>{showLibrary && <ExerciseLibraryModal />}</Suspense>;
```

### 10.2 Image optimization

- Astro Image: Auto WebP, lazy load, responsive
- Exercise illustrations: Compress, CDN
- Lazy load: `loading="lazy"` below fold

### 10.3 Virtual scrolling

- Użycie: Exercise Library (>100 items)
- Biblioteka: @tanstack/react-virtual
- Overscan: 5 items

### 10.4 React optimization

**SessionSetRow memo**:

```tsx
const SessionSetRow = React.memo(
  ({ set, onComplete }) => {
    /* ... */
  },
  (prev, next) => prev.set.id === next.set.id && prev.set.status === next.set.status
);
```

**useCallback**:

```tsx
const handleComplete = useCallback(
  (setId, data) => {
    updateSet(setId, data);
  },
  [updateSet]
);
```

**Rozdzielony stan**: Timer w osobnym context (nie trigger re-render serii)

### 10.5 Debouncing i throttling

- Search: 300ms debounce
- Form auto-save: 2s debounce
- Session set update: 500ms debounce
- Scroll: 100ms throttle

### 10.6 API optimization

- No caching: React Query staleTime: 0 (wymaganie MVP)
- Pagination: Server-side, page_size=20
- Optimistic updates: Instant local, API w tle
- Batch: Progression modal - jeden PATCH per ćwiczenie

## 11. Internacjonalizacja (przygotowanie)

### Struktura tłumaczeń

```
src/lib/i18n/
  ├── index.ts    # t() function, formatDate, formatNumber
  ├── pl.ts       # Polski (default)
  └── en.ts       # English (future)
```

**Przykład pl.ts**:

```typescript
export const pl = {
  common: {
    save: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
  },
  workout: {
    start: "Rozpocznij trening",
    status: {
      scheduled: "Zaplanowany",
      inProgress: "W trakcie",
      completed: "Ukończony",
      abandoned: "Porzucony",
    },
  },
};
```

**Usage**: `import { t } from '@/lib/i18n'; <button>{t('workout.start')}</button>`

### Formatowanie

- Daty: `Intl.DateTimeFormat('pl-PL')`
- Liczby: `Intl.NumberFormat('pl-PL')`
- Jednostki: Backend zawsze kg, frontend konwertuje do lbs jeśli user preference

## 12. Mapowanie User Stories na widoki

| US                       | Widoki                                    | Komponenty                                             |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
| US-001 Rejestracja       | Register                                  | Form, Input, Button, Toast                             |
| US-002 Logowanie         | Login                                     | Form, Input, Button, Toast                             |
| US-003 Wylogowanie       | Profile                                   | Button, ConfirmDialog                                  |
| US-004 Biblioteka        | ExerciseLibraryModal, ExerciseDetailModal | SearchInput, FilterDropdown, ExerciseCard, VolumeChart |
| US-005 Tworzenie planu   | CreatePlan                                | FormWizard, ExerciseLibraryModal, DraggableList        |
| US-006 Edycja planu      | EditPlan                                  | Form, ExerciseLibraryModal, DraggableList              |
| US-007 Kalendarz         | Calendar                                  | Calendar, SessionDetailsPanel                          |
| US-008 Dashboard         | Dashboard                                 | HeroCard, ActiveWorkoutBanner, QuickStats              |
| US-009 Rozpoczęcie       | Dashboard, Calendar → ActiveWorkout       | Button, Modal                                          |
| US-010 Rejestracja serii | ActiveWorkout                             | SessionSetRow, Input                                   |
| US-011 Timer             | ActiveWorkout                             | Timer (sticky)                                         |
| US-012 Progress          | ActiveWorkout                             | ProgressBar (fixed)                                    |
| US-013 Zakończenie       | ActiveWorkout → ProgressionModal          | Button, ConfirmDialog, Modal                           |
| US-014 Anulowanie        | ActiveWorkout                             | Button, ConfirmDialog                                  |
| US-015 Progresja         | ProgressionModal                          | Modal, Checkbox, Button                                |
| US-016 Stagnacja         | History, ActiveWorkout → StagnationModal  | Badge, Modal, Chart                                    |
| US-017 Historia          | History, SessionDetails                   | WorkoutHistoryCard, FilterBar                          |
| US-018 Profil            | Profile                                   | Form, Tabs, Input                                      |
| US-019 Bezpieczeństwo    | Middleware, useAuth                       | -                                                      |
| US-020 Metryki           | Backend (poza UI)                         | -                                                      |

## 13. Punkty bólu użytkownika i rozwiązania UI

| Problem                        | Rozwiązanie UI                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Utrata motywacji               | Progression Modal non-dismissible z konkretnymi sugestiami, alert stagnacji                |
| Zapominanie o treningu         | Banner sticky na Dashboard, badge na nav, blokada nowego, localStorage persistence         |
| Trudność doboru ciężarów       | "Ostatnio: 3×12×50kg" w Active Workout, volume chart w Exercise Detail, auto sugestie      |
| Gubienie się w długim treningu | Progress bar 12/20, auto-scroll do bieżącego, wyróżnienie aktualnej sekcji                 |
| Zapominanie o przerwach        | Auto-start timer, sticky panel, audio notification, +30s/-30s                              |
| Frustracja przy usuwaniu       | Auto soft delete przy 409 BEZ komunikatu, seamless UX                                      |
| Brak świadomości postępów      | Quick stats na Dashboard, historia z filtrami, volume charts                               |
| Edycja na małym ekranie        | Wizard mobile, duże touch 60px, drag+strzałki alternatywa, auto-save                       |
| Stres utraty danych            | Optimistic updates, auto-save 500ms, localStorage queue, offline banner, periodic sync 30s |
| Brak jasności harmonogramu     | Hero card z konkretną datą, mini kalendarz, readable format harmonogramu                   |

## 14. Podsumowanie kluczowych decyzji

1. **Mobile-first** dla Active Workout
2. **Jeden aktywny kontekst** (plan + trening)
3. **Zero cache** (staleTime: 0)
4. **Service layer abstrakcja** (komponenty nie znają HTTP)
5. **Współdzielona walidacja** (Zod frontend + backend)
6. **Optimistic updates** (instant local + sync w tle)
7. **Non-dismissible progression** (wymaga akcji)
8. **Soft delete bez komunikatów** (409 auto obsługa)
9. **Accessibility first** (WCAG 2.1 AA)
10. **Protected routes** (Astro middleware + React useAuth)
11. **Adaptive navigation** (Bottom bar mobile / Sidebar desktop)
12. **Wizard dla złożonych form** (multi-step mobile, single desktop)
13. **Context + React Query** (Auth, ActiveWorkout + RQ dla rest)
14. **i18n preparation** (struktura ready)
15. **Ograniczone punkty wejścia** (trening tylko Dashboard/Calendar, biblioteka tylko w planie)

## 15. Następne kroki implementacji

### Faza 1: Fundament (Tydzień 1-2)

- Setup: Astro + React + Tailwind + Shadcn/ui
- Middleware autoryzacji + useAuth
- Service layer (struktura wszystkich serwisów)
- Współdzielone schematy Zod
- Landing + Login + Register
- Protected route template

### Faza 2: Core CRUD (Tydzień 3-4)

- Dashboard (skeleton)
- Workout Plans List + Create/Edit
- Profile (basic)
- Exercise Library Modal + Detail
- Integracja biblioteki z planem

### Faza 3: Kalendarz i Historia (Tydzień 5)

- Calendar (weekly/monthly)
- Session details panel
- History list + filters
- Session details view

### Faza 4: Active Workout (Tydzień 6-7) - **PRIORYTET**

- Layout + SessionSetRow
- Timer component
- Progress bar
- Auto-save + optimistic
- ActiveWorkoutContext + localStorage
- Blokada wielu treningów

### Faza 5: Progresja (Tydzień 8)

- Progression Modal (non-dismissible)
- Stagnation Alert Modal
- Volume charts (recharts)
- Apply logic (PATCH)

### Faza 6: Polish (Tydzień 9-10)

- Accessibility audit (WCAG 2.1 AA)
- Responsive testing
- Error handling edge cases
- Loading + skeleton states
- Empty states + onboarding
- Performance (virtual scrolling, memo, lazy)

### Faza 7: Testing (Tydzień 11-12)

- E2E (Playwright)
- UAT
- Bug fixes
- Docs
- Production deployment

---
