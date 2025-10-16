# Plan Testów – Fitness Log MVP

## 1. Wprowadzenie i cele testowania

### 1.1. Cel dokumentu

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji Fitness Log – webowej aplikacji MVP do planowania treningów, wykonywania sesji treningowych i śledzenia postępów dla entuzjastów treningu siłowego.

### 1.2. Cele testowania

Główne cele procesu testowania obejmują:

- **Zapewnienie jakości funkcjonalnej**: Weryfikacja poprawności działania wszystkich kluczowych funkcjonalności zgodnie ze specyfikacją produktu
- **Bezpieczeństwo danych użytkownika**: Walidacja systemu autentykacji, autoryzacji i ochrony danych osobowych
- **Stabilność przepływów biznesowych**: Weryfikacja integralności maszyny stanów sesji treningowych i zarządzania planami
- **Zgodność z metrykami sukcesu MVP**: Walidacja wskaźników KPI (≥50% użytkowników kończy >1 trening w 4 tygodnie, 60% sesji przechodzi ze statusu "In Progress" do "Completed")
- **Gotowość produkcyjna**: Potwierdzenie, że aplikacja spełnia wymagania techniczne i biznesowe przed wdrożeniem

### 1.3. Zakres projektu (przypomnienie)

Fitness Log to aplikacja webowa służąca do:
- Zarządzania biblioteką ćwiczeń z taksonomią grup mięśniowych
- Tworzenia i edycji planów treningowych z harmonogramem kalendarzowym
- Przeprowadzania aktywnych sesji treningowych z timerem i śledzeniem postępów
- Analizy historii treningów i progresji w poszczególnych ćwiczeniach
- Zarządzania profilem użytkownika i autentykacją

## 2. Zakres testów

### 2.1. Elementy objęte testami (In Scope)

#### 2.1.1. Moduł Autentykacji i Profilu
- Rejestracja użytkownika (signUp via Supabase Auth)
- Logowanie i wylogowanie (signInWithPassword, signOut)
- Ochrona tras przez middleware (`src/middleware/index.ts`)
- CRUD operacje na profilu użytkownika (`/api/v1/profile`)
- Integracja z Supabase Auth (`auth.users` → `public.users`)

#### 2.1.2. Biblioteka Ćwiczeń
- Pobieranie listy ćwiczeń z paginacją (`/api/v1/exercises`)
- Filtrowanie według: nazwy (q), grupy mięśniowej, podgrupy, typu (compound/isolation)
- Wyświetlanie szczegółów pojedynczego ćwiczenia
- Modal wyboru ćwiczeń w kreatorze planu (`ExerciseLibraryModal`)

#### 2.1.3. Plany Treningowe
- Tworzenie planu z co najmniej 1 ćwiczeniem (`POST /api/v1/workout-plans`)
- Pełny przepływ kreatora planu (`PlanWizard`): krok 1 (wybór ćwiczeń), krok 2 (konfiguracja), krok 3 (harmonogram)
- Edycja istniejącego planu (metadane i lista ćwiczeń)
- Aktywacja/deaktywacja planu (`/api/v1/workout-plans/:id/activate`)
- Automatyczne planowanie sesji na 3 miesiące naprzód przy tworzeniu/aktywacji planu
- Usuwanie planu (tylko gdy brak powiązanych sesji)
- Drag & drop do zmiany kolejności ćwiczeń w planie (`@dnd-kit`)

#### 2.1.4. Sesje Treningowe
- **Przepływy stanów**: `scheduled` → `in_progress` → `completed` lub `abandoned`
- **Akcje workflow**:
  - `POST /api/v1/workout-sessions/:id/start`: rozpoczęcie sesji, automatyczne utworzenie `session_sets` przez trigger bazodanowy
  - `POST /api/v1/workout-sessions/:id/complete`: ukończenie (weryfikacja wykonania wszystkich serii)
  - `POST /api/v1/workout-sessions/:id/abandon`: porzucenie sesji
- Ręczne tworzenie sesji przez użytkownika (`POST /api/v1/workout-sessions`)
- Edycja zaplanowanej sesji (data, notatki, status)
- Usuwanie sesji (tylko w statusie `scheduled`)
- Widok kalendarza z sesjami (`CalendarComponent`)
- Widok dashboardu z najbliższym treningiem (`DashboardPage`)

#### 2.1.5. Aktywny Trening
- Wyświetlanie aktywnej sesji (`ActiveWorkoutPage`)
- Rejestrowanie serii: rzeczywiste powtórzenia, waga, status (pending/completed/skipped)
- Timer odpoczynku:
  - Automatyczny start po zakończeniu serii
  - Pauza, wznowienie, pominięcie
  - Regulacja czasu (+15s, -15s)
  - Persystencja w Zustand store (`active-workout-context.tsx`)
- Kolejka offline dla zapisów serii (obsługa utraty połączenia)
- Przycisk ukończenia sesji z walidacją (modal potwierdzenia, ewentualna progresja)

#### 2.1.6. Historia i Progresja
- Widok historii treningów z filtrowaniem (status, data, plan)
- Szczegóły zakończonej sesji (czas trwania, wykonane serie)
- Analiza progresji dla poszczególnych ćwiczeń (view `exercise_progression`)

#### 2.1.7. Baza Danych i Integracja
- Migracje Supabase (struktura tabel, triggery, widoki)
- Triggery:
  - Auto-update `updated_at` dla wszystkich tabel
  - Auto-set `started_at`, `completed_at` przy zmianie statusu sesji
  - Automatyczne tworzenie `session_sets` przy starcie sesji
- Widoki analityczne: `upcoming_workouts`, `workout_history`, `exercise_progression`
- Ograniczenia biznesowe (constraints): tylko jedna sesja `in_progress` na użytkownika, walidacja dat rozpoczęcia/ukończenia

### 2.2. Elementy wyłączone z testów (Out of Scope)

- Automatyczne generowanie planów przez AI (poza zakresem MVP)
- Wykresy progresji (poza MVP)
- Powiadomienia push/email (poza MVP)
- Instrukcje multimedialne dla ćwiczeń (poza MVP)
- Zaawansowane dashboardy analityczne (poza MVP)
- Testy wydajnościowe pod dużym obciążeniem (MVP nie wymaga skalowania)
- Row Level Security: lokalnie WYŁ. (dla wygody dev – `20250109121200_disable_rls_policies.sql`), na staging WŁ. z minimalnymi polisami (np. `user_id = auth.uid()`). Testy izolacji danych wykonujemy na staging; lokalnie weryfikujemy egzekwowanie własności na poziomie API (spójne 403/404/404).

## 3. Typy testów do przeprowadzenia

### 3.0. Strategia testów (risk-based, piramida)

- Piramida testów: unit ~60%, integracja ~30%, E2E ~10% (wg czasu i liczby asercji).
- E2E obejmuje wyłącznie krytyczne ścieżki biznesowe (Auth, Create Plan, Start/Complete Session); drag & drop oraz offline: po 1 scenariuszu E2E, reszta w testach komponentów/hooków oraz integracyjnych.
- Kontrakty API walidowane Zodem w testach integracyjnych (schematy współdzielone w `src/types.ts`/`src/lib/validation/`).
- Tagowanie testów: `@critical`, `@smoke`, `@slow` – umożliwia selektywne uruchamianie w CI.

