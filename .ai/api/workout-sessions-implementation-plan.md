# API Endpoint Implementation Plan: Workout Sessions Management

## 1. Przegląd punktu końcowego

Endpoint `/api/v1/workout-sessions` zarządza sesjami treningowymi użytkownika w aplikacji fitness log. Sesje treningowe to konkretne instancje treningu w kalendarzu użytkownika, utworzone na podstawie planu treningowego. Każda sesja ma status śledzący jej cykl życia: od zaplanowanej, przez w toku, do ukończonej lub porzuconej.

Endpoint obsługuje pełny zakres operacji CRUD oraz specjalne akcje workflow:

**Standardowe operacje CRUD:**

- **GET /api/v1/workout-sessions**: Lista sesji z filtrowaniem i paginacją
- **POST /api/v1/workout-sessions**: Ręczne utworzenie zaplanowanej sesji
- **GET /api/v1/workout-sessions/:id**: Szczegóły sesji wraz z seriami ćwiczeń
- **PATCH /api/v1/workout-sessions/:id**: Aktualizacja statusu, daty lub notatek
- **DELETE /api/v1/workout-sessions/:id**: Usunięcie sesji (tylko przed rozpoczęciem)

**Workflow helpers:**

- **POST /api/v1/workout-sessions/:id/start**: Rozpoczęcie sesji (zmiana na `in_progress`, automatyczne utworzenie serii)
- **POST /api/v1/workout-sessions/:id/complete**: Ukończenie sesji (walidacja wykonania wszystkich serii)
- **POST /api/v1/workout-sessions/:id/abandon**: Porzucenie sesji (zmiana na `abandoned`)

## 2. Szczegóły żądania

### 2.1 GET /api/v1/workout-sessions

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/workout-sessions`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Query Parameters:**

- **Opcjonalne:**
  - `status` (string): Filtrowanie po statusie sesji. Wartości: `scheduled`, `in_progress`, `completed`, `abandoned`
  - `from` (ISODateString): Data początkowa zakresu (włącznie). Format: ISO-8601 (np. "2025-01-15")
  - `to` (ISODateString): Data końcowa zakresu (włącznie). Format: ISO-8601
  - `page` (integer): Numer strony (1-indexed, domyślnie 1)
  - `page_size` (integer): Rozmiar strony (domyślnie 20, max 100)
  - `sort` (string): Sortowanie (np. "scheduled_for", "-scheduled_for"). Domyślnie: "-scheduled_for"

**Request Body:** Brak

**Przykładowe zapytania:**

```
GET /api/v1/workout-sessions
GET /api/v1/workout-sessions?status=in_progress
GET /api/v1/workout-sessions?from=2025-01-01&to=2025-01-31&page=1&page_size=10
GET /api/v1/workout-sessions?status=completed&sort=-scheduled_for
```

### 2.2 POST /api/v1/workout-sessions

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-sessions`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry:**

- **Wymagane:**
  - `workout_plan_id` (integer): ID planu treningowego należącego do użytkownika
  - `scheduled_for` (ISODateString): Data zaplanowanego treningu (format: YYYY-MM-DD)
- **Opcjonalne:**
  - `notes` (string): Notatki użytkownika do sesji

**Request Body Example:**

```json
{
  "workout_plan_id": 5,
  "scheduled_for": "2025-01-20",
  "notes": "Morning workout - focus on form"
}
```

### 2.3 GET /api/v1/workout-sessions/:id

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/workout-sessions/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): ID sesji treningowej

**Request Body:** Brak

### 2.4 PATCH /api/v1/workout-sessions/:id

**Metoda HTTP:** PATCH  
**Struktura URL:** `/api/v1/workout-sessions/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): ID sesji treningowej

**Parametry Request Body:**

- **Wymagane:** Brak (częściowa aktualizacja, przynajmniej jedno pole)
- **Opcjonalne:**
  - `status` (string): Status sesji (`scheduled`, `in_progress`, `completed`, `abandoned`)
  - `scheduled_for` (ISODateString): Data zaplanowanego treningu
  - `notes` (string): Notatki użytkownika

**Request Body Example:**

```json
{
  "scheduled_for": "2025-01-22",
  "notes": "Rescheduled to evening"
}
```

**Uwaga:** Zmiana statusu przez PATCH jest możliwa, ale zaleca się używanie dedykowanych workflow endpoints (start, complete, abandon) dla lepszej semantyki i walidacji.

### 2.5 DELETE /api/v1/workout-sessions/:id

**Metoda HTTP:** DELETE  
**Struktura URL:** `/api/v1/workout-sessions/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): ID sesji treningowej

**Request Body:** Brak

**Ograniczenia:** Usunięcie możliwe tylko dla sesji ze statusem `scheduled`. Sesje w trakcie lub ukończone nie mogą być usunięte.

### 2.6 POST /api/v1/workout-sessions/:id/start

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-sessions/:id/start`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): ID sesji treningowej

**Request Body:** `{}` (pusty obiekt lub brak body)

**Działanie:**

- Zmienia status sesji z `scheduled` na `in_progress`
- Ustawia `started_at` na bieżący czas
- Trigger w bazie danych automatycznie tworzy rekordy w `session_sets` na podstawie `plan_exercises`
- Zwraca pełną sesję wraz z utworzonymi seriami

**Ograniczenia:**

- Sesja musi być w statusie `scheduled`
- Użytkownik nie może mieć innej sesji w statusie `in_progress` (constraint bazy danych)

### 2.7 POST /api/v1/workout-sessions/:id/complete

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-sessions/:id/complete`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): ID sesji treningowej

**Request Body:** `{}` (pusty obiekt lub brak body)

**Działanie:**

- Waliduje, czy wszystkie serie zostały wykonane (status `completed` lub `skipped`)
- Zmienia status sesji z `in_progress` na `completed`
- Ustawia `completed_at` na bieżący czas
- Zwraca zaktualizowaną sesję

**Ograniczenia:**

- Sesja musi być w statusie `in_progress`
- Wszystkie serie muszą mieć status `completed` lub `skipped` (nie mogą być `pending`)

### 2.8 POST /api/v1/workout-sessions/:id/abandon

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-sessions/:id/abandon`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): ID sesji treningowej

**Request Body:** `{}` (pusty obiekt lub brak body)

**Działanie:**

- Zmienia status sesji z `in_progress` na `abandoned`
- Ustawia `completed_at` na bieżący czas (trigger w bazie danych)
- Zwraca zaktualizowaną sesję

**Ograniczenia:**

- Sesja musi być w statusie `in_progress`

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

### DTOs (Data Transfer Objects)

```typescript
// Basic session DTO with narrowed status
export type WorkoutSessionDTO = Omit<WorkoutSessionRow, "status"> & {
  status: WorkoutSessionStatus;
};

// Session with embedded sets (used by GET /:id and POST /:id/start)
export type WorkoutSessionDetailDTO = WorkoutSessionDTO & {
  sets: SessionSetDTO[];
};

