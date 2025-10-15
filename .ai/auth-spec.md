# Specyfikacja Techniczna Modułu Autentykacji – Fitness Log

## Metadata

**Wersja:** 1.2  
**Data:** 2025-10-15  
**Autor:** System  
**Status:** Draft

## Streszczenie

Dokument definiuje architekturę techniczną modułu autentykacji dla aplikacji Fitness Log MVP. Moduł wykorzystuje Supabase Auth zintegrowany z Astro 5 w trybie SSR, zapewniając rejestrację, logowanie, wylogowanie oraz ochronę zasobów aplikacji.

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Przegląd warstwy prezentacji

Aplikacja wykorzystuje hybrydowy model renderowania:
- **Astro** – dla stron i komponentów statycznych oraz renderowania server-side
- **React 19** – dla komponentów interaktywnych wymagających stanu i obsługi zdarzeń po stronie klienta
- **Tailwind CSS 4** + **Shadcn/ui** – dla spójnego systemu stylizacji

### 1.2. Layouty

#### 1.2.1. PublicLayout.astro
- Layout dla stron publicznych (`/`, `/login`, `/register`)
- Minimalistyczny interfejs bez menu nawigacyjnego
- Brak zmian wymaganych

#### 1.2.2. Layout.astro
- Layout dla stron chronionych
- Zawiera `TopMenu` i `Toaster`
- **Wymagane zmiany:**
  - Sprawdzenie sesji przez `Astro.locals.supabase.auth.getSession()`
  - Redirect na `/login` jeśli brak sesji
  - Opcjonalnie: pobranie profilu użytkownika

### 1.3. Strony Astro

#### 1.3.1. Strony publiczne
- `login.astro` - renderuje `LoginForm`, middleware blokuje dostęp zalogowanych
- `register.astro` - renderuje `RegisterForm`, middleware blokuje dostęp zalogowanych  
- `index.astro` - landing page, dostępna dla wszystkich
- Wszystkie z `prerender = false`

#### 1.3.2. Strony chronione
- `dashboard.astro`, `plans.astro`, `profile.astro`, `workout/[id].astro`
- Używają `Layout.astro` z weryfikacją sesji
- Middleware i Layout przekierowują niezalogowanych na `/login`
- Wszystkie z `prerender = false`

### 1.4. Komponenty React

#### 1.4.1. LoginForm.tsx
- Walidacja formularza (react-hook-form + zod)
- Wywołanie `supabaseClient.auth.signInWithPassword()`
- Obsługa błędów (rate limiting, invalid credentials)
- Przekierowanie na `/dashboard` po sukcesie
- **Zmiana:** usunięcie dyrektywy `"use client"`

#### 1.4.2. RegisterForm.tsx
- Walidacja formularza (hasło min. 8 znaków, litera + cyfra, zgodność haseł, akceptacja regulaminu)
- Wywołanie `supabaseClient.auth.signUp()`
- Utworzenie profilu przez `POST /api/v1/profile`
- PasswordStrengthIndicator dla UX
- **Zmiana:** usunięcie dyrektywy `"use client"`

#### 1.4.3. AuthCard.astro
- Komponent prezentacyjny dla formularzy auth
- Logo, tytuł, slot dla formularza, stopka z linkami
- Brak zmian wymaganych

### 1.5. TopMenu.astro
- Menu nawigacyjne dla zalogowanych użytkowników
- Linki: Dashboard, Plany treningowe, Mój profil
- **Zmiana:** dodanie przycisku "Wyloguj się" wywołującego `POST /api/v1/auth/logout`
- Rekomendacja: formularz HTML z akcją POST (wariant A) lub React component (wariant B)

### 1.6. Scenariusze użycia

#### 1.6.1. Rejestracja (US-001)
1. Middleware sprawdza sesję, przekierowuje zalogowanych na `/dashboard`
2. Użytkownik wypełnia formularz (email, hasło, potwierdzenie, akceptacja regulaminu)
3. Walidacja client-side (zod)
4. `supabaseClient.auth.signUp()` → utworzenie `auth.users`
5. `POST /api/v1/profile` → utworzenie `public.users`
6. Przekierowanie na `/dashboard`