### 3.1. Testy jednostkowe (Unit Tests)

**Zakres:**
- Funkcje walidacji Zod (`src/lib/validation/`)
- Helpery API (`src/lib/api-helpers.ts`)
- Transformacje danych (mapowanie DB row → DTO)
- Funkcje utility (`src/lib/utils.ts`)

**Narzędzia:**
- Vitest
- Testing Library (dla hooków React)

**Przykładowe scenariusze:**
- Walidacja schematu `workoutPlanCreateSchema`: poprawne dane vs. nieprawidłowe dane
- Funkcja `errorResponse`: czy zwraca poprawny format odpowiedzi HTTP
- Hook `usePlanDraft`: dodawanie/usuwanie ćwiczeń, zarządzanie stanem

**Kryteria pokrycia:**
- Minimum 80% pokrycia kodu dla modułów walidacji i utils
- ≥95% pokrycia dla krytycznych funkcji biznesowych (np. walidacja stanów sesji)

### 3.2. Testy integracyjne (Integration Tests)

**Zakres:**
- Endpointy API z rzeczywistym połączeniem do Supabase (test database)
- Serwisy (`src/lib/services/`) z pełnym cyklem CRUD
- Middleware autentykacji (`src/middleware/index.ts`)
- Database triggery i constraints

**Narzędzia:**
- Vitest + Supertest (lub native fetch)
- Supabase CLI dla lokalnej instancji testowej
- Seed data dla przewidywalnych testów

**Dodatkowe zasady:**
- Kontrakty odpowiedzi API walidowane Zodem (schematy współdzielone w `src/types.ts`/`src/lib/validation/`).

**Przykładowe scenariusze:**

| Test ID | Moduł | Scenariusz | Oczekiwany wynik |
|---------|-------|------------|------------------|
| INT-001 | Auth | POST /api/v1/profile po rejestracji | Status 201, utworzony rekord w `public.users` |
| INT-002 | Plans | POST /api/v1/workout-plans z exercises | Status 201, plan zapisany, exercises powiązane |
| INT-003 | Plans | Aktywacja planu → Automatyczne planowanie sesji | Rekordy w `workout_sessions` na 3 miesiące |
| INT-004 | Sessions | POST /api/v1/workout-sessions/:id/start | Status zmieniony na `in_progress`, `session_sets` utworzone przez trigger |
| INT-005 | Sessions | Próba startu drugiej sesji gdy inna `in_progress` | Status 409 Conflict, error message |
| INT-006 | Sessions | Complete session z brakującymi seriami | Status 400 Bad Request |
| INT-007 | Exercises | GET /api/v1/exercises?muscle_group_id=1 | Tylko ćwiczenia z danej grupy |
| INT-008 | Profile | PATCH /api/v1/profile bez autentykacji | Status 401 Unauthorized |

### 3.3. Testy end-to-end (E2E Tests)

**Zakres:**
- Kompletne user journeys od rejestracji do ukończenia treningu
- Testy UI (interakcje z formularzami, modalami, nawigacją)
- Przepływy wieloekranowe (kreator planu, aktywny trening)

**Narzędzia:**
- Playwright (zalecane dla Astro + React)
- Headless Chrome/Firefox
- Środowisko staging z testową bazą danych

**Przykładowe scenariusze:**

#### E2E-001: Pełny przepływ rejestracji i utworzenia pierwszego planu
1. Użytkownik otwiera `/register`
2. Wypełnia formularz: email, hasło
3. Submit → przekierowanie na `/dashboard`
4. Klik "Utwórz plan" → przekierowanie na `/plans/new`
5. Krok 1: Wybór 3 ćwiczeń z modalu biblioteki
6. Krok 2: Konfiguracja serii/powtórzeń dla każdego ćwiczenia
7. Krok 3: Wybór harmonogramu (weekly, dni: pon, śr, pt)
8. Submit → plan zapisany, sesje zaplanowane, przekierowanie na `/plans`
9. **Weryfikacja**: Plan widoczny na liście jako aktywny, kalendarz zawiera sesje

#### E2E-002: Rozpoczęcie i ukończenie sesji treningowej
1. Użytkownik loguje się
2. Dashboard pokazuje najbliższą zaplanowaną sesję
3. Klik "Rozpocznij trening" → przekierowanie na `/workout/[id]`
4. Status sesji zmienia się na `in_progress`
5. Dla pierwszego ćwiczenia, pierwsza seria:
   - Wprowadzenie wagi: 60kg
   - Wprowadzenie powtórzeń: 10
   - Klik "Zakończ serię" → timer odpoczynku startuje (60s)
6. Pominięcie timera lub odczekanie
7. Powtórzenie dla wszystkich serii wszystkich ćwiczeń
8. Klik "Ukończ trening" → modal potwierdzenia
9. Potwierdzenie → sesja ma status `completed`, przekierowanie na `/dashboard`
10. **Weryfikacja**: Historia zawiera zakończoną sesję, dane serii zapisane

#### E2E-003: Porzucenie treningu
1. Rozpoczęcie sesji (jak w E2E-002)
2. Zakończenie tylko 2 z 5 serii
3. Klik "Porzuć trening" → modal potwierdzenia
4. Potwierdzenie → sesja ma status `abandoned`
5. **Weryfikacja**: Sesja w historii jako porzucona, częściowe dane serii zapisane

#### E2E-004: Edycja istniejącego planu
1. Użytkownik otwiera `/plans`
2. Klik "Edytuj" na istniejącym planie
3. Zmiana nazwy planu
4. Dodanie nowego ćwiczenia (modal biblioteki)
5. Zmiana kolejności ćwiczeń (drag & drop)
6. Usunięcie jednego ćwiczenia
7. Submit → plan zaktualizowany
8. **Weryfikacja**: Zmiany widoczne na liście planów

#### E2E-005: Ochrona tras i przekierowania
1. Niezalogowany użytkownik próbuje otworzyć `/dashboard`
2. **Weryfikacja**: Przekierowanie na `/login`
3. Po zalogowaniu próba otwarcia `/login`
4. **Weryfikacja**: Przekierowanie na `/dashboard`

#### 3.3.1. Praktyki stabilności E2E
- Stabilne selektory: dodaj `data-testid` do kluczowych elementów (`LoginForm`, `PlanWizard`, `ActiveWorkoutPage`, `CalendarComponent`).
- Global setup: tworzenie konta testowego przez API i zapisywanie `storageState` per worker (omijamy klikanie logowania).
- Retries: 2; trace/screenshot/video – tylko dla testów z błędem.
- Drag & drop: 1 deterministyczny scenariusz E2E (preferowane interakcje klawiaturą), pozostałe asercje w testach komponentów/hooków.
- Offline: 1 scenariusz z `context.setOffline(true)`; pozostałe zachowania (kolejka, timery) testowane w unit/integration z fake timers.

### 3.4. Testy funkcjonalne (Functional Tests)

**Zakres:**
- Walidacja reguł biznesowych
- Scenariusze brzegowe i przypadki błędów
- Testy negatywne

**Przykładowe scenariusze:**