// Session set DTO
export type SessionSetDTO = Omit<SessionSetRow, "status"> & {
  status: SessionSetStatus;
};
```

### Command Models (Request Payloads)

```typescript
// POST /api/v1/workout-sessions
export type WorkoutSessionCreateCommand = Pick<
  DbInsert<"workout_sessions">,
  "workout_plan_id" | "scheduled_for" | "notes"
>;

// PATCH /api/v1/workout-sessions/:id
export type WorkoutSessionUpdateCommand = Partial<
  Pick<DbUpdate<"workout_sessions">, "scheduled_for" | "notes" | "status">
> & {
  status?: WorkoutSessionStatus;
};
```

### Query Models

```typescript
// GET /api/v1/workout-sessions query parameters
export type WorkoutSessionsQueryParams = PaginationParams & {
  status?: WorkoutSessionStatus;
  from?: ISODateString;
  to?: ISODateString;
};
```

### Response Types

```typescript
// Paginated list response
export type WorkoutSessionsListResponse = PaginatedResponse<WorkoutSessionDTO>;
```

### Pomocnicze typy

```typescript
export type WorkoutSessionStatus = "scheduled" | "in_progress" | "completed" | "abandoned";
export type SessionSetStatus = "pending" | "completed" | "skipped";
export type ISODateString = string; // ISO-8601 in UTC
```

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/v1/workout-sessions

**Sukces (200 OK):**

```json
{
  "data": [
    {
      "id": 15,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "workout_plan_id": 5,
      "status": "scheduled",
      "scheduled_for": "2025-01-20",
      "started_at": null,
      "completed_at": null,
      "notes": "Morning workout",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": 14,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "workout_plan_id": 5,
      "status": "completed",
      "scheduled_for": "2025-01-18",
      "started_at": "2025-01-18T08:30:00.000Z",
      "completed_at": "2025-01-18T09:45:00.000Z",
      "notes": null,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-18T09:45:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "page_size": 20,
  "last_page": 3
}
```

**Błąd - Brak autentykacji (401 Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Błąd - Nieprawidłowe parametry query (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "status",
      "message": "Invalid enum value. Expected 'scheduled' | 'in_progress' | 'completed' | 'abandoned'"
    }
  ]
}
```

### 4.2 POST /api/v1/workout-sessions

**Sukces (201 Created):**

```json
{
  "id": 16,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_plan_id": 5,
  "status": "scheduled",
  "scheduled_for": "2025-01-20",
  "started_at": null,
  "completed_at": null,
  "notes": "Morning workout - focus on form",
  "created_at": "2025-01-16T14:20:00.000Z",
  "updated_at": "2025-01-16T14:20:00.000Z"
}
```

**Błąd - Nieprawidłowe dane (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "scheduled_for",
      "message": "Invalid date format. Expected ISO-8601 date string (YYYY-MM-DD)"
    }
  ]
}
```

**Błąd - Plan nie istnieje lub nie należy do użytkownika (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Workout plan not found or does not belong to user"
}
```

### 4.3 GET /api/v1/workout-sessions/:id

**Sukces (200 OK):**

```json
{
  "id": 15,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_plan_id": 5,
  "status": "in_progress",
  "scheduled_for": "2025-01-20",
  "started_at": "2025-01-20T08:00:00.000Z",
  "completed_at": null,
  "notes": "Morning workout",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-20T08:00:00.000Z",
  "sets": [
    {
      "id": 101,
      "workout_session_id": 15,
      "plan_exercise_id": 25,
      "set_number": 1,
      "target_reps": 10,
      "actual_reps": 10,
      "weight_kg": 60.0,
      "status": "completed",
      "completed_at": "2025-01-20T08:05:00.000Z",
      "notes": null,
      "created_at": "2025-01-20T08:00:00.000Z",
      "updated_at": "2025-01-20T08:05:00.000Z"
    },
    {
      "id": 102,
      "workout_session_id": 15,
      "plan_exercise_id": 25,
      "set_number": 2,
      "target_reps": 10,
      "actual_reps": null,
      "weight_kg": null,
      "status": "pending",
      "completed_at": null,
      "notes": null,
      "created_at": "2025-01-20T08:00:00.000Z",
      "updated_at": "2025-01-20T08:00:00.000Z"
    }
  ]
}
```

**Błąd - Sesja nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Workout session not found"
}
```

### 4.4 PATCH /api/v1/workout-sessions/:id

**Sukces (200 OK):**

```json
{
  "id": 15,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_plan_id": 5,
  "status": "scheduled",
  "scheduled_for": "2025-01-22",
  "started_at": null,
  "completed_at": null,
  "notes": "Rescheduled to evening",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-16T16:30:00.000Z"
}
```

**Błąd - Pusty request body (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Request body must contain at least one field to update"
}
```

**Błąd - Nieprawidłowa zmiana statusu (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Invalid status transition. Use dedicated workflow endpoints (start, complete, abandon) for status changes."
}
```

### 4.5 DELETE /api/v1/workout-sessions/:id

**Sukces (204 No Content):**

Brak body w odpowiedzi.

**Błąd - Sesja już rozpoczęta (422 Unprocessable Entity):**

```json
{
  "error": "Unprocessable Entity",
  "message": "Cannot delete session that has been started. Status must be 'scheduled'."
}
```

### 4.6 POST /api/v1/workout-sessions/:id/start

**Sukces (200 OK):**

```json
{
  "id": 15,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_plan_id": 5,
  "status": "in_progress",
  "scheduled_for": "2025-01-20",
  "started_at": "2025-01-20T08:00:00.000Z",
  "completed_at": null,
  "notes": "Morning workout",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-20T08:00:00.000Z",
  "sets": [
    {
      "id": 101,
      "workout_session_id": 15,
      "plan_exercise_id": 25,
      "set_number": 1,
      "target_reps": 10,
      "actual_reps": null,
      "weight_kg": null,
      "status": "pending",
      "completed_at": null,
      "notes": null,
      "created_at": "2025-01-20T08:00:00.000Z",
      "updated_at": "2025-01-20T08:00:00.000Z"
    },
    {
      "id": 102,
      "workout_session_id": 15,
      "plan_exercise_id": 25,
      "set_number": 2,
      "target_reps": 10,
      "actual_reps": null,
      "weight_kg": null,
      "status": "pending",
      "completed_at": null,
      "notes": null,
      "created_at": "2025-01-20T08:00:00.000Z",
      "updated_at": "2025-01-20T08:00:00.000Z"
    }
  ]
}
```

**Błąd - Nieprawidłowy status (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Session must be in 'scheduled' status to start"
}
```

**Błąd - Użytkownik ma już sesję w toku (409 Conflict):**

```json
{
  "error": "Conflict",
  "message": "User already has a workout session in progress. Complete or abandon the current session first."
}
```