**Komunikaty błędów:** duplikat emaila, błąd sieci, błąd utworzenia profilu

#### 1.6.2. Logowanie (US-002)
1. Middleware sprawdza sesję, przekierowuje zalogowanych na `/dashboard`
2. Użytkownik wypełnia formularz (email, hasło)
3. Walidacja client-side (zod)
4. `supabaseClient.auth.signInWithPassword()` → utworzenie sesji
5. Przekierowanie na `/dashboard`

**Komunikaty błędów:** nieprawidłowe dane, rate limiting

#### 1.6.3. Wylogowanie (US-003)
1. Użytkownik klika "Wyloguj się" w TopMenu
2. `POST /api/v1/auth/logout` → `signOut()`
3. Przekierowanie na `/login`

#### 1.6.4. Dostęp do chronionej strony (US-019)
1. Użytkownik próbuje wejść na chronioną stronę bez sesji
2. Middleware/Layout sprawdza sesję → brak sesji
3. Przekierowanie na `/login`

#### 1.6.5. Wygaśnięcie sesji
- Server-side: Layout.astro wykrywa brak sesji → redirect na `/login`
- Client-side: API zwraca 401 → frontend przekierowuje na `/login`

#### 1.6.6. Wygaszanie po bezczynności (US-002 #4, US-019 #4)
- Domyślny limit bezczynności: 30 min (konfigurowalne: `SESSION_IDLE_MINUTES`).
- Mechanizm: patrz rozdział 3.3 „Idle timeout (bezczynność)”.
- UX: po przekroczeniu limitu żądania do API zwracają 401, strony SSR przekierowują na `/login?reason=idle`.

### 1.7. Walidacja