| Test ID | Funkcjonalność | Scenariusz | Oczekiwany wynik |
|---------|----------------|------------|------------------|
| FUNC-001 | Plan Creation | Próba utworzenia planu bez ćwiczeń | Błąd walidacji, status 400 |
| FUNC-002 | Plan Creation | Ćwiczenie z `target_sets < 1` | Błąd walidacji Zod |
| FUNC-003 | Session Start | Start sesji z nieistniejącym ID | Status 404 Not Found |
| FUNC-004 | Session Start | Start sesji w statusie `completed` | Status 400 Bad Request |
| FUNC-005 | Session Complete | Ukończenie sesji ze statusem `scheduled` | Status 400 Bad Request |
| FUNC-006 | Profile Update | PATCH z nieprawidłową wartością `weight_kg` (string) | Status 400, Zod validation error |
| FUNC-007 | Exercise Search | Wyszukiwanie z `q="bench"` | Tylko ćwiczenia zawierające "bench" w nazwie |
| FUNC-008 | Pagination | Request z `page=999` (poza zakresem) | Pusta lista, poprawny total count |
| FUNC-009 | Plan Deletion | Usunięcie planu z powiązanymi sesjami | Status 409 Conflict (restrict foreign key) |
| FUNC-010 | Timer | Regulacja timera poniżej 0s | Timer zatrzymuje się na 0s |

### 3.5. Testy bezpieczeństwa (Security Tests)

**Zakres:**
- Autentykacja i autoryzacja
- Izolacja danych użytkowników
- Walidacja inputów (SQL injection, XSS)

**Przykładowe scenariusze:**

| Test ID | Zagrożenie | Scenariusz | Oczekiwany wynik |
|---------|-----------|------------|------------------|
| SEC-001 | Unauthorized Access | GET /api/v1/profile bez tokenu sesji | Status 401 |
| SEC-002 | Data Isolation | User A próbuje pobrać plan User B (PUT /api/v1/workout-plans/{id_userB}) | Status 404 lub 403 |
| SEC-003 | SQL Injection | POST /api/v1/exercises z `q="'; DROP TABLE users;--"` | Bezpieczne zapytanie, brak wykonania SQL |
| SEC-004 | XSS | Nazwa planu z `<script>alert('XSS')</script>` | Output escapowany w HTML |
| SEC-005 | CSRF | Brak środków ochrony CSRF | Supabase cookies z SameSite, Astro CORS |

### 3.6. Testy UI/UX (User Interface Tests)

**Zakres:**
- Responsywność (mobile, tablet, desktop)
- Dostępność (WCAG 2.1 poziom AA)
- Interakcje z komponentami Shadcn/ui

**Przykładowe scenariusze:**

| Test ID | Komponent | Scenariusz | Oczekiwany wynik |
|---------|-----------|------------|------------------|
| UI-001 | LoginForm | Formularz responsywny na ekranie 320px | Wszystkie pola widoczne, brak overflow |
| UI-002 | PlanWizard | Nawigacja między krokami (back/next) | Stan formularza zachowany |
| UI-003 | ExerciseLibraryModal | Wirtualizowana lista 1000 ćwiczeń | Smooth scrolling, brak lagów |
| UI-004 | ActiveWorkoutPage | Timer countdown | Aktualizacja co 1s, animacja płynna |
| UI-005 | CalendarComponent | Wyświetlanie sesji w widoku miesiąca | Wszystkie sesje widoczne, kolory według statusu |
| UI-006 | Accessibility | Nawigacja klawiaturą (Tab, Enter, Space) | Wszystkie interaktywne elementy dostępne |
| UI-007 | Accessibility | Czytnik ekranu (ARIA labels) | Wszystkie przyciski i pola prawidłowo opisane |

### 3.7. Testy wydajnościowe (Performance Tests – opcjonalne dla MVP)

**Uwaga**: Pełne testy obciążeniowe są poza zakresem MVP, ale podstawowa walidacja jest zalecana.

**Zakres:**
- Czas odpowiedzi API p95: GET <500ms, POST <800ms (środowisko staging)
- Time to Interactive (TTI) strony p95: <3s dla krytycznych ekranów
- Lighthouse score (CI): Performance ≥80, Accessibility ≥90 (lokalnie: cel 90/95)

**Przykładowe scenariusze:**
- GET /api/v1/exercises z 500 rekordami: średni czas odpowiedzi
- Rendering `ActiveWorkoutPage` z 15 ćwiczeniami x 5 serii: czas do interakcji
- Pomiar Core Web Vitals (LCP, FID, CLS)

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł Autentykacji

#### Scenariusz 4.1.1: Rejestracja użytkownika
**Warunki wstępne**: Użytkownik nie jest zalogowany, email nie istnieje w bazie  
**Kroki**:
1. Przejdź do `/register`
2. Wypełnij pole email: `test@example.com`
3. Wypełnij pole password: `SecurePass123!`
4. Kliknij "Zarejestruj się"
5. Obserwuj przekierowanie i stan aplikacji

**Oczekiwany wynik**:
- Rekord utworzony w `auth.users` (Supabase Auth)
- Automatyczne wywołanie `POST /api/v1/profile` (empty body)
- Rekord utworzony w `public.users` z `id` === `auth.users.id`
- Sesja ustanowiona (cookie)
- Przekierowanie na `/dashboard`

**Dane testowe**: email: `new_user@test.com`, password: `ValidPass1!`

#### Scenariusz 4.1.2: Logowanie z poprawnymi danymi
**Warunki wstępne**: Użytkownik istnieje w bazie, nie jest zalogowany  
**Kroki**:
1. Przejdź do `/login`
2. Wypełnij email: `existing@example.com`
3. Wypełnij password: `CorrectPassword1!`
4. Kliknij "Zaloguj się"

**Oczekiwany wynik**:
- Supabase zwraca sesję JWT
- Cookie sesji ustawione
- Przekierowanie na `/dashboard`

#### Scenariusz 4.1.3: Logowanie z nieprawidłowym hasłem
**Warunki wstępne**: Użytkownik istnieje, nieprawidłowe hasło  
**Kroki**:
1. Przejdź do `/login`
2. Wypełnij email: `existing@example.com`
3. Wypełnij password: `WrongPassword`
4. Kliknij "Zaloguj się"

**Oczekiwany wynik**:
- Supabase zwraca błąd autentykacji
- Wyświetlenie komunikatu błędu w formularzu
- Użytkownik pozostaje na `/login`

#### Scenariusz 4.1.4: Wylogowanie
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Kliknij "Wyloguj" w TopMenu
2. Obserwuj przekierowanie

**Oczekiwany wynik**:
- Wywołanie `POST /api/v1/auth/logout`
- Sesja usunięta z Supabase
- Cookie sesji usunięte
- Przekierowanie na `/login`

#### Scenariusz 4.1.5: Dostęp do chronionej strony bez logowania
**Warunki wstępne**: Użytkownik niezalogowany  
**Kroki**:
1. Wpisz w przeglądarce `/dashboard`

**Oczekiwany wynik**:
- Middleware wykrywa brak sesji
- Przekierowanie na `/login`

### 4.2. Plany Treningowe

#### Scenariusz 4.2.1: Utworzenie planu z 3 ćwiczeniami
**Warunki wstępne**: Użytkownik zalogowany, biblioteka ćwiczeń zawiera dane  
**Kroki**:
1. Przejdź do `/plans`
2. Kliknij "Utwórz nowy plan"
3. **Krok 1 (wybór ćwiczeń)**:
   - Kliknij "Dodaj ćwiczenia"
   - W modalu wyszukaj "bench press", wybierz
   - Wyszukaj "squat", wybierz
   - Wyszukaj "deadlift", wybierz
   - Zamknij modal