### 4.7 POST /api/v1/workout-sessions/:id/complete

**Sukces (200 OK):**

```json
{
  "id": 15,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_plan_id": 5,
  "status": "completed",
  "scheduled_for": "2025-01-20",
  "started_at": "2025-01-20T08:00:00.000Z",
  "completed_at": "2025-01-20T09:15:00.000Z",
  "notes": "Morning workout",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-20T09:15:00.000Z"
}
```

**Błąd - Nieprawidłowy status (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Session must be in 'in_progress' status to complete"
}
```

**Błąd - Nie wszystkie serie ukończone (422 Unprocessable Entity):**

```json
{
  "error": "Unprocessable Entity",
  "message": "Cannot complete session. All sets must be marked as 'completed' or 'skipped'. Found 3 sets with 'pending' status."
}
```

### 4.8 POST /api/v1/workout-sessions/:id/abandon

**Sukces (200 OK):**

```json
{
  "id": 15,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_plan_id": 5,
  "status": "abandoned",
  "scheduled_for": "2025-01-20",
  "started_at": "2025-01-20T08:00:00.000Z",
  "completed_at": "2025-01-20T08:30:00.000Z",
  "notes": "Morning workout",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-20T08:30:00.000Z"
}
```

**Błąd - Nieprawidłowy status (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Session must be in 'in_progress' status to abandon"
}
```

## 5. Przepływ danych

### 5.1 GET /api/v1/workout-sessions (lista)

```
1. Request → Astro API Endpoint (/api/v1/workout-sessions/index.ts)
2. Sprawdzenie autentykacji (checkAuth())
3. Walidacja query parameters przez Zod Schema (optional filters)
4. Wywołanie WorkoutSessionService.listSessions(userId, queryParams)
5. Query do Supabase:
   - SELECT * FROM workout_sessions WHERE user_id = userId
   - Opcjonalne filtry: status, date range (scheduled_for)
   - Sortowanie domyślne: scheduled_for DESC
   - LIMIT/OFFSET dla paginacji
   - COUNT(*) dla total
6. Mapowanie DB Rows → WorkoutSessionDTO[]
7. Kalkulacja metadanych paginacji (total, page, page_size, last_page)
8. Response (200) z WorkoutSessionsListResponse
```

### 5.2 POST /api/v1/workout-sessions (utworzenie)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parse request body (parseRequestBody())
4. Walidacja przez Zod Schema (sessionCreateSchema)
5. Wywołanie WorkoutSessionService.createSession(userId, command)
6. W serwisie:
   a. Sprawdzenie czy workout_plan_id istnieje i należy do użytkownika
   b. INSERT do workout_sessions z user_id, workout_plan_id, scheduled_for, notes
   c. Status domyślny: 'scheduled'
7. Mapowanie created row → WorkoutSessionDTO
8. Response (201) z WorkoutSessionDTO
9. Błędy:
   - 400: Zod validation error
   - 404: workout_plan not found or doesn't belong to user
   - 500: Database error
```

### 5.3 GET /api/v1/workout-sessions/:id (szczegóły)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parsowanie id z path params
4. Wywołanie WorkoutSessionService.getSessionById(sessionId, userId)
5. Query do Supabase:
   - SELECT * FROM workout_sessions WHERE id = sessionId AND user_id = userId
   - JOIN/SELECT session_sets WHERE workout_session_id = sessionId
   - ORDER BY sets: plan_exercise_id, set_number
6. Mapowanie do WorkoutSessionDetailDTO (session + embedded sets)
7. Response (200) z WorkoutSessionDetailDTO lub (404) jeśli brak sesji
```

### 5.4 PATCH /api/v1/workout-sessions/:id (aktualizacja)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parsowanie id z path params
4. Parse request body (parseRequestBody())
5. Walidacja czy body nie jest pusty
6. Walidacja przez Zod Schema (sessionUpdateSchema, partial)
7. Wywołanie WorkoutSessionService.updateSession(sessionId, userId, command)
8. W serwisie:
   a. Sprawdzenie czy sesja istnieje i należy do użytkownika
   b. UPDATE workout_sessions SET ... WHERE id = sessionId AND user_id = userId
   c. Trigger automatycznie aktualizuje updated_at
9. Mapowanie updated row → WorkoutSessionDTO
10. Response (200) z WorkoutSessionDTO
11. Błędy:
    - 400: Empty body, invalid data, invalid status transition
    - 404: Session not found
    - 500: Database error
```

### 5.5 DELETE /api/v1/workout-sessions/:id (usunięcie)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parsowanie id z path params
4. Wywołanie WorkoutSessionService.deleteSession(sessionId, userId)
5. W serwisie:
   a. Sprawdzenie czy sesja istnieje i należy do użytkownika
   b. Sprawdzenie czy status = 'scheduled'
   c. DELETE FROM workout_sessions WHERE id = sessionId AND user_id = userId
6. Response (204) No Content
7. Błędy:
   - 404: Session not found
   - 422: Cannot delete - session already started
   - 500: Database error
```

### 5.6 POST /api/v1/workout-sessions/:id/start (rozpoczęcie)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parsowanie id z path params
4. Wywołanie WorkoutSessionService.startSession(sessionId, userId)
5. W serwisie:
   a. Sprawdzenie czy sesja istnieje i należy do użytkownika
   b. Sprawdzenie czy status = 'scheduled'
   c. Sprawdzenie czy user nie ma już sesji in_progress (preventive check)
   d. UPDATE workout_sessions SET status = 'in_progress', started_at = NOW()
   e. Trigger w bazie danych automatycznie tworzy session_sets:
      - INSERT INTO session_sets dla każdego plan_exercise
      - target_sets serii dla każdego ćwiczenia
      - status = 'pending'
   f. SELECT session z sets
6. Mapowanie → WorkoutSessionDetailDTO (with sets)
7. Response (200) z WorkoutSessionDetailDTO
8. Błędy:
   - 400: Invalid status (not scheduled)
   - 404: Session not found
   - 409: User already has in_progress session (unique constraint violation)
   - 500: Database error
```

### 5.7 POST /api/v1/workout-sessions/:id/complete (ukończenie)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parsowanie id z path params
4. Wywołanie WorkoutSessionService.completeSession(sessionId, userId)
5. W serwisie:
   a. Sprawdzenie czy sesja istnieje i należy do użytkownika
   b. Sprawdzenie czy status = 'in_progress'
   c. SELECT COUNT(*) FROM session_sets WHERE workout_session_id = sessionId AND status = 'pending'
   d. Jeśli są pending sets → błąd 422
   e. UPDATE workout_sessions SET status = 'completed', completed_at = NOW()
   f. Trigger automatycznie ustawi completed_at jeśli NULL
6. Mapowanie updated row → WorkoutSessionDTO
7. Response (200) z WorkoutSessionDTO
8. Błędy:
   - 400: Invalid status (not in_progress)
   - 404: Session not found
   - 422: Not all sets completed/skipped
   - 500: Database error
```