#### Client-side (React)
- `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- Instant feedback, walidacja onBlur i onSubmit
- Schematy zdefiniowane w komponentach lub `src/lib/validation/auth.validation.ts`

#### Server-side (API)
- `zod` dla walidacji body
- `handleZodError` dla formatowania błędów
- Format odpowiedzi: `{ error, message, details: [{ field, message }] }`

#### Kluczowe komunikaty błędów

| Kontekst | Kod | Komunikat |
|----------|-----|-----------|
| Email format | client | "Nieprawidłowy e-mail" |
| Hasło długość | client | "Hasło musi mieć min. 8 znaków" |
| Hasło regex | client | "Musi zawierać literę i cyfrę" |
| Zgodność haseł | client | "Hasła nie są zgodne" |
| Regulamin | client | "Zaakceptuj regulamin" |
| Duplikat email | 409 | "Użytkownik już istnieje" |
| Rate limit | 429 | "Zbyt wiele prób..." |
| Auth error | 400 | "Nieprawidłowe dane logowania" |
| Unauthorized | 401 | Redirect na `/login` |

---

## 2. LOGIKA BACKENDOWA

### 2.1. Architektura

**Stack:**
- Supabase (PostgreSQL + Auth)
- Astro Server Endpoints (`src/pages/api/**/*.ts`)
- Service Layer (`src/lib/services/*.service.ts`)
- Validation Layer (`src/lib/validation/*.validation.ts`)

**Flow:** Request → Endpoint → checkAuth → Validation → Service → Supabase → Database

**Zasady:** Endpoints jako thin wrappers, serwisy testowalne, walidacja w endpointach, błędy rzucane w serwisach

### 2.2. API Endpoints

#### POST /api/v1/auth/logout (nowy)
- **Lokalizacja:** `src/pages/api/v1/auth/logout.ts`
- **Request:** POST, brak body, cookie z sesją
- **Response:** `200 OK` + `{ message: "..." }` lub `500`
- **Implementacja:** wywołanie `context.locals.supabase.auth.signOut()`
- Nie wymaga weryfikacji auth (można wylogować wygasłą sesję)

#### POST /api/v1/profile (istniejący)
- Utworzenie profilu w `public.users`
- **Request:** POST, body `ProfileCreateCommand` (opcjonalnie pusty)
- **Response:** `201` + ProfileDTO | `400`/`401`/`409`/`500`
- **Zmiana:** zaktualizować `checkAuth` na rzeczywistą weryfikację sesji
- Profil tworzony po rejestracji, relacja 1:1 z `auth.users`

#### GET /api/v1/profile (istniejący)
- Pobranie profilu zalogowanego użytkownika
- Wymaga aktualizacji `checkAuth`

#### PATCH /api/v1/profile (istniejący)
- Aktualizacja profilu zalogowanego użytkownika
- Wymaga aktualizacji `checkAuth`

#### Wspólna weryfikacja: `checkAuthAndActivity()` (nowy)
- Funkcja łącząca weryfikację sesji z kontrolą bezczynności (idle timeout).
- Zwraca 401, gdy brak sesji lub przekroczony limit bezczynności; w trybie SSR inicjuje redirect.
- Uaktualnia wskaźnik aktywności (cookie `lastActivityAt`) dla uwierzytelnionych żądań.

### 2.3. Middleware

#### src/middleware/index.ts
- **Obecne:** udostępnienie `supabaseClient` w `context.locals`, przekierowanie zalogowanych z `/login`/`/register`
- **Zmiany:** ochrona chronionych stron (redirect niezalogowanych na `/login`) oraz obsługa limitu bezczynności (cookie `lastActivityAt`, wymuszenie wylogowania po przekroczeniu limitu).
- **Logika:**
  1. Zalogowani na `/login`|`/register` → redirect `/dashboard`
  2. Niezalogowani na chronione strony → redirect `/login`
  3. API i assety pomijane (własna weryfikacja w endpointach); dla uwierzytelnionych żądań aktualizuj `lastActivityAt`.
  4. Zalogowani z przekroczonym limitem bezczynności → `signOut()` + redirect `/login?reason=idle`.
- **Rekomendacja:** middleware jako fallback + Layout.astro jako druga warstwa ochrony

### 2.4. Serwisy

#### ProfileService
- **Lokalizacja:** `src/lib/services/profile.service.ts`
- CRUD operacje na `public.users`
- Metody: `getProfile`, `createProfile`, `updateProfile`, `profileExists`
- Używany przez endpoints `/api/v1/profile`

#### Autoryzacja i własność (RLS wyłączone)
- Wszystkie serwisy przyjmują i wymagają `userId` z sesji (`auth.getUser()`/`getSession()`).
- Wszystkie zapytania muszą być jawnie zawężone do zasobów użytkownika, np. `eq('user_id', userId)`.
- Operacje modyfikujące (UPDATE/DELETE) muszą dodatkowo sprawdzać własność w warunku (defense-in-depth), aby uniemożliwić modyfikację cudzych danych.
- API nie przyjmuje `userId` z klienta – zawsze ustala je po stronie serwera z sesji.
- Po włączeniu RLS w produkcji logika pozostaje, a RLS staje się dodatkową barierą bezpieczeństwa.

### 2.5. Walidacja

#### Profile validation (istniejący)
- `src/lib/validation/profile.validation.ts`
- `profileCreateSchema`, `profileUpdateSchema`

#### Auth validation (opcjonalnie do utworzenia)
- `src/lib/validation/auth.validation.ts`
- `loginSchema`, `registerSchema` (email, password, confirmPassword, termsAccepted)
- Obecnie w komponentach, można wyekstraktować dla reużywalności

### 2.6. Obsługa błędów

#### Custom error classes
- `NotFoundError` → 404
- `ConflictError` → 409
- `UnprocessableEntityError` → 422
- `BadRequestError` → 400

#### Wzorzec w endpointach
1. Check auth
2. Parse i walidacja body
3. Call service
4. Return success
5. Catch: ZodError → 400, Custom errors → odpowiedni kod, inne → 500

### 2.7. SSR

#### Konfiguracja
- `astro.config.mjs`: `output: "server"`, adapter: `node({ mode: "standalone" })`
- Strony domyślnie renderowane per request
- `prerender: false` explicitne dla chronionych stron

#### Wzorzec sprawdzania sesji
- `Astro.locals.supabase.auth.getSession()`
- Jeśli brak sesji → `Astro.redirect('/login')`
- Opcjonalnie: pobranie profilu użytkownika

---

## 3. SYSTEM AUTENTYKACJI

### 3.1. Architektura Supabase Auth

#### Tabele danych

**auth.users** (zarządzana przez Supabase)
- Schemat `auth`, przechowuje email, hashed password, metadata
- Automatycznie tworzona przy `signUp()`
- UUID jako klucz główny

**public.users** (zarządzana przez aplikację)
- Schemat `public`, przechowuje dane profilowe (weight_kg, height_cm, gender, injuries_limitations)
- Relacja 1:1 z `auth.users`: `id references auth.users(id) on delete cascade`
- Tworzona przez `/api/v1/profile` POST podczas rejestracji
- Migracja: `20250109120100_create_users_table.sql`

**RLS (Row Level Security)**
- Wyłączone w MVP (`20250109121200_disable_rls_policies.sql`)
- **W produkcji:** włączyć z politykami `auth.uid() = id`

#### Supabase Client

- **Lokalizacja:** `src/db/supabase.client.ts`
- **Env vars:** `SUPABASE_URL`, `SUPABASE_KEY` (anon/public key)
- Ten sam klient używany server-side i client-side
- Automatyczne zarządzanie sesją (cookies lub localStorage)

### 3.2. Przepływy autentykacji

#### Rejestracja (signUp)
1. RegisterForm: walidacja → `supabaseClient.auth.signUp()`
2. Supabase: utworzenie `auth.users`, JWT token, sesja
3. Frontend: `POST /api/v1/profile` → utworzenie `public.users`
4. Redirect na `/dashboard`

**Konfiguracja:** email confirmation off/on (rekomendacja MVP: off)  
**Błędy:** 409 (duplikat), 422 (invalid), 500

#### Logowanie (signInWithPassword)
1. LoginForm: walidacja → `supabaseClient.auth.signInWithPassword()`
2. Supabase: weryfikacja, JWT token, sesja
3. Redirect na `/dashboard`

**Błędy:** 400 (invalid credentials), 429 (rate limit), 500

#### Wylogowanie (signOut)
1. TopMenu: `POST /api/v1/auth/logout`
2. Backend: `context.locals.supabase.auth.signOut()`
3. Redirect na `/login`

#### Weryfikacja sesji (getSession)
- Server-side: `await context.locals.supabase.auth.getSession()`
- Zwraca obiekt `{ user, access_token, refresh_token, expires_at }` lub `null`
- `getSession()` odczytuje z cookie, `getUser()` weryfikuje JWT w Supabase

#### Odświeżanie tokenu
- Automatyczne przez Supabase Client
- Access token: 1h, refresh token: 30d
- Proces transparentny dla użytkownika

### 3.3. Zarządzanie sesją

#### Przechowywanie
- Client-side: localStorage (SPA) lub cookies (SSR, rekomendowane)
- Server-side: cookies dla Astro SSR
- Supabase automatycznie wykrywa środowisko

#### Cykl życia
- **Utworzenie:** `signUp`/`signInWithPassword` → access token (1h) + refresh token (30d)
- **Utrzymanie:** automatyczne odświeżanie access token
- **Wygaśnięcie:** refresh token expires → wymagane ponowne logowanie

#### Idle timeout (bezczynność)
- Konfiguracja: zmienna `SESSION_IDLE_MINUTES` (domyślnie 30, zgodnie z PRD US-002/US-019).
- Przechowywanie wskaźnika: httpOnly cookie `lastActivityAt` (Unix ms), aktualizowane w middleware oraz w funkcji `checkAuthAndActivity()` na każde uwierzytelnione żądanie.
- Wymuszenie: `checkAuthAndActivity()` w endpointach oraz kontrola w `Layout.astro`/middleware. Po przekroczeniu limitu → 401 (API) lub redirect `/login?reason=idle` (SSR) + `auth.signOut()`.
- Frontend: obsłużyć 401 → nawigacja do `/login?reason=idle`; opcjonalny „heartbeat” (np. przy aktywności użytkownika) wywołujący lekki endpoint GET, aby utrzymać aktywną sesję podczas realnego użycia.

#### Bezpieczeństwo
- **HttpOnly cookies:** zapobiega XSS (token niedostępny dla JS)
- **HTTPS:** wymagane w produkcji (Secure flag)
- **CSRF:** SameSite cookies + origin checking
- **Rate limiting:** automatyczne przez Supabase (429 po przekroczeniu)

### 3.4. Integracja z Astro

#### Middleware
- Udostępnienie w `context.locals.supabase = supabaseClient`
- TypeScript typing w `src/env.d.ts`: rozszerzenie `App.Locals`

#### Astro pages
- Sprawdzanie sesji: `await Astro.locals.supabase.auth.getSession()`
- Jeśli brak sesji → `Astro.redirect('/login')`
- Przekazanie danych do React: props `userId`, `profile`

#### React components
- Import: `import { supabaseClient } from "@/db/supabase.client"`
- Auth methods: `signInWithPassword()`, `signUp()`, `getSession()`, `signOut()`
- Ten sam klient co server-side, operacje po stronie klienta

### 3.5. Edge cases

#### Duplikat email
- Supabase zwraca 409 → "Użytkownik już istnieje"
- Komunikat nie ujawnia szczegółów (bezpieczeństwo)

#### Błędne dane logowania
- Supabase zwraca 400 → "Nieprawidłowe dane logowania"
- Generyczny komunikat zapobiega enumeracji użytkowników

#### Rate limiting
- Supabase zwraca 429 → "Zbyt wiele prób. Spróbuj ponownie później."
- Konfiguracja w Supabase Dashboard

#### Sesja wygasła
- Server-side: Layout sprawdza sesję → redirect `/login`
- Client-side: API zwraca 401 → frontend przekierowuje `/login`
- Generic fetch wrapper dla obsługi 401

#### Auth bez profilu
- `auth.users` istnieje, `public.users` nie istnieje
- Rozwiązanie: endpoint `/api/v1/profile` idempotentny lub recovery flow (login + create profile)

### 3.6. Bezpieczeństwo

#### Hasła
- Supabase: bcrypt + unique salt, przechowywanie w `auth.users`
- Wymagania: min. 8 znaków, litera + cyfra (client-side validation)
- Best practices: brak plain text w logach, HTTPS w produkcji

#### CSRF
- Supabase: SameSite cookies + origin checking
- Dodatkowo: dla mutacji aplikacyjnych (w tym logout) weryfikuj nagłówek `Origin` oraz/lub stosuj token CSRF (double submit cookie: `csrfToken` + nagłówek `X-CSRF-Token`).
- Logout: endpoint wyłącznie POST; przy braku sesji zwraca 200 (idempotentnie), nie ujawniając stanu użytkownika.

#### XSS
- React: automatyczne escapowanie JSX
- Supabase: HttpOnly cookies (tokens niedostępne dla JS)

#### SQL Injection
- Supabase Client: parametryzowane zapytania
- Nigdy raw SQL z user input

#### Rate Limiting
- Supabase: automatyczne dla auth endpoints
- Dodatkowo: middleware rate limiting dla custom endpoints

#### Logging
- **Logować:** nieudane logowania (IP, timestamp), utworzenie konta, wylogowanie
- **Nie logować:** hasła, pełne JWT, PII w plain text
- Narzędzia: `logApiError`, opcjonalnie Sentry/LogRocket

### 3.7. Telemetria i metryki (PRD US-020)
- Identyfikacja użytkownika na potrzeby metryk pochodzi z sesji (`auth.getUser()`), nie z danych przesyłanych przez klienta.
- Moduły domenowe (np. treningi) emitują zdarzenia (start/zakończenie), ale warstwa auth zapewnia dostępność `userId` w SSR (`context.locals.user`) oraz w endpointach.
- Rekomendacja: wspólny helper `trackEvent(name, { userId, ... })` wywoływany w kluczowych miejscach domenowych; auth nie implementuje metryk treningowych, jedynie dostarcza tożsamość użytkownika.

---

## 4. PODSUMOWANIE I NASTĘPNE KROKI

### 4.1. Checklist implementacji

#### Frontend
- [ ] LoginForm/RegisterForm – usunąć `"use client"`
- [ ] TopMenu – dodać przycisk wylogowania
- [ ] Layout – sprawdzenie sesji i redirect
- [ ] Idle UX – obsłużyć 401 i redirect na `/login?reason=idle`

#### Backend
- [ ] Endpoint `POST /api/v1/auth/logout`
- [ ] Zaktualizować `checkAuth` w `api-helpers.ts`
- [ ] Przetestować `/api/v1/profile` z rzeczywistą auth
- [ ] Dodać `checkAuthAndActivity` (idle timeout + session check) i użyć we wszystkich chronionych endpointach
- [ ] Wdrożyć autoryzację/własność w serwisach (zawężanie po `userId`)
- [ ] CSRF: weryfikacja `Origin`/double submit cookie dla mutacji (w tym logout)

#### Middleware
- [ ] Ochrona chronionych stron
- [ ] Utrzymywanie cookie `lastActivityAt` i wymuszanie wylogowania po bezczynności

#### Konfiguracja
- [ ] Zmienne środowiskowe (`SUPABASE_URL`, `SUPABASE_KEY`)
- [ ] Supabase Dashboard (email confirmation, RLS)
- [ ] TypeScript: rozszerzyć `env.d.ts` o `Locals.supabase`
- [ ] `SESSION_IDLE_MINUTES` (domyślnie 30)
- [ ] Sekret CSRF (jeśli włączone tokeny CSRF)

### 4.2. Rozszerzenia (poza MVP)

- Reset hasła (Supabase `resetPasswordForEmail()`)
- Email verification
- Social login (OAuth: Google, Facebook, GitHub)
- 2FA (Supabase MFA)
- Remember me (wydłużenie refresh token)
- Account deletion

### 4.3. Decyzje do podjęcia

| Pytanie | Rekomendacja MVP |
|---------|------------------|
| Email confirmation? | Wyłączyć (włączyć po MVP) |
| Session storage? | Cookies (HttpOnly dla SSR) |
| RLS policies? | Wyłączone w dev, włączone w prod |
| Redirect po login? | Zawsze `/dashboard` |
| Logout? | POST endpoint |
| Walidacja haseł? | Obecny regex (8 znaków, litera+cyfra) |
| Error messages? | Generyczne dla login, szczegółowe dla register |
| Idle timeout? | 30 min domyślnie (konfigurowalne) |
| CSRF enforcement? | Origin + SameSite; token dla mutacji w prod |

---

## 5. KONTRAKTY MIĘDZY WARSTWAMI

### Frontend → Backend
- **RegisterForm → `/api/v1/profile`:** POST `{}` → 201 ProfileDTO | 401/409/500
- **LoginForm → Supabase:** `signInWithPassword()` → session | error
- **TopMenu → `/api/v1/auth/logout`:** POST → 200 | 500
// Chronione żądania nie przekazują `userId`; backend ustala je z sesji.
// Dla mutacji (w tym logout) opcjonalnie nagłówek `X-CSRF-Token` (gdy włączony mechanizm double submit cookie).

### Backend → Supabase
- **Endpoints:** `auth.getUser()`, `from('users').insert()`, `auth.signOut()`

### Middleware → Astro
- **Udostępnia:** `context.locals.supabase`, `context.locals.user`/`userId`; aktualizuje `lastActivityAt` dla uwierzytelnionych żądań
- **Strony używają:** `Astro.locals.supabase.auth.getSession()`, `from(...)`

### Layout → React
- **Props:** `userId`, `profile`, `session` (opcjonalnie)
- **React:** może używać props lub wykonywać własne zapytania

---

**Koniec specyfikacji**