4. **Krok 2 (konfiguracja)**:
   - Dla "bench press": 4 serie, 8 powtórzeń, 90s odpoczynek
   - Dla "squat": 5 serii, 5 powtórzeń, 120s odpoczynek
   - Dla "deadlift": 3 serie, 5 powtórzeń, 180s odpoczynek
5. **Krok 3 (harmonogram)**:
   - Nazwa planu: "Push Pull Legs"
   - Harmonogram: Weekly, dni: poniedziałek, środa, piątek
6. Kliknij "Zapisz plan"

**Oczekiwany wynik**:
- Plan zapisany w `workout_plans` (status: `is_active = true`)
- 3 rekordy w `plan_exercises` z poprawnymi `order_index`, `target_sets`, `target_reps`, `rest_seconds`
- Automatyczne utworzenie ~39 sesji (`workout_sessions`) na 3 miesiące naprzód (13 tygodni x 3 dni)
- Przekierowanie na `/plans`
- Plan widoczny na liście jako aktywny

**Dane testowe**:
- Plan name: "PPL Routine"
- Exercises: IDs [1, 5, 10]
- Schedule: weekly, days [1, 3, 5]

#### Scenariusz 4.2.2: Edycja nazwy planu
**Warunki wstępne**: Użytkownik ma istniejący plan  
**Kroki**:
1. Przejdź do `/plans`
2. Kliknij "Edytuj" przy planie "PPL Routine"
3. Zmień nazwę na "Push Pull Legs v2"
4. Kliknij "Zapisz"

**Oczekiwany wynik**:
- PATCH /api/v1/workout-plans/:id
- Nazwa w bazie zaktualizowana
- Zmiana widoczna na liście planów

#### Scenariusz 4.2.3: Zmiana kolejności ćwiczeń (drag & drop)
**Warunki wstępne**: Plan z 3+ ćwiczeniami  
**Kroki**:
1. Otwórz edycję planu
2. Przejdź do kroku 2 (StepExercises)
3. Przeciągnij "deadlift" (pozycja 3) na pozycję 1
4. Zapisz zmiany

**Oczekiwany wynik**:
- `order_index` w `plan_exercises` zaktualizowane: deadlift=0, bench press=1, squat=2
- Kolejność widoczna w UI po odświeżeniu

#### Scenariusz 4.2.4: Dodanie ćwiczenia do istniejącego planu
**Warunki wstępne**: Plan z 3 ćwiczeniami  
**Kroki**:
1. Edytuj plan
2. Krok 2: Kliknij "Dodaj ćwiczenia"
3. Wybierz "overhead press" z modalu
4. Ustaw: 3 serie, 10 powtórzeń, 60s
5. Zapisz plan

**Oczekiwany wynik**:
- Nowy rekord w `plan_exercises` z `order_index = 3`
- Plan zawiera 4 ćwiczenia

#### Scenariusz 4.2.5: Usunięcie ćwiczenia z planu
**Warunki wstępne**: Plan z 4 ćwiczeniami  
**Kroki**:
1. Edytuj plan
2. Krok 2: Kliknij "Usuń" przy "overhead press"
3. Zapisz plan

**Oczekiwany wynik**:
- Rekord usunięty z `plan_exercises` (cascade delete)
- Pozostałe 3 ćwiczenia z zaktualizowanym `order_index`

#### Scenariusz 4.2.6: Aktywacja innego planu
**Warunki wstępne**: Użytkownik ma 2 plany (Plan A aktywny, Plan B nieaktywny)  
**Kroki**:
1. Przejdź do `/plans`
2. Przy Planie B kliknij "Aktywuj"

**Oczekiwany wynik**:
- POST /api/v1/workout-plans/{planB_id}/activate
- Plan B: `is_active = true`
- Plan A: `is_active = false`
- Nowe sesje dla Planu B utworzone na 3 miesiące

#### Scenariusz 4.2.7: Usunięcie planu bez powiązanych sesji
**Warunki wstępne**: Plan utworzony, wszystkie sesje usunięte ręcznie  
**Kroki**:
1. Kliknij "Usuń plan"
2. Potwierdź w modalu

**Oczekiwany wynik**:
- DELETE /api/v1/workout-plans/:id
- Plan usunięty z bazy
- Lista planów zaktualizowana

#### Scenariusz 4.2.8: Próba usunięcia planu z powiązanymi sesjami
**Warunki wstępne**: Plan ma co najmniej 1 sesję w `workout_sessions`  
**Kroki**:
1. Kliknij "Usuń plan"
2. Potwierdź w modalu

**Oczekiwany wynik**:
- DELETE /api/v1/workout-plans/:id zwraca 409 Conflict
- Komunikat błędu: "Cannot delete plan with associated sessions"
- Plan pozostaje w bazie

### 4.3. Sesje Treningowe i Aktywny Trening

#### Scenariusz 4.3.1: Rozpoczęcie zaplanowanej sesji
**Warunki wstępne**: Użytkownik ma sesję ze statusem `scheduled`  
**Kroki**:
1. Otwórz `/dashboard`
2. Banner "Najbliższy trening" pokazuje sesję
3. Kliknij "Rozpocznij trening"

**Oczekiwany wynik**:
- POST /api/v1/workout-sessions/:id/start
- Status sesji zmienia się na `in_progress`
- `started_at` ustawione na NOW()
- Trigger bazy danych tworzy rekordy w `session_sets` (np. 15 serii dla 3 ćwiczeń x 5 serii)
- Przekierowanie na `/workout/[id]`
- Aktywny widok treningu pokazuje wszystkie serie

#### Scenariusz 4.3.2: Rejestrowanie serii (happy path)
**Warunki wstępne**: Sesja w statusie `in_progress`, widok `/workout/[id]`  
**Kroki**:
1. Dla pierwszej serii ("Bench Press – Seria 1/4"):
   - Wprowadź wagę: 60 kg
   - Wprowadź powtórzenia: 10
   - Kliknij "Zakończ serię"
2. Obserwuj timer odpoczynku (90s)
3. Poczekaj lub kliknij "Pomiń timer"
4. Powtórz dla wszystkich pozostałych serii

**Oczekiwany wynik**:
- PATCH /api/v1/session-sets/:id dla każdej serii
- Pola `actual_reps`, `weight_kg`, `status = 'completed'` zaktualizowane
- Timer startuje automatycznie po zakończeniu serii
- Timer wyświetla countdown (90s → 0s)
- Po zakończeniu wszystkich serii przycisk "Ukończ trening" aktywny

#### Scenariusz 4.3.3: Pominięcie serii
**Warunki wstępne**: Sesja w toku, widoczna lista serii  
**Kroki**:
1. Dla drugiej serii kliknij "Pomiń serię"

**Oczekiwany wynik**:
- PATCH /api/v1/session-sets/:id
- `status = 'skipped'`, `actual_reps` i `weight_kg` pozostają NULL
- Seria wizualnie oznaczona jako pominięta (szary kolor?)