### 5.8 POST /api/v1/workout-sessions/:id/abandon (porzucenie)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji (checkAuth())
3. Parsowanie id z path params
4. Wywołanie WorkoutSessionService.abandonSession(sessionId, userId)
5. W serwisie:
   a. Sprawdzenie czy sesja istnieje i należy do użytkownika
   b. Sprawdzenie czy status = 'in_progress'
   c. UPDATE workout_sessions SET status = 'abandoned'
   d. Trigger automatycznie ustawi completed_at = NOW() (jeśli zmiana z in_progress)
6. Mapowanie updated row → WorkoutSessionDTO
7. Response (200) z WorkoutSessionDTO
8. Błędy:
   - 400: Invalid status (not in_progress)
   - 404: Session not found
   - 500: Database error
```

### Interakcje z zewnętrznymi usługami:

**Supabase:**

- Autentykacja użytkownika przez Supabase Auth
- Operacje CRUD na tabeli `workout_sessions`
- Relacja do `workout_plans` (walidacja właściciela)
- Relacja do `session_sets` (automatyczne tworzenie przez trigger)
- Wykorzystanie triggerów:
  - `update_updated_at_column` - automatyczna aktualizacja `updated_at`
  - `validate_workout_session_status_change` - automatyczne ustawianie `started_at` i `completed_at`
  - `create_session_sets_for_workout` - automatyczne tworzenie serii przy rozpoczęciu
- Constraint: `idx_workout_sessions_user_in_progress` - tylko jedna sesja in_progress per user

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Wymagana autentykacja**: Wszystkie endpointy wymagają zalogowanego użytkownika
- **Implementacja**: Sprawdzenie przez `checkAuth()` helper
- **Kod błędu**: 401 Unauthorized gdy brak autentykacji

### 6.2 Autoryzacja

- **Izolacja danych**: Użytkownik może zarządzać tylko własnymi sesjami
- **Implementacja**:
  - Użycie `user.id` z sessji w zapytaniach SQL (WHERE user_id = userId)
  - Walidacja workout_plan_id należy do użytkownika przy tworzeniu
  - RLS policies w Supabase jako dodatkowa warstwa ochrony
- **Ochrona**: Brak możliwości dostępu do sesji innych użytkowników przez podanie innego ID
- **Kod błędu**: 403 Forbidden lub 404 Not Found (information hiding)

### 6.3 Walidacja danych wejściowych

- **Schemat Zod**: Walidacja wszystkich danych przed zapisem do bazy
- **Constrainty dla POST/PATCH**:
  - `workout_plan_id`: integer, > 0, musi istnieć i należeć do użytkownika
  - `scheduled_for`: valid ISO date string (YYYY-MM-DD)
  - `status`: enum (`scheduled`, `in_progress`, `completed`, `abandoned`)
  - `notes`: string, optional, max length (określić limit, np. 2000 znaków)
- **Constrainty dla GET list (query params)**:
  - `status`: optional enum
  - `from`/`to`: optional valid ISO date strings
  - `page`: integer, >= 1
  - `page_size`: integer, 1-100
  - `sort`: string matching pattern
- **Ochrona przed injection**: Supabase client automatycznie sanityzuje zapytania
- **Walidacja biznesowa**:
  - Status transitions: tylko określone przejścia są dozwolone
  - DELETE tylko gdy status = 'scheduled'
  - Start tylko gdy status = 'scheduled' i brak innej in_progress session
  - Complete/Abandon tylko gdy status = 'in_progress'

### 6.4 Walidacja integralności danych

- **Foreign key constraints**:
  - `workout_plan_id` musi istnieć w `workout_plans`
  - `workout_plan_id` musi należeć do użytkownika (explicit check w service)
- **Status transitions**:
  - Scheduled → In Progress (start)
  - In Progress → Completed (complete) | Abandoned (abandon)
  - Brak możliwości cofnięcia statusu
  - PATCH może zmieniać status, ale zaleca się workflow endpoints
- **Unique constraints**:
  - Tylko jedna sesja `in_progress` per użytkownik (DB partial unique index)

### 6.5 Sanityzacja danych

- **Tekstowe pola**: Trimowanie białych znaków w notatках
- **Ochrona przed XSS**: Dane są przechowywane jako plain text, frontend odpowiada za escapowanie przy wyświetlaniu
- **Długość pól**: Ograniczenie maksymalnej długości notatek

### 6.6 Rate Limiting

- **Rekomendacja**: Implementacja rate limiting w middleware Astro
- **Limity sugerowane**:
  - GET list: 60 żądań/minutę per użytkownik
  - POST create: 20 żądań/minutę per użytkownik
  - POST start/complete/abandon: 30 żądań/minutę per użytkownik
  - PATCH/DELETE: 30 żądań/minutę per użytkownik

### 6.7 CORS

- **Konfiguracja**: Ograniczenie dostępu tylko z dozwolonych domen
- **Implementacja**: Ustawienie odpowiednich nagłówków CORS w middleware
- **Rekomendacja**: Whitelist dozwolonych origin w konfiguracji

### 6.8 Information Disclosure

- **404 vs 403**: Używanie 404 Not Found zamiast 403 Forbidden dla nie-istniejących zasobów innych użytkowników (information hiding)
- **Error messages**: Błędy 500 nie ujawniają szczegółów implementacji
- **Logging**: Szczegółowe błędy logowane server-side, ogólne komunikaty wysyłane do klienta

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Kod | Nazwa                 | Scenariusz                                                  | Odpowiedź                                   |
| --- | --------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| 200 | OK                    | Pomyślne GET, PATCH, workflow actions                       | WorkoutSessionDTO lub DetailDTO             |
| 201 | Created               | Pomyślne POST create                                        | WorkoutSessionDTO                           |
| 204 | No Content            | Pomyślne DELETE                                             | Brak body                                   |
| 400 | Bad Request           | Nieprawidłowe dane wejściowe, invalid status transition     | Error z details                             |
| 401 | Unauthorized          | Brak autentykacji                                           | Error message                               |
| 404 | Not Found             | Sesja/plan nie istnieje lub nie należy do użytkownika       | Error message                               |
| 409 | Conflict              | Próba start gdy user ma już in_progress session             | Error message                               |
| 422 | Unprocessable Entity  | Nieprawidłowy stan zasobu (np. nie można complete bez sets) | Error message z szczegółami                 |
| 500 | Internal Server Error | Błąd bazy danych lub nieoczekiwany błąd                     | Error message (bez szczegółów wewnętrznych) |

### 7.2 Szczegółowe scenariusze

**401 Unauthorized:**

- Trigger: Brak autentykacji (`checkAuth()` returns null)
- Response: `{ "error": "Unauthorized", "message": "Authentication required" }`

**400 Bad Request - Zod Validation:**

- Trigger: Nieprawidłowe dane wejściowe (Zod validation fails)
- Response:

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "workout_plan_id",
      "message": "Expected number, received string"
    },
    {
      "field": "scheduled_for",
      "message": "Invalid date format. Expected ISO-8601 date string"
    }
  ]
}
```

**400 Bad Request - Empty PATCH Body:**

- Trigger: PATCH request z pustym body
- Response: `{ "error": "Bad Request", "message": "Request body must contain at least one field to update" }`

**400 Bad Request - Invalid Status Transition:**

- Trigger: Próba workflow action w nieprawidłowym statusie
- Examples:
  - Start: `{ "error": "Bad Request", "message": "Session must be in 'scheduled' status to start" }`
  - Complete: `{ "error": "Bad Request", "message": "Session must be in 'in_progress' status to complete" }`
  - Abandon: `{ "error": "Bad Request", "message": "Session must be in 'in_progress' status to abandon" }`

**404 Not Found - Session:**

- Trigger: Sesja nie istnieje lub nie należy do użytkownika (GET/PATCH/DELETE/workflow)
- Response: `{ "error": "Not Found", "message": "Workout session not found" }`

**404 Not Found - Workout Plan:**

- Trigger: Próba utworzenia sesji z nieistniejącym planem lub planem innego użytkownika (POST)
- Response: `{ "error": "Not Found", "message": "Workout plan not found or does not belong to user" }`

**409 Conflict - Duplicate In Progress:**

- Trigger: Próba start gdy użytkownik ma już sesję in_progress (unique constraint violation)
- Response: `{ "error": "Conflict", "message": "User already has a workout session in progress. Complete or abandon the current session first." }`

**422 Unprocessable Entity - Cannot Delete Started:**

- Trigger: Próba DELETE sesji która została już rozpoczęta (status != 'scheduled')
- Response: `{ "error": "Unprocessable Entity", "message": "Cannot delete session that has been started. Status must be 'scheduled'." }`

**422 Unprocessable Entity - Cannot Complete:**

- Trigger: Próba complete gdy są pending sets
- Response: `{ "error": "Unprocessable Entity", "message": "Cannot complete session. All sets must be marked as 'completed' or 'skipped'. Found 3 sets with 'pending' status." }`

**500 Internal Server Error:**

- Trigger: Błąd bazy danych, niespodziewany wyjątek
- Logging: `console.error` z pełnym stack trace
- Response: `{ "error": "Internal Server Error", "message": "An unexpected error occurred. Please try again later." }`

### 7.3 Format odpowiedzi błędu

```typescript
interface ErrorResponse {
  error: string; // Nazwa błędu
  message: string; // Czytelny komunikat dla użytkownika
  details?: Array<{
    // Opcjonalne szczegóły (dla walidacji)
    field: string;
    message: string;
  }>;
}
```

### 7.4 Logowanie błędów

```typescript
// Błędy 500 - pełne logowanie
console.error("[WorkoutSessionsAPI] Unexpected error:", {
  endpoint: "POST /api/v1/workout-sessions/:id/start",
  sessionId: sessionId,
  userId: user.id,
  error: error.message,
  stack: error.stack,
});

// Błędy 400 - podstawowe logowanie
console.warn("[WorkoutSessionsAPI] Validation error:", {
  endpoint: "POST /api/v1/workout-sessions",
  userId: user.id,
  errors: zodError.errors,
});

// Błędy 409 - info level
console.info("[WorkoutSessionsAPI] Conflict:", {
  endpoint: "POST /api/v1/workout-sessions/:id/start",
  sessionId: sessionId,
  userId: user.id,
  reason: "User already has in_progress session",
});

// Błędy 422 - info level z kontekstem
console.info("[WorkoutSessionsAPI] Unprocessable:", {
  endpoint: "POST /api/v1/workout-sessions/:id/complete",
  sessionId: sessionId,
  userId: user.id,
  pendingSetsCount: pendingCount,
});
```

### 7.5 Error handling w service layer

Service methods powinny rzucać typed errors które endpoint handler może łatwo mapować:

```typescript
// Custom error types for service layer
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

class UnprocessableEntityError extends Error {
  constructor(
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "UnprocessableEntityError";
  }
}

class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

// Usage in endpoint handler
try {
  const result = await service.startSession(id, userId);
  return jsonResponse(result, 200);
} catch (error) {
  if (error instanceof NotFoundError) {
    return errorResponse("Not Found", error.message, 404);
  }
  if (error instanceof ConflictError) {
    return errorResponse("Conflict", error.message, 409);
  }
  if (error instanceof BadRequestError) {
    return errorResponse("Bad Request", error.message, 400);
  }
  // ... etc
}
```

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **List endpoint z paginacją:**
   - Potencjalnie duża liczba sesji na użytkownika (setki/tysiące)
   - Filtrowanie po date range może być kosztowne bez indeksów
   - COUNT(\*) dla total może być wolny dla dużych tabel

2. **Detail endpoint z setami:**
   - JOIN/SELECT session_sets może zwrócić dziesiątki rekordów (np. plan z 10 ćwiczeń × 3-5 serii)
   - N+1 problem jeśli nie używamy proper JOIN

3. **Start endpoint:**
   - Trigger tworzy multiple inserts do session_sets (może być 30-50 rekordów)
   - Transaction overhead dla atomic operation

4. **Complete endpoint:**
   - COUNT query na session_sets dla walidacji
   - Może być wolne jeśli brak indeksu na (workout_session_id, status)

5. **Autentykacja:**
   - Weryfikacja sessji Supabase na każde żądanie
   - Mitygacja: Session caching w middleware

### 8.2 Strategie optymalizacji

#### 8.2.1 Indeksowanie (już zaimplementowane w DB)

```sql
-- Już istniejące indeksy z migracji:
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX idx_workout_sessions_scheduled_for ON workout_sessions(scheduled_for);
CREATE INDEX idx_workout_sessions_user_scheduled ON workout_sessions(user_id, scheduled_for DESC);
CREATE INDEX idx_workout_sessions_user_status ON workout_sessions(user_id, status);

-- Dodatkowy indeks dla filtrowania (jeśli potrzebny):
CREATE INDEX idx_workout_sessions_user_scheduled_status
  ON workout_sessions(user_id, scheduled_for DESC, status);
```

```sql
-- Indeksy dla session_sets (już istniejące):
CREATE INDEX idx_session_sets_workout_session_id ON session_sets(workout_session_id);
CREATE INDEX idx_session_sets_status ON session_sets(status);
CREATE INDEX idx_session_sets_session_exercise ON session_sets(workout_session_id, plan_exercise_id);
```

#### 8.2.2 Query Optimization

**List endpoint:**