#### Scenariusz 4.3.4: Regulacja timera (+15s, -15s)
**Wakunki wstępne**: Timer aktywny (np. 60s pozostało)  
**Kroki**:
1. Kliknij "+15s"
2. Obserwuj timer
3. Kliknij "-15s"

**Oczekiwany wynik**:
- Po kliknięciu "+15s": timer zwiększa się do 75s
- Po kliknięciu "-15s": timer zmniejsza się do 60s
- Stan timera zapisany w Zustand store (`active-workout-context`)

#### Scenariusz 4.3.5: Pauza i wznowienie timera
**Warunki wstępne**: Timer aktywny  
**Kroki**:
1. Kliknij "Pauza"
2. Odczekaj 5 sekund realnych
3. Kliknij "Wznów"

**Oczekiwany wynik**:
- Timer zatrzymuje się na wartości (np. 55s)
- Przez 5 sekund wartość się nie zmienia
- Po wznowieniu timer kontynuuje countdown od 55s

#### Scenariusz 4.3.6: Ukończenie sesji (wszystkie serie wykonane)
**Warunki wstępne**: Sesja `in_progress`, wszystkie serie ze statusem `completed` lub `skipped`  
**Kroki**:
1. Kliknij "Ukończ trening"
2. Potwierdź w modalu

**Oczekiwany wynik**:
- POST /api/v1/workout-sessions/:id/complete
- Status sesji zmienia się na `completed`
- `completed_at` ustawione na NOW()
- Przekierowanie na `/dashboard` lub `/history`
- Sesja widoczna w historii

#### Scenariusz 4.3.7: Próba ukończenia sesji z brakującymi seriami
**Warunki wstępne**: Sesja `in_progress`, 5 z 15 serii `pending`  
**Kroki**:
1. Kliknij "Ukończ trening"
2. Potwierdź w modalu

**Oczekiwany wynik**:
- POST /api/v1/workout-sessions/:id/complete zwraca 400 Bad Request
- Komunikat błędu: "Cannot complete session with pending sets"
- Sesja pozostaje w statusie `in_progress`

#### Scenariusz 4.3.8: Porzucenie sesji
**Warunki wstępne**: Sesja `in_progress`, dowolny stan wykonania serii  
**Kroki**:
1. Kliknij "Porzuć trening"
2. Potwierdź w modalu

**Oczekiwany wynik**:
- POST /api/v1/workout-sessions/:id/abandon
- Status sesji zmienia się na `abandoned`
- `completed_at` ustawione na NOW() (trigger)
- Przekierowanie na `/dashboard`
- Sesja widoczna w historii jako porzucona

#### Scenariusz 4.3.9: Próba rozpoczęcia drugiej sesji podczas aktywnej
**Warunki wstępne**: Użytkownik ma sesję w statusie `in_progress`  
**Kroki**:
1. Otwórz `/dashboard`
2. Próbuj kliknąć "Rozpocznij trening" dla innej zaplanowanej sesji

**Oczekiwany wynik**:
- POST /api/v1/workout-sessions/:id/start zwraca 409 Conflict
- Komunikat błędu: "User already has a workout session in progress"
- Przycisk "Rozpocznij" nieaktywny lub wyświetla komunikat

#### Scenariusz 4.3.10: Persystencja stanu aktywnego treningu (refresh)
**Warunki wstępne**: Sesja `in_progress`, timer aktywny (30s pozostało)  
**Kroki**:
1. Odśwież stronę (F5)

**Oczekiwany wynik**:
- Zustand store z `persist` middleware przywraca stan
- Sesja nadal widoczna
- Timer **nie** kontynuuje countdownu (restart od pełnego czasu odpoczynku akceptowalny dla MVP)
- Dane wprowadzonych serii zachowane

### 4.4. Kalendarz i Historia

#### Scenariusz 4.4.1: Wyświetlanie sesji w kalendarzu (widok miesiąca)
**Warunki wstępne**: Użytkownik ma 12 sesji w bieżącym miesiącu  
**Kroki**:
1. Przejdź do Dashboard z widokiem kalendarza
2. Obserwuj miesiąc bieżący

**Oczekiwany wynik**:
- Wszystkie 12 sesji widoczne jako eventy
- Kolory/ikony według statusu:
  - `scheduled`: niebieski
  - `in_progress`: żółty
  - `completed`: zielony
  - `abandoned`: czerwony
- Kliknięcie w event otwiera `SessionDetailsPanel`

#### Scenariusz 4.4.2: Filtrowanie historii po statusie
**Warunki wstępne**: Użytkownik ma 20 sesji w historii (10 completed, 5 abandoned, 5 scheduled)  
**Kroki**:
1. Przejdź do `/history`
2. Wybierz filtr: "Ukończone"

**Oczekiwany wynik**:
- GET /api/v1/workout-sessions?status=completed
- Lista pokazuje tylko 10 sesji ukończonych
- Total count = 10

#### Scenariusz 4.4.3: Szczegóły zakończonej sesji
**Warunki wstępne**: Sesja `completed` w historii  
**Kroki**:
1. Kliknij sesję w historii

**Oczekiwany wynik**:
- GET /api/v1/workout-sessions/:id
- Wyświetlenie:
  - Nazwa planu
  - Data rozpoczęcia i ukończenia
  - Czas trwania (np. 45 min)
  - Lista wykonanych serii z wagą i powtórzeniami
  - Pominięte serie oznaczone
- Przycisk "Zamknij" lub "Wróć"

### 4.5. Profil Użytkownika

#### Scenariusz 4.5.1: Aktualizacja profilu (waga, wzrost)
**Warunki wstępne**: Użytkownik zalogowany, ma profil  
**Kroki**:
1. Przejdź do `/profile`
2. Zakładka "Dane osobowe"
3. Zmień wagę z 70kg na 72kg
4. Zmień wzrost z 180cm na 182cm
5. Kliknij "Zapisz"

**Oczekiwany wynik**:
- PATCH /api/v1/profile
- Body: `{ weight_kg: 72, height_cm: 182 }`
- Profil zaktualizowany w `public.users`
- Toast potwierdzający: "Profil zaktualizowany"

#### Scenariusz 4.5.2: Pobranie profilu
**Warunki wstępne**: Użytkownik zalogowany  
**Kroki**:
1. Otwórz `/profile`

**Oczekiwany wynik**:
- GET /api/v1/profile
- Dane użytkownika wyświetlone w formularzu
- Pola: email, weight_kg, height_cm, gender, injuries_limitations

## 5. Środowisko testowe

### 5.1. Środowiska

| Środowisko | Cel | URL | Baza danych | Auth |
|------------|-----|-----|-------------|------|
| **Local** | Development, testy jednostkowe | http://localhost:3000 | Supabase Local (via CLI) | Supabase Auth Local |
| **Staging** | Testy integracyjne, E2E | https://staging.fitness-log.app | Supabase Project (staging) | Supabase Auth Staging |
| **Production** | Smoke tests po deployment | https://fitness-log.app | Supabase Project (prod) | Supabase Auth Prod |

Uwaga (Production): Smoke tests są wyłącznie read-only (brak mutacji). Używamy dedykowanego konta testowego i danych oznaczonych prefiksem `SMOKE_`; testy nie utrwalają nowych rekordów w środowisku produkcyjnym.

### 5.2. Konfiguracja środowiska lokalnego