```typescript
// Optymalizacja COUNT query - użyć estimated count dla dużych tabel (przyszła optymalizacja)
// Dla MVP: standardowy COUNT(*) z WHERE clauses jest wystarczający

// Efficient query z wszystkimi filtrami:
const { data, error, count } = await supabase
  .from("workout_sessions")
  .select("*", { count: "exact" }) // lub "planned" dla estimated count
  .eq("user_id", userId)
  .filter("status", "eq", status) // jeśli status filter
  .gte("scheduled_for", from) // jeśli from filter
  .lte("scheduled_for", to) // jeśli to filter
  .order("scheduled_for", { ascending: false })
  .range(offset, offset + limit - 1);
```

**Detail endpoint - efficient JOIN:**

```typescript
// Single query z embedded sets (Supabase syntax)
const { data, error } = await supabase
  .from("workout_sessions")
  .select(
    `
    *,
    sets:session_sets(*)
  `
  )
  .eq("id", sessionId)
  .eq("user_id", userId)
  .order("set_number", { foreignTable: "session_sets", ascending: true })
  .single();

// Alternative: dwa separate queries jeśli Supabase nested order nie działa dobrze
```

**Complete validation - efficient check:**

```typescript
// Zamiast COUNT(*), użyj EXISTS dla szybszej walidacji:
const { data, error } = await supabase
  .from("session_sets")
  .select("id")
  .eq("workout_session_id", sessionId)
  .eq("status", "pending")
  .limit(1);

const hasPendingSets = data && data.length > 0;
```

#### 8.2.3 Caching

**Session caching (przyszła optymalizacja):**

```typescript
// Cache active/recent sessions w memory/Redis
// Key: `user:${userId}:sessions:list:${cacheKey}`
// TTL: 5-10 minut
// Invalidacja: Po każdej operacji zmieniającej dane (POST/PATCH/DELETE/workflow)

// Cache workout plans dla walidacji (przyszła optymalizacja)
// Key: `user:${userId}:plan:${planId}`
// TTL: 15 minut
// Invalidacja: Przy zmianach planu (przez webhook lub cache invalidation API)
```

**Auth caching:**

```typescript
// Cache user auth w middleware (Supabase session caching)
// Reuse context.locals.user zamiast wielokrotnych calls do auth.getUser()
```

#### 8.2.4 Pagination Best Practices

```typescript
// Domyślne wartości:
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

// Walidacja:
const pageSize = Math.min(Math.max(requestedPageSize ?? DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
const page = Math.max(requestedPage ?? 1, 1);

// Offset calculation:
const offset = (page - 1) * pageSize;
```

#### 8.2.5 Database Connection Pooling

- Supabase automatycznie zarządza connection pool
- Używanie jednego client instance (`context.locals.supabase`)
- Brak potrzeby manual connection management

#### 8.2.6 Response Compression

- Astro automatycznie kompresuje odpowiedzi (gzip/brotli)
- Dla małych JSONów (~1-2KB) korzyść minimalna
- Dla list endpoint z dużą ilością danych (100 sesji × ~200B = 20KB) compression znacząco pomaga

### 8.3 Monitoring

Metryki do monitorowania:

#### 8.3.1 Performance Metrics

- **Czas odpowiedzi per endpoint** (p50, p95, p99):
  - GET list: target < 200ms (p95)
  - POST create: target < 150ms (p95)
  - GET detail: target < 250ms (p95) - więcej danych
  - PATCH/DELETE: target < 150ms (p95)
  - POST start: target < 500ms (p95) - trigger tworzy dużo rekordów
  - POST complete/abandon: target < 200ms (p95)

- **Database query time**:
  - List query: < 100ms (p95)
  - Detail query with sets: < 150ms (p95)
  - Start trigger execution: < 300ms (p95)

#### 8.3.2 Error Metrics

- Liczba błędów per endpoint per status code
- Error rate (errors / total requests)
- 500 errors powinny być < 0.1%

#### 8.3.3 Business Metrics

- Liczba sesji per user (średnia, median)
- Completion rate (completed / started sessions)
- Abandon rate (abandoned / started sessions)
- Average workout duration (completed_at - started_at)

#### 8.3.4 Resource Metrics

- Database connection count
- Memory usage
- CPU usage podczas spike traffic

### 8.4 Load Testing

Rekomendowane scenariusze testowe:

1. **Concurrent list requests**: 100 users jednocześnie listuje swoje sesje
2. **Bulk session creation**: User tworzy 50 sesji (schedule na przód)
3. **Start session stress test**: Test unique constraint - wielu users startuje sesje jednocześnie
4. **Detail endpoint with large sets**: Session z 50+ sets (duży plan treningowy)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie funkcji pomocniczych API

**Plik:** `src/lib/api-helpers.ts`

**Działanie:**

- Dodanie custom error classes: `NotFoundError`, `ConflictError`, `UnprocessableEntityError`, `BadRequestError`
- Dodanie helper function `parsePaginationParams()` dla standaryzacji paginacji
- Dodanie helper function `parseIntParam()` dla bezpiecznego parsowania ID z path params
- Rozszerzenie `logApiError()` o różne poziomy logowania (error, warn, info)

**Przykład implementacji:**

```typescript
// Custom error classes
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends Error {
  constructor(
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "UnprocessableEntityError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

// Pagination helper
export function parsePaginationParams(params: URLSearchParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const DEFAULT_PAGE_SIZE = 20;
  const MAX_PAGE_SIZE = 100;

  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);
  const requestedSize = parseInt(params.get("page_size") || String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = Math.min(Math.max(requestedSize, 1), MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

// Parse integer path parameter
export function parseIntParam(value: string | undefined, paramName: string): number {
  if (!value) {
    throw new BadRequestError(`Missing required parameter: ${paramName}`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new BadRequestError(`Invalid ${paramName}: must be a positive integer`);
  }
  return parsed;
}
```

### Krok 2: Implementacja warstwy walidacji

**Plik:** `src/lib/validation/workout-session.validation.ts`

**Działanie:**

- Definicja schematów Zod dla wszystkich command models i query params
- `sessionCreateSchema` - walidacja POST create payload
- `sessionUpdateSchema` - walidacja PATCH update payload (partial)
- `sessionQuerySchema` - walidacja query parameters dla GET list
- Export typów inference z Zod dla type safety

**Przykład implementacji:**

```typescript
import { z } from "zod";
import type { WorkoutSessionStatus } from "../../types";

// Zod enum for status
const workoutSessionStatusEnum = z.enum(["scheduled", "in_progress", "completed", "abandoned"]);

// ISO Date string validation (YYYY-MM-DD)
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Invalid date format. Expected ISO-8601 date string (YYYY-MM-DD)",
});

// Create command schema
export const sessionCreateSchema = z.object({
  workout_plan_id: z.number().int().positive({
    message: "workout_plan_id must be a positive integer",
  }),
  scheduled_for: isoDateString,
  notes: z.string().max(2000).optional(),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;

// Update command schema (partial)
export const sessionUpdateSchema = z
  .object({
    status: workoutSessionStatusEnum.optional(),
    scheduled_for: isoDateString.optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;

// Query parameters schema
export const sessionQuerySchema = z.object({
  status: workoutSessionStatusEnum.optional(),
  from: isoDateString.optional(),
  to: isoDateString.optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
});

export type SessionQueryInput = z.infer<typeof sessionQuerySchema>;
```

### Krok 3: Implementacja serwisu WorkoutSessionService

**Plik:** `src/lib/services/workout-session.service.ts`

**Działanie:**

Implementacja wszystkich metod service layer:

1. **`listSessions(userId, queryParams)`**
   - Query z filtrami (status, date range) i paginacją
   - Zwraca paginated response

2. **`createSession(userId, command)`**
   - Walidacja workout_plan_id należy do użytkownika
   - INSERT nowej sesji ze statusem 'scheduled'

3. **`getSessionById(sessionId, userId)`**
   - SELECT sesji z embedded sets
   - Rzuca NotFoundError jeśli brak

4. **`updateSession(sessionId, userId, command)`**
   - Partial UPDATE dozwolonych pól
   - Walidacja ownership

5. **`deleteSession(sessionId, userId)`**
   - Sprawdzenie status = 'scheduled'
   - Rzuca UnprocessableEntityError jeśli already started

6. **`startSession(sessionId, userId)`**
   - Walidacja status = 'scheduled'
   - UPDATE status → 'in_progress', started_at → NOW()
   - Trigger automatycznie tworzy sets
   - Zwraca session z sets

7. **`completeSession(sessionId, userId)`**
   - Walidacja status = 'in_progress'
   - Sprawdzenie czy wszystkie sets completed/skipped
   - UPDATE status → 'completed'

8. **`abandonSession(sessionId, userId)`**
   - Walidacja status = 'in_progress'
   - UPDATE status → 'abandoned'

**Przykładowa struktura:**

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type {
  WorkoutSessionDTO,
  WorkoutSessionDetailDTO,
  WorkoutSessionCreateCommand,
  WorkoutSessionUpdateCommand,
  WorkoutSessionsQueryParams,
  PaginatedResponse,
} from "../../types";
import { NotFoundError, ConflictError, UnprocessableEntityError, BadRequestError } from "../api-helpers";

export class WorkoutSessionService {
  constructor(private supabase: SupabaseClient) {}

  async listSessions(
    userId: string,
    params: WorkoutSessionsQueryParams
  ): Promise<PaginatedResponse<WorkoutSessionDTO>> {
    // Implementation: query with filters, pagination, count
  }

  async createSession(userId: string, command: WorkoutSessionCreateCommand): Promise<WorkoutSessionDTO> {
    // 1. Validate workout_plan_id belongs to user
    // 2. INSERT session
    // 3. Return mapped DTO
  }

  async getSessionById(sessionId: number, userId: string): Promise<WorkoutSessionDetailDTO> {
    // Query with embedded sets, throw NotFoundError if not exists or wrong user
  }

  async updateSession(
    sessionId: number,
    userId: string,
    command: WorkoutSessionUpdateCommand
  ): Promise<WorkoutSessionDTO> {
    // UPDATE with ownership check
  }

  async deleteSession(sessionId: number, userId: string): Promise<void> {
    // 1. Check session exists and belongs to user
    // 2. Check status = 'scheduled'
    // 3. DELETE
  }

  async startSession(sessionId: number, userId: string): Promise<WorkoutSessionDetailDTO> {
    // 1. Validate status = 'scheduled'
    // 2. UPDATE to 'in_progress'
    // 3. Return with sets (created by trigger)
  }

  async completeSession(sessionId: number, userId: string): Promise<WorkoutSessionDTO> {
    // 1. Validate status = 'in_progress'
    // 2. Check all sets done
    // 3. UPDATE to 'completed'
  }

  async abandonSession(sessionId: number, userId: string): Promise<WorkoutSessionDTO> {
    // 1. Validate status = 'in_progress'
    // 2. UPDATE to 'abandoned'
  }

  // Private helper methods
  private async validateWorkoutPlanOwnership(planId: number, userId: string): Promise<void> {
    // Check workout_plan exists and belongs to user
  }

  private mapToDTO(row: any): WorkoutSessionDTO {
    // Map DB row to DTO
  }