**Wymagania:**
- Node.js 22.14.0 (`.nvmrc`)
- npm
- Supabase CLI (`npx supabase`)

**Setup:**
1. Clone repository:
   ```bash
   git clone <repo-url>
   cd fitness-log
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Supabase local:
   ```bash
   npx supabase start
   ```
4. Skopiuj `.env.example` do `.env` i wypełnij zmiennymi z outputu `supabase start`:
   ```
   SUPABASE_URL=http://localhost:54321
   SUPABASE_KEY=<anon_key>
   ```
5. Zaaplikuj migracje (jeśli nie auto-applied):
   ```bash
   npx supabase db reset
   ```
6. Zaseeduj dane testowe (opcjonalnie):
   ```bash
   npx supabase db seed
   ```
   6a. Utwórz konta w Supabase Auth (nie seedujemy `auth.users` SQL-em):
   ```bash
   # skrypt do utworzenia: scripts/seed-auth.ts (Supabase Admin API)
   node scripts/seed-auth.ts
   ```
7. Start dev server:
   ```bash
   npm run dev
   ```

### 5.3. Dane testowe (seed)

**Plik**: `supabase/seed.sql` (do utworzenia)

**Zawartość**:
- 3 grupy mięśniowe (Chest, Back, Legs)
- 6 podgrup (Upper Chest, Lats, Quads, etc.)
- 20 ćwiczeń z różnymi typami (compound/isolation)
- 2 użytkowników testowych:
  - Email: `test1@example.com`, Password: `TestPass1!`
  - Email: `test2@example.com`, Password: `TestPass2!`
- Po 2 plany treningowe na użytkownika
- Po 10 sesji treningowych (różne statusy)

**Import CSV**:
- `test-data/exercises.csv` → tabela `exercises`
- `test-data/muscle_groups.csv` → tabela `muscle_groups`
- `test-data/muscle_subgroups.csv` → tabela `muscle_subgroups`

**Uwaga**: `auth.users` nie seedujemy zwykłym SQL (GoTrue). Konta testowe zakładamy przez Supabase Admin API (np. skrypt `scripts/seed-auth.ts`), a następnie tworzymy odpowiadające rekordy w `public.users` (np. przez wywołanie `POST /api/v1/profile`). Skrypty seed powinny być idempotentne (unikalne emaile np. z sufiksem timestamp/CI RUN ID).

### 5.4. Zarządzanie danymi testowymi (reset, fixtures, teardown)

- Reset bazy przed testami integracyjnymi: `npx supabase db reset` (local).
- Idempotentne seedy: deterministyczne dane i unikalne identyfikatory użytkowników.
- Teardown E2E (staging): testy nie mutują danych trwałych; ewentualne zmiany oznaczamy prefiksem `E2E_` i sprzątamy w jobie post-run.
- Oddzielne konta na środowiska: `test1@...` (local), `staging_test1@...` (staging), `prod_smoke@...` (prod read-only).

## 6. Narzędzia do testowania

### 6.1. Framework testowy

| Typ testu | Narzędzie | Wersja | Uzasadnienie |
|-----------|-----------|---------|--------------|
| Unit | **Vitest** | ^1.0.0 | Szybki, kompatybilny z Vite/Astro, ESM support |
| Integration | **Vitest + Supabase Client** | - | Bezpośrednie testy API z rzeczywistą bazą |
| E2E | **Playwright** | ^1.40.0 | Multi-browser, auto-wait, Astro-friendly |
| Mocking | **Vitest Mock** + **MSW** | - | Mock API dla unit testów komponentów |
| Coverage | **Vitest Coverage (c8)** | - | Integracja z Vitest |

### 6.2. Dodatkowe narzędzia

- **Zod**: Walidacja schematów (już w projekcie)
- **Supabase CLI**: Zarządzanie lokalną bazą, migracje
- **Faker.js** (opcjonalnie): Generowanie danych testowych
- **Axe-core**: Testy dostępności (integracja z Playwright)
- **Lighthouse CI**: Automatyczne audyty wydajności (GitHub Actions)

### 6.3. CI/CD

**GitHub Actions workflow** (`.github/workflows/test.yml` – uproszczony, rozdzielone zadania):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  lint_unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit -- --reporter=junit --outputFile=./reports/unit.xml

  integration:
    runs-on: ubuntu-latest
    needs: [lint_unit]
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx supabase start
      - run: npm run test:integration -- --reporter=junit --outputFile=./reports/integration.xml

  build:
    runs-on: ubuntu-latest
    needs: [lint_unit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    env:
      BASE_URL: ${{ vars.E2E_BASE_URL || 'http://localhost:3000' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e -- --reporter=junit --output=./reports/e2e

  coverage:
    runs-on: ubuntu-latest
    needs: [lint_unit, integration]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
```

## 7. Harmonogram testów

### 7.1. Fazy testowania

| Faza | Typy testów | Czas trwania | Odpowiedzialny | Status |
|------|-------------|--------------|----------------|--------|
| **Faza 1: Setup** | Konfiguracja środowiska, seed data | 2 dni | DevOps/Dev | Planowana |
| **Faza 2: Unit Tests** | Walidacje, helpery, hooki | 3 dni | Backend Dev | Planowana |
| **Faza 3: Integration Tests** | API endpoints, serwisy, triggery | 5 dni | Backend Dev + QA | Planowana |
| **Faza 4: E2E Tests (Core)** | Auth, Plans, Sessions (happy path) | 4 dni | QA | Planowana |
| **Faza 5: E2E Tests (Extended)** | Edge cases, błędy, UI | 3 dni | QA | Planowana |
| **Faza 6: Security Tests** | Auth, izolacja danych, injection | 2 dni | Security/QA | Planowana |
| **Faza 7: Accessibility Tests** | ARIA, keyboard nav, screen reader | 2 dni | QA/Frontend | Planowana |
| **Faza 8: Regression Tests** | Powtórne testy po fixach | 2 dni | QA | Planowana |
| **Faza 9: UAT** | Testy akceptacyjne z użytkownikiem | 3 dni | Product Owner | Planowana |
| **Faza 10: Smoke Tests (Staging)** | Kluczowe scenariusze przed prod | 1 dzień | QA | Planowana |

**Całkowity czas**: ~27 dni roboczych (przy założeniu pracy równoległej: ~4-5 tygodni kalendarzowych)

### 7.2. Kamienie milowe

| Milestone | Data docelowa | Deliverables |
|-----------|---------------|--------------|
| M1: Środowisko testowe gotowe | Week 1 | Local + Staging setup, seed data |
| M2: Testy jednostkowe 80% coverage | Week 2 | Unit tests dla validations + utils |
| M3: API Integration tests pełne | Week 3 | Wszystkie endpointy przetestowane |
| M4: Core E2E paths działają | Week 4 | Auth, Create Plan, Complete Session |
| M5: Security audit pass | Week 5 | Brak krytycznych luk |
| M6: UAT approval | Week 6 | Product Owner sign-off |
| M7: Production ready | Week 6 | Wszystkie testy green, smoke tests pass |

## 8. Kryteria akceptacji testów

### 8.1. Kryteria przejścia (Entry Criteria)

Warunki, które muszą być spełnione przed rozpoczęciem testów:

- ✅ Wszystkie migracje bazy danych zaaplikowane
- ✅ Seed data dostępne w środowisku testowym
- ✅ API endpoints zaimplementowane zgodnie z specyfikacją
- ✅ Frontend zintegrowany z API
- ✅ Linter i formatter skonfigurowane (ESLint, Prettier)
- ✅ Test framework zainstalowany i skonfigurowany
- ✅ Staging environment dostępny

### 8.2. Kryteria wyjścia (Exit Criteria)

Warunki, które muszą być spełnione przed zakończeniem fazy testów:

- ✅ **Pokrycie kodu (Code Coverage)**:
  - Unit tests: ≥80% dla walidacji, serwisów, utils
  - Integration tests: ≥80% endpointów API (risk-based) LUB 100% ścieżek krytycznych
  - E2E tests: Krytyczne ścieżki (Auth, Create Plan, Start/Complete Session) przechodzą; edge cases pokryte na poziomie integracji/funkcjonalnym

- ✅ **Krytyczne błędy (Critical Bugs)**:
  - 0 błędów krytycznych (P0: blokują użycie aplikacji)
  - ≤2 błędów wysokiej ważności (P1: poważnie ograniczają funkcjonalność)

- ✅ **Scenariusze testowe**:
  - 100% scenariuszy krytycznych (auth, workflow sesji, CRUD planów) zaliczonych
  - ≥90% wszystkich scenariuszy zaliczonych

- ✅ **Bezpieczeństwo**:
  - Brak luk SEC-001 do SEC-005
  - Walidacja izolacji danych użytkowników na staging z włączonym RLS (lokalnie: weryfikacja własności na poziomie API)

- ✅ **Wydajność (dla MVP)**:
  - API response time p95 <500ms (GET), <800ms (POST) – staging
  - Lighthouse Performance score ≥80 (CI)
  - Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1

- ✅ **Dostępność**:
  - WCAG 2.1 Level AA: 0 krytycznych naruszeń
  - Lighthouse Accessibility score >90

- ✅ **Dokumentacja**:
  - Test report wygenerowany
  - Bug tracking system zaktualizowany
  - Known issues udokumentowane

### 8.3. Definicja "Zaliczonego" testu (Pass/Fail)

| Status | Definicja |
|--------|-----------|
| **Pass** | Test przeszedł zgodnie z oczekiwanym wynikiem, bez żadnych odchyleń |
| **Fail** | Test nie przeszedł, wynik nie zgadza się z oczekiwanym (bug report wymagany) |
| **Blocked** | Test nie może być wykonany z powodu błędu w innym module |
| **Skip** | Test pominięty (np. funkcjonalność wycofana, poza zakresem MVP) |

## 9. Role i odpowiedzialności w procesie testowania

### 9.1. Zespół

| Rola | Imię/Alias | Odpowiedzialności |
|------|------------|-------------------|
| **QA Lead** | [TBD] | Koordynacja testów, przegląd strategii, raportowanie do PM |
| **QA Engineer** | [TBD] | Wykonywanie testów E2E, manualne testy UI, bug reporting |
| **Backend Developer** | [TBD] | Testy jednostkowe i integracyjne API, fix bugów backend |
| **Frontend Developer** | [TBD] | Testy jednostkowe komponentów React, fix bugów UI |
| **DevOps Engineer** | [TBD] | Setup środowisk testowych, CI/CD, monitoring |
| **Product Owner** | [TBD] | Akceptacja UAT, priorytetyzacja bugów, sign-off |

### 9.2. Macierz odpowiedzialności (RACI)

| Aktywność | QA Lead | QA Eng | Backend Dev | Frontend Dev | DevOps | PO |
|-----------|---------|--------|-------------|--------------|--------|-----|
| Przygotowanie planu testów | **R/A** | C | C | C | I | C |
| Setup środowiska testowego | I | C | C | C | **R/A** | I |
| Testy jednostkowe (backend) | I | I | **R/A** | I | I | I |
| Testy jednostkowe (frontend) | I | I | I | **R/A** | I | I |
| Testy integracyjne API | C | **R** | **A** | I | C | I |
| Testy E2E | C | **R/A** | C | C | I | I |
| Testy bezpieczeństwa | **R** | **A** | C | C | C | I |
| Bug fixing | I | C | **R/A** (backend) | **R/A** (frontend) | I | C |
| Regression testing | C | **R/A** | I | I | I | I |
| UAT | C | **R** | I | I | I | **A** |
| Go/No-Go decision | I | C | I | I | I | **R/A** |

**Legenda**: R = Responsible (wykonawca), A = Accountable (odpowiedzialny), C = Consulted (konsultowany), I = Informed (informowany)

## 10. Procedury raportowania błędów

### 10.1. Narzędzie do śledzenia błędów

**Rekomendacja**: GitHub Issues (integracja z repo, prostota dla małego zespołu MVP)

**Alternatywy**: Jira, Linear, ClickUp

### 10.2. Szablon zgłoszenia błędu

```markdown
## 🐛 Opis błędu
Krótki opis problemu (1-2 zdania)

## 🔄 Kroki do reprodukcji
1. Krok 1
2. Krok 2
3. Krok 3

## ✅ Oczekiwane zachowanie
Co powinno się stać?

## ❌ Rzeczywiste zachowanie
Co się faktycznie stało?

## 📸 Screenshoty / Logi
(jeśli dotyczy)

## 🖥️ Środowisko
- **Przeglądarka**: Chrome 120.0.6099
- **OS**: Windows 11
- **Środowisko**: Staging
- **URL**: https://staging.fitness-log.app/plans
- **User ID**: test1@example.com

## 🔍 Dodatkowe informacje
- Network logs, console errors, stack trace
- Czy błąd jest powtarzalny? (Tak/Nie)
- Pierwsze wystąpienie: 2025-01-15 14:30

## 🏷️ Metadata
- **Priorytet**: P1 (Critical/High/Medium/Low)
- **Typ**: Bug/Regression/UI/Performance
- **Komponent**: Plans/Sessions/Auth/Profile/Exercises
```

### 10.3. Priorytety błędów

| Priorytet | Definicja | Przykład | SLA (Fix Time) |
|-----------|-----------|----------|----------------|
| **P0: Critical** | Blokuje działanie aplikacji, data loss, security | Nie można się zalogować, SQL injection | <24h |
| **P1: High** | Poważnie ogranicza funkcjonalność, brak workaround | Nie można utworzyć planu, sesja nie startuje | <3 dni |
| **P2: Medium** | Ograniczenie, ale istnieje workaround | Timer nie pauza poprawnie, UI glitch | <1 tydzień |
| **P3: Low** | Drobny problem, kosmetyczny | Typo w tekście, ikona niecentrowana | <2 tygodnie lub backlog |

### 10.4. Workflow błędu

```
[New] → [Triaged] → [In Progress] → [Fixed] → [Ready for Test] → [Verified] → [Closed]
                           ↓
                      [Won't Fix] / [Duplicate] / [Not a Bug]
```

**Statusy**:
1. **New**: Świeżo zgłoszony, oczekuje na review
2. **Triaged**: Zaakceptowany, priorytet ustalony, przypisany do developera
3. **In Progress**: Developer pracuje nad fixem
4. **Fixed**: Fix zaimplementowany, PR zmergowany
5. **Ready for Test**: Build dostępny w środowisku testowym
6. **Verified**: QA potwierdził fix
7. **Closed**: Błąd rozwiązany
8. **Won't Fix**: Zdecydowano nie fixować (np. out of scope MVP)
9. **Duplicate**: Duplikat innego zgłoszenia
10. **Not a Bug**: Działanie zgodne z oczekiwaniem (misunderstanding)