  private mapToDetailDTO(sessionRow: any, sets: any[]): WorkoutSessionDetailDTO {
    // Map session + sets to DetailDTO
  }
}
```

### Krok 4: Implementacja endpointu GET /api/v1/workout-sessions (lista)

**Plik:** `src/pages/api/v1/workout-sessions/index.ts`

**Działanie:**

- Handler GET z `export const prerender = false`
- Auth guard
- Parse i walidacja query params przez Zod
- Wywołanie `WorkoutSessionService.listSessions()`
- Zwrot paginated response
- Try-catch z logowaniem błędów

**Przykładowa struktura:**

```typescript
import type { APIContext } from "astro";
import { WorkoutSessionService } from "../../../../lib/services/workout-session.service";
import { sessionQuerySchema } from "../../../../lib/validation/workout-session.validation";
import {
  checkAuth,
  jsonResponse,
  errorResponse,
  handleZodError,
  parsePaginationParams,
  logApiError,
} from "../../../../lib/api-helpers";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    // Auth check
    const userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse query params
    const params = context.url.searchParams;
    const { page, pageSize, offset } = parsePaginationParams(params);

    // Build query params object
    const queryParams = {
      status: params.get("status") || undefined,
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      page,
      page_size: pageSize,
      sort: params.get("sort") || undefined,
    };

    // Validate with Zod
    const validationResult = sessionQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Call service
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.listSessions(userId, validationResult.data);

    return jsonResponse(result, 200);
  } catch (error) {
    logApiError("GET /api/v1/workout-sessions", userId, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
}
```

### Krok 5: Implementacja endpointu POST /api/v1/workout-sessions (create)

**Rozszerzenie:** `src/pages/api/v1/workout-sessions/index.ts`

**Działanie:**

- Handler POST
- Auth guard
- Parse request body
- Walidacja przez `sessionCreateSchema`
- Wywołanie `WorkoutSessionService.createSession()`
- Obsługa błędów: ZodError, NotFoundError (plan)
- Zwrot 201 z created session

### Krok 6: Implementacja endpointu GET /api/v1/workout-sessions/:id (detail)

**Plik:** `src/pages/api/v1/workout-sessions/[id].ts`

**Działanie:**

- Handler GET
- Auth guard
- Parse `id` z path params przez `parseIntParam()`
- Wywołanie `WorkoutSessionService.getSessionById()`
- Obsługa NotFoundError → 404
- Zwrot 200 z `WorkoutSessionDetailDTO`

### Krok 7: Implementacja endpointu PATCH /api/v1/workout-sessions/:id (update)

**Rozszerzenie:** `src/pages/api/v1/workout-sessions/[id].ts`

**Działanie:**

- Handler PATCH
- Auth guard
- Parse `id` z path params
- Parse request body
- Sprawdzenie czy body nie jest pusty
- Walidacja przez `sessionUpdateSchema`
- Wywołanie `WorkoutSessionService.updateSession()`
- Obsługa NotFoundError → 404, BadRequestError → 400
- Zwrot 200 z updated session

### Krok 8: Implementacja endpointu DELETE /api/v1/workout-sessions/:id

**Rozszerzenie:** `src/pages/api/v1/workout-sessions/[id].ts`

**Działanie:**

- Handler DELETE
- Auth guard
- Parse `id` z path params
- Wywołanie `WorkoutSessionService.deleteSession()`
- Obsługa NotFoundError → 404, UnprocessableEntityError → 422
- Zwrot 204 No Content

### Krok 9: Implementacja workflow endpoint POST /api/v1/workout-sessions/:id/start

**Plik:** `src/pages/api/v1/workout-sessions/[id]/start.ts`

**Działanie:**

- Handler POST
- Auth guard
- Parse `id` z path params
- Wywołanie `WorkoutSessionService.startSession()`
- Obsługa błędów:
  - NotFoundError → 404
  - BadRequestError (invalid status) → 400
  - ConflictError (duplicate in_progress) → 409
- Zwrot 200 z `WorkoutSessionDetailDTO` (session + sets)

### Krok 10: Implementacja workflow endpoint POST /api/v1/workout-sessions/:id/complete

**Plik:** `src/pages/api/v1/workout-sessions/[id]/complete.ts`

**Działanie:**

- Handler POST
- Auth guard
- Parse `id` z path params
- Wywołanie `WorkoutSessionService.completeSession()`
- Obsługa błędów:
  - NotFoundError → 404
  - BadRequestError (invalid status) → 400
  - UnprocessableEntityError (pending sets) → 422
- Zwrot 200 z updated session

### Krok 11: Implementacja workflow endpoint POST /api/v1/workout-sessions/:id/abandon

**Plik:** `src/pages/api/v1/workout-sessions/[id]/abandon.ts`

**Działanie:**

- Handler POST
- Auth guard
- Parse `id` z path params
- Wywołanie `WorkoutSessionService.abandonSession()`
- Obsługa błędów:
  - NotFoundError → 404
  - BadRequestError (invalid status) → 400
- Zwrot 200 z updated session

---

## 10. Dodatkowe uwagi implementacyjne

### 10.1 Supabase Query Best Practices

**Używaj type-safe queries:**

```typescript
// Good: Type-safe with proper error handling
const { data, error } = await supabase
  .from("workout_sessions")
  .select("*")
  .eq("id", sessionId)
  .eq("user_id", userId)
  .single();

if (error) {
  if (error.code === "PGRST116") {
    throw new NotFoundError("Workout session not found");
  }
  throw error;
}

return data;
```

**Embedded selects dla relationships:**

```typescript
// Query session with sets in single roundtrip
const { data, error } = await supabase
  .from("workout_sessions")
  .select(
    `
    *,
    sets:session_sets(
      id,
      plan_exercise_id,
      set_number,
      target_reps,
      actual_reps,
      weight_kg,
      status,
      completed_at,
      notes,
      created_at,
      updated_at
    )
  `
  )
  .eq("id", sessionId)
  .eq("user_id", userId)
  .order("set_number", { foreignTable: "session_sets", ascending: true })
  .single();
```

### 10.2 Status Transition Matrix

Dozwolone przejścia:

```
scheduled → in_progress (via start)
in_progress → completed (via complete)
in_progress → abandoned (via abandon)
```

Niedozwolone przejścia (rzucają BadRequestError):

```
scheduled → completed (must start first)
scheduled → abandoned (use delete instead)
in_progress → scheduled (cannot go back)
completed → * (terminal state)
abandoned → * (terminal state)
```

### 10.3 Trigger Dependencies

Workflow endpoints zależą od database triggers:

1. **`validate_workout_session_status_change` trigger:**
   - Auto-sets `started_at` when status → 'in_progress'
   - Auto-sets `completed_at` when status → 'completed' or 'abandoned'
   - Endpoint może polegać na tym że timestamps są ustawione

2. **`create_session_sets_for_workout` trigger:**
   - Auto-creates session_sets when status: scheduled → in_progress
   - Creates sets based on plan_exercises (order_index, target_sets, target_reps)
   - Start endpoint MUSI zwrócić te sets w response

3. **`update_updated_at_column` trigger:**
   - Auto-updates `updated_at` na każdy UPDATE
   - Endpoint nie musi explicitly ustawiać tego pola

### 10.4 Concurrent Start Protection

Unique constraint `idx_workout_sessions_user_in_progress` zapewnia że:

- Tylko jedna sesja może być `in_progress` dla danego użytkownika
- Concurrent start requests będą failować z PostgreSQL unique violation
- Service musi catchować ten błąd i rzucać `ConflictError`:

```typescript
try {
  await supabase.from("workout_sessions").update({ status: "in_progress" }).eq("id", sessionId);
} catch (error) {
  // Check if error is unique constraint violation
  if (error.code === "23505") {
    // PostgreSQL unique_violation
    throw new ConflictError(
      "User already has a workout session in progress. Complete or abandon the current session first."
    );
  }
  throw error;
}
```

### 10.5 Date Handling

- **Frontend → API**: ISO-8601 date strings (YYYY-MM-DD)
- **API → Database**: PostgreSQL DATE type
- **Database → API**: ISO-8601 date strings
- **Timestamps**: TIMESTAMP WITH TIME ZONE → ISO-8601 with timezone

```typescript
// Walidacja date string
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// PostgreSQL automatycznie parsuje "YYYY-MM-DD" do DATE type
// Supabase client automatycznie konwertuje z powrotem do ISO string
```

### 10.6 Paginacja - Last Page Calculation

```typescript
const lastPage = Math.ceil(total / pageSize);

// Example:
// total = 45, pageSize = 20
// lastPage = Math.ceil(45 / 20) = 3

// Edge case: total = 0
// lastPage = Math.ceil(0 / 20) = 0 (but we return 1 for consistency)
const lastPage = total === 0 ? 1 : Math.ceil(total / pageSize);
```

### 10.7 Error Response Consistency

Wszystkie endpoints powinny używać tych samych helper functions:

```typescript
// Success
return jsonResponse(data, statusCode);

// Error
return errorResponse(errorName, message, statusCode, details?);

// Zod validation error
return handleZodError(zodError);
```

Nazwy błędów powinny być consistent:

- `"Unauthorized"` - 401
- `"Bad Request"` - 400
- `"Validation Error"` - 400 (z details)
- `"Not Found"` - 404
- `"Conflict"` - 409
- `"Unprocessable Entity"` - 422
- `"Internal Server Error"` - 500

---