### 10.5. Komunikacja i eskalacja

**Kanały komunikacji**:
- **GitHub Issues**: Główny kanał dla bug trackingu
- **Slack/Discord**: Szybka komunikacja, daily updates
- **Stand-up meetings**: Codzienne updates (5-10 min)
- **Bug triage meeting**: 2x w tygodniu (po 30 min)

**Eskalacja**:
- **P0 bugs**: Natychmiastowa notyfikacja całego zespołu (Slack @channel)
- **P1 bugs**: Email + Slack mention QA Lead + PO
- **P2/P3 bugs**: Standard GitHub workflow

### 10.6. Metryki błędów (KPIs)

| Metryka | Cel MVP | Sposób pomiaru |
|---------|---------|----------------|
| **Bug Detection Rate** | >90% bugów wykrytych w testach (nie w prod) | (Bugs found in testing) / (Total bugs) |
| **Fix Rate** | >95% P0/P1 bugów zfixowanych przed release | (P0/P1 fixed) / (P0/P1 total) |
| **Regression Rate** | <5% zfixowanych bugów wraca | (Reopened bugs) / (Closed bugs) |
| **Mean Time to Fix (MTTF)** | P0: <24h, P1: <3 dni | Średni czas od [Triaged] → [Fixed] |
| **Test Pass Rate** | >95% dla automated tests | (Passed tests) / (Total tests) |

## 11. Ryzyka i mitigation

### 11.1. Potencjalne ryzyka testowe

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Mitigation |
|----|--------|-------------------|-------|------------|
| **R-001** | Brak dostępności środowiska testowego (Supabase downtime) | Średnie | Wysoki | Backup: lokalna instancja Supabase, monitoring uptime |
| **R-002** | Niewystarczające pokrycie testami E2E (test gaps) | Wysokie | Wysoki | Review test scenarios z PO, priorytyzacja krytycznych ścieżek |
| **R-003** | Database triggers nie działają jak oczekiwano | Średnie | Krytyczny | Testy integracyjne triggów przed E2E, seed data validation |
| **R-004** | Flaky tests (niestabilne testy E2E) | Wysokie | Średni | Retry mechanism, lepsze waitery w Playwright, cleanup po testach |
| **R-005** | Zbyt optymistyczne estymacje czasu testów | Średnie | Średni | Buffer 20% w harmonogramie, daily tracking progress |
| **R-006** | Brak jasnych akceptacji kryteriów (spec ambiguity) | Średnie | Wysoki | Sesje Q&A z PO, dokumentacja PRD, early feedback loops |
| **R-007** | Supabase Auth rate limiting w testach | Niskie | Średni | Mock auth w unit testach, throttle E2E tests |
| **R-008** | Brak seed data do testów progresji (historycznych) | Średnie | Średni | Skrypty seed z datą wsteczną, migracja test fixtures |
| **R-009** | Security gaps (RLS wyłączone w MVP) | Wysokie | Krytyczny | Manual tests izolacji danych, prepare RLS dla post-MVP, audyt security |
| **R-010** | Regression po fixach (cascade failures) | Średnie | Wysoki | Automated regression suite, CI/CD gating |

### 11.2. Krytyczne obszary do szczególnej uwagi

1. **Maszyna stanów sesji treningowej** (`scheduled` → `in_progress` → `completed`/`abandoned`):
   - Ryzyko: Nieprawidłowe przejścia stanów mogą doprowadzić do data corruption
   - Mitigation: Pełne pokrycie testów integracyjnych wszystkich przejść, edge cases (np. start podczas innej sesji)

2. **Database triggers** (auto-create `session_sets`, auto-set timestamps):
   - Ryzyko: Triggery mogą nie zadziałać w określonych warunkach (np. UPDATE bez zmiany statusu)
   - Mitigation: Testy integracyjne z bezpośrednim queryowaniem bazy po każdej operacji

3. **Offline queue dla zapisów serii** (`offlineQueue` w Zustand):
   - Ryzyko: Utrata danych przy utracie połączenia lub refresh strony
   - Mitigation: Testy symulujące utratę sieci (Playwright network throttling), weryfikacja persystencji w localStorage

4. **Persystencja timera** (Zustand persist):
   - Ryzyko: Timer może się zresetować lub zachować nieprawidłowy stan po refresh
   - Mitigation: E2E test z refresh podczas aktywnego timera, walidacja stanu w devtools

5. **Walidacja własności zasobów** (user A nie może edytować planu user B):
   - Ryzyko: Brak izolacji danych (RLS wyłączone w MVP)
   - Mitigation: Security tests z dwoma użytkownikami, testy negatywne (próby dostępu do obcych danych)

6. **Złożoność kreatora planu** (`PlanWizard` multi-step z drag & drop):
   - Ryzyko: Utrata stanu między krokami, błędne `order_index` po drag & drop
   - Mitigation: E2E tests wszystkich kombinacji kroków (forward, back), testy drag & drop z różnymi pozycjami

## 12. Zakończenie i zatwierdzenie

### 12.1. Podsumowanie

Niniejszy plan testów przedstawia kompleksowe podejście do zapewnienia jakości aplikacji Fitness Log MVP. Obejmuje:
- **6 typów testów**: jednostkowe, integracyjne, E2E, funkcjonalne, bezpieczeństwa, UI/UX
- **50+ szczegółowych scenariuszy testowych** dla kluczowych funkcjonalności
- **Jasne kryteria akceptacji** oparte na metrykach MVP (50% retention, 60% completion rate)
- **Harmonogram 6-tygodniowy** z kamieniami milowymi
- **Procedury bug trackingu** i komunikacji zespołowej
- **Identyfikację 10 głównych ryzyk** z planem mitigation

Cel: Dostarczenie gotowej do produkcji aplikacji, która spełnia wymagania biznesowe i techniczne, z naciskiem na stabilność przepływów treningowych i bezpieczeństwo danych użytkowników.

### 12.2. Zatwierdzenia

| Rola | Imię | Podpis | Data |
|------|------|--------|------|
| QA Lead | [TBD] | ________________ | ____/____/2025 |
| Backend Lead Developer | [TBD] | ________________ | ____/____/2025 |
| Frontend Lead Developer | [TBD] | ________________ | ____/____/2025 |
| Product Owner | [TBD] | ________________ | ____/____/2025 |
| DevOps Engineer | [TBD] | ________________ | ____/____/2025 |

### 12.3. Historia zmian dokumentu

| Wersja | Data | Autor | Zmiany |
|--------|------|-------|--------|
| 1.0 | 2025-01-16 | AI QA Engineer | Inicjalna wersja dokumentu |
| | | | |
| | | | |

---

**Koniec dokumentu**

*Ten plan testów jest dokumentem żywym i powinien być aktualizowany w miarę ewolucji projektu. Rekomendowane jest review co 2 tygodnie w trakcie fazy testowania.*

**Kontakt**:
- GitHub Issues: https://github.com/[repo]/issues
- Slack: #fitness-log-qa
- Email: qa@fitness-log.app

