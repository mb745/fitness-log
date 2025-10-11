# API Endpoint Implementation Plan: Session Sets Management

## 1. Przegląd punktu końcowego

Endpoint `/api/v1/session-sets/:id` zarządza pojedynczymi seriami treningowymi w ramach aktywnej sesji treningowej. Serie treningowe (`session_sets`) to atomowe jednostki wykonania ćwiczenia - każda reprezentuje jeden zestaw powtórzeń konkretnego ćwiczenia z określonym ciężarem.

Endpoint obsługuje jedną operację:

- **PATCH /api/v1/session-sets/:id**: Aktualizacja wykonania serii - rejestrowanie faktycznych powtórzeń, użytego ciężaru oraz zmiany statusu (pending → completed/skipped)

**Kluczowe ograniczenie biznesowe:** Aktualizacja serii możliwa jest **wyłącznie** gdy rodzicielska sesja treningowa ma status `in_progress`. To zapobiega modyfikacji historycznych danych treningowych po zakończeniu sesji.

## 2. Szczegóły żądania

### 2.1 PATCH /api/v1/session-sets/:id

**Metoda HTTP:** PATCH  
**Struktura URL:** `/api/v1/session-sets/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Path Parameters:**

- **Wymagane:**
  - `id` (integer): Identyfikator serii treningowej

**Request Body Parameters:**

- **Wymagane:** Co najmniej jedno pole do aktualizacji
- **Opcjonalne:**
  - `actual_reps` (integer): Faktyczna liczba wykonanych powtórzeń (≥ 0)
  - `weight_kg` (number): Użyty ciężar w kilogramach (≥ 0, max 9999.99)
  - `status` (string): Status wykonania serii
    - Możliwe wartości: `pending`, `completed`, `skipped`
    - Dozwolone przejścia: `pending → completed`, `pending → skipped`
    - Przejścia zabronione: jakiekolwiek inne (np. `completed → pending`, `skipped → completed`)

**Reguły walidacji:**

1. Gdy `status = "completed"`:
   - `actual_reps` MUSI być podane (w tym samym request lub już istnieć w bazie)
   - `completed_at` zostanie automatycznie ustawione przez bazę danych
2. Gdy `status = "skipped"`:
   - `actual_reps` i `weight_kg` są opcjonalne (zwykle puste)
3. Rodzicielska `workout_session` MUSI mieć status `in_progress`

**Request Body Examples:**

Rejestrowanie wykonanej serii:

```json
{
  "actual_reps": 12,
  "weight_kg": 60.5,
  "status": "completed"
}
```

Aktualizacja tylko ciężaru (seria nadal pending):

```json
{
  "weight_kg": 65.0
}
```

Pominięcie serii:

```json
{
  "status": "skipped"
}
```

Częściowe wykonanie serii (np. kontuzja):

```json
{
  "actual_reps": 5,
  "status": "skipped"
}
```

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

### DTOs (Data Transfer Objects)

```typescript
type SessionSetRow = DbTables<"session_sets">;
export type SessionSetDTO = Omit<SessionSetRow, "status"> & {
  status: SessionSetStatus;
};
```

Pełna struktura `SessionSetDTO`:

```typescript
{
  id: number;
  workout_session_id: number;
  plan_exercise_id: number;
  set_number: number;
  target_reps: number;
  actual_reps: number | null;
  weight_kg: string | null; // DECIMAL(6,2) w DB
  status: SessionSetStatus; // narrowed enum
  completed_at: string | null; // ISO-8601 timestamp
  notes: string | null;
  created_at: string; // ISO-8601 timestamp
  updated_at: string; // ISO-8601 timestamp
}
```

### Command Models

```typescript
export type SessionSetUpdateCommand = Partial<
  Pick<DbUpdate<"session_sets">, "actual_reps" | "weight_kg" | "status">
> & {
  status?: SessionSetStatus;
};
```

### Domain Enums

```typescript
export type SessionSetStatus = "pending" | "completed" | "skipped";
```

### Pomocnicze typy

```typescript
export type WorkoutSessionStatus = "scheduled" | "in_progress" | "completed" | "abandoned";
```

## 4. Szczegóły odpowiedzi

### 4.1 PATCH /api/v1/session-sets/:id

**Sukces (200 OK):**

```json
{
  "id": 42,
  "workout_session_id": 15,
  "plan_exercise_id": 8,
  "set_number": 2,
  "target_reps": 10,
  "actual_reps": 12,
  "weight_kg": "60.50",
  "status": "completed",
  "completed_at": "2025-01-20T14:35:22.000Z",
  "notes": null,
  "created_at": "2025-01-20T14:30:00.000Z",
  "updated_at": "2025-01-20T14:35:22.000Z"
}
```

**Błąd - Brak autentykacji (401 Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Błąd - Nieprawidłowe dane wejściowe (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "actual_reps",
      "message": "Actual reps must be greater than or equal to 0"
    }
  ]
}
```

**Błąd - Nieprawidłowe przejście statusu (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid status transition",
  "details": [
    {
      "field": "status",
      "message": "Cannot transition from 'completed' to 'pending'. Only 'pending → completed' or 'pending → skipped' transitions are allowed."
    }
  ]
}
```

**Błąd - Brak actual_reps przy completed (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "actual_reps",
      "message": "Actual reps are required when status is 'completed'"
    }
  ]
}
```

**Błąd - Sesja nie w statusie in_progress (403 Forbidden):**

```json
{
  "error": "Forbidden",
  "message": "Session sets can only be updated when the workout session is in progress"
}
```

**Błąd - Seria nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Session set not found"
}
```

**Błąd - Brak dostępu do serii (403 Forbidden):**

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to update this session set"
}
```

## 5. Przepływ danych

### 5.1 PATCH /api/v1/session-sets/:id

```
1. Request → Astro API Endpoint (/api/v1/session-sets/[id].ts)
2. Sprawdzenie autentykacji (context.locals.user)
3. Parsowanie i walidacja path parameter (id)
4. Parsowanie Request Body
5. Walidacja Request Body przez Zod Schema (sessionSetUpdateSchema)
   a. Walidacja typów i zakresów wartości
   b. Walidacja business rules (actual_reps przy completed)
6. Wywołanie SessionSetService.getSessionSet(id, userId)
   - Pobranie serii z bazy
   - Sprawdzenie właściciela (przez workout_session.user_id)
   - Zwrócenie 404 jeśli nie istnieje
   - Zwrócenie 403 jeśli należy do innego użytkownika
7. Walidacja statusu rodzicielskiej sesji
   - Pobranie workout_session.status
   - Sprawdzenie czy status === 'in_progress'
   - Zwrócenie 403 jeśli sesja nie jest in_progress
8. Walidacja przejścia statusu
   - Sprawdzenie current status vs. requested status
   - Weryfikacja czy przejście jest dozwolone
   - Zwrócenie 400 jeśli przejście zabronione
9. Wywołanie SessionSetService.updateSessionSet(id, userId, data)
   - UPDATE w Supabase session_sets table
   - Automatyczne ustawienie updated_at (trigger)
   - Automatyczne ustawienie completed_at jeśli status = completed (trigger lub explicit)
10. Mapowanie updated row → SessionSetDTO
11. Response (200) z SessionSetDTO
```

### Interakcje z zewnętrznymi usługami:

**Supabase:**

- Autentykacja użytkownika przez Supabase Auth
- Operacje na tabeli `session_sets`:
  - SELECT dla pobierania bieżącego stanu
  - JOIN z `workout_sessions` dla sprawdzenia właściciela i statusu
  - UPDATE dla zapisania zmian
- Wykorzystanie triggerów:
  - `update_updated_at_column` dla automatycznej aktualizacji `updated_at`
  - Potencjalny trigger dla `completed_at` (lub explicit SET w query)
- Check constraints:
  - `CHECK (status != 'completed' OR (actual_reps IS NOT NULL AND completed_at IS NOT NULL))`
  - `CHECK (actual_reps >= 0)`
  - `CHECK (weight_kg >= 0)`

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Wymagana autentykacja**: Endpoint wymaga zalogowanego użytkownika
- **Implementacja**: Sprawdzenie `context.locals.user` w middleware Astro
- **Kod błędu**: 401 Unauthorized gdy brak autentykacji

### 6.2 Autoryzacja

- **Izolacja danych**: Użytkownik może aktualizować tylko serie z własnych sesji treningowych
- **Implementacja dwuetapowa**:
  1. JOIN z `workout_sessions` w query SELECT dla weryfikacji `user_id`
  2. Walidacja w serwisie przed UPDATE
- **Ochrona**: Brak możliwości modyfikacji serii innych użytkowników przez manipulację ID
- **Kod błędu**: 403 Forbidden gdy seria należy do innego użytkownika

**Przykładowe query z autoryzacją:**

```typescript
const { data, error } = await supabase
  .from("session_sets")
  .select("*, workout_sessions!inner(user_id, status)")
  .eq("id", sessionSetId)
  .eq("workout_sessions.user_id", userId)
  .single();
```

### 6.3 Walidacja biznesowa statusu sesji

- **Reguła**: Aktualizacja możliwa tylko gdy `workout_sessions.status = 'in_progress'`
- **Cel**: Zapobieganie modyfikacji historycznych danych treningowych
- **Implementacja**: Sprawdzenie statusu przed UPDATE
- **Kod błędu**: 403 Forbidden gdy sesja nie jest `in_progress`

### 6.4 Walidacja danych wejściowych

- **Schemat Zod**: Walidacja wszystkich danych przed zapisem do bazy
- **Constrainty liczbowe**:
  - `actual_reps`: integer, ≥ 0 gdy podane
  - `weight_kg`: number, ≥ 0, max 9999.99 (DECIMAL(6,2))
- **Walidacja enum**: `status` musi być jednym z `SessionSetStatus` values
- **Business rules**:
  - `status = 'completed'` wymaga `actual_reps` (w request lub już w DB)
  - Dozwolone przejścia statusu: `pending → completed`, `pending → skipped`
- **Ochrona przed injection**: Supabase client automatycznie sanityzuje zapytania

### 6.5 Walidacja przejść statusu (State Machine)

**Dozwolone przejścia:**

```
pending → completed  ✓
pending → skipped    ✓
pending → pending    ✓ (no-op)
completed → completed ✓ (no-op, update other fields)
skipped → skipped     ✓ (no-op, update other fields)
```

**Zabronione przejścia:**

```
completed → pending  ✗
completed → skipped  ✗
skipped → pending    ✗
skipped → completed  ✗
```

**Implementacja:**

```typescript
// Pseudo-kod walidacji
if (currentStatus !== "pending" && newStatus !== currentStatus) {
  throw new ValidationError("Invalid status transition");
}
```

### 6.6 Sanityzacja danych

- **Numeryczne pola**: Konwersja i walidacja przez Zod
- **Ochrona przed XSS**: Brak pól tekstowych (poza notes, które są opcjonalne)
- **Precision control**: `weight_kg` ograniczone do 2 miejsc po przecinku

### 6.7 Race Conditions

**Potencjalny problem**: Równoczesna aktualizacja tej samej serii przez użytkownika (np. z dwóch urządzeń)

**Mitygacja:**

- Supabase używa PostgreSQL row-level locking podczas UPDATE
- Ostatnia aktualizacja wygrywa (last-write-wins)
- Frontend powinien wyświetlać `updated_at` i implementować optimistic updates z rollback

**Rekomendacja dla przyszłości**: Implementacja optimistic locking z `version` field lub ETags

### 6.8 Rate Limiting

- **Rekomendacja**: Implementacja rate limiting w middleware Astro
- **Limit**: np. 300 żądań/15 minut per użytkownik (wyższy niż standardowe endpointy, bo używane intensywnie podczas treningu)
- **Uwaga**: Użytkownik może aktualizować wiele serii podczas jednej sesji treningowej

### 6.9 CORS

- **Konfiguracja**: Ograniczenie dostępu tylko z dozwolonych domen
- **Implementacja**: Ustawienie odpowiednich nagłówków CORS w middleware
- **Uwaga**: Endpoint może być używany z aplikacji mobilnej - CORS nie jest problemem przy native apps

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Kod | Nazwa                 | Scenariusz                                                | Odpowiedź                      |
| --- | --------------------- | --------------------------------------------------------- | ------------------------------ |
| 200 | OK                    | Pomyślna aktualizacja serii                               | SessionSetDTO                  |
| 400 | Bad Request           | Nieprawidłowe dane (Zod), nieprawidłowy status transition | Error z details                |
| 401 | Unauthorized          | Brak autentykacji                                         | Error message                  |
| 403 | Forbidden             | Sesja nie in_progress lub brak dostępu do serii           | Error message                  |
| 404 | Not Found             | Seria nie istnieje                                        | Error message                  |
| 500 | Internal Server Error | Błąd bazy danych lub nieoczekiwany błąd                   | Error message (bez szczegółów) |

### 7.2 Szczegółowe scenariusze błędów

#### 401 Unauthorized

- **Trigger**: Brak `context.locals.user`
- **Response**:
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

#### 400 Bad Request - Walidacja Zod

**Scenariusz 1**: Nieprawidłowe wartości liczbowe

- **Trigger**: `actual_reps < 0` lub `weight_kg < 0`
- **Response**:
  ```json
  {
    "error": "Validation Error",
    "message": "Invalid input data",
    "details": [
      {
        "field": "actual_reps",
        "message": "Actual reps must be greater than or equal to 0"
      }
    ]
  }
  ```

**Scenariusz 2**: Nieprawidłowy enum status

- **Trigger**: `status` nie jest jednym z `pending | completed | skipped`
- **Response**:
  ```json
  {
    "error": "Validation Error",
    "message": "Invalid input data",
    "details": [
      {
        "field": "status",
        "message": "Invalid status. Must be one of: pending, completed, skipped"
      }
    ]
  }
  ```

**Scenariusz 3**: Brak actual_reps przy completed

- **Trigger**: `status = 'completed'` ale `actual_reps` nie podane i nie istnieje w DB
- **Response**:
  ```json
  {
    "error": "Validation Error",
    "message": "Invalid input data",
    "details": [
      {
        "field": "actual_reps",
        "message": "Actual reps are required when status is 'completed'"
      }
    ]
  }
  ```

**Scenariusz 4**: Nieprawidłowe przejście statusu

- **Trigger**: Próba przejścia `completed → pending` lub inne zabronione
- **Response**:
  ```json
  {
    "error": "Validation Error",
    "message": "Invalid status transition",
    "details": [
      {
        "field": "status",
        "message": "Cannot transition from 'completed' to 'pending'. Only 'pending → completed' or 'pending → skipped' transitions are allowed."
      }
    ]
  }
  ```

**Scenariusz 5**: Pusty request body

- **Trigger**: Brak żadnych pól do aktualizacji
- **Response**:
  ```json
  {
    "error": "Validation Error",
    "message": "At least one field must be provided for update"
  }
  ```

#### 403 Forbidden - Sesja nie in_progress

- **Trigger**: `workout_sessions.status !== 'in_progress'`
- **Logging**: Informacja o próbie aktualizacji (warning level)
- **Response**:
  ```json
  {
    "error": "Forbidden",
    "message": "Session sets can only be updated when the workout session is in progress"
  }
  ```

#### 403 Forbidden - Brak dostępu do serii

- **Trigger**: Seria należy do innego użytkownika (`workout_sessions.user_id !== user.id`)
- **Logging**: Próba nieautoryzowanego dostępu (warning level z user ID)
- **Response**:
  ```json
  {
    "error": "Forbidden",
    "message": "You do not have permission to update this session set"
  }
  ```

#### 404 Not Found

- **Trigger**: Seria o podanym ID nie istnieje
- **Response**:
  ```json
  {
    "error": "Not Found",
    "message": "Session set not found"
  }
  ```

#### 500 Internal Server Error

**Scenariusz 1**: Błąd bazy danych (constraint violation)

- **Trigger**: Naruszenie check constraint (teoretycznie niemożliwe po walidacji Zod)
- **Logging**: `console.error` z pełnym stack trace i query details
- **Response**:
  ```json
  {
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
  }
  ```

**Scenariusz 2**: Timeout połączenia z bazą

- **Trigger**: Supabase connection timeout
- **Logging**: Full error z context
- **Response**: Jak wyżej

### 7.3 Format odpowiedzi błędu

```typescript
interface ErrorResponse {
  error: string; // Nazwa błędu (np. "Validation Error")
  message: string; // Czytelny komunikat dla użytkownika
  details?: Array<{
    // Opcjonalne szczegóły (dla błędów walidacji)
    field: string; // Nazwa pola
    message: string; // Szczegółowy opis błędu
  }>;
}
```

### 7.4 Logowanie błędów

```typescript
// Błędy 500 - pełne logowanie
console.error("[SessionSetAPI] Unexpected error:", {
  endpoint: "PATCH /api/v1/session-sets/:id",
  sessionSetId: id,
  userId: user.id,
  error: error.message,
  stack: error.stack,
  context: { requestBody },
});

// Błędy 403 (unauthorized access) - security logging
console.warn("[SessionSetAPI] Unauthorized access attempt:", {
  endpoint: "PATCH /api/v1/session-sets/:id",
  sessionSetId: id,
  attemptedBy: user.id,
  actualOwner: sessionSet.workout_session.user_id,
});

// Błędy 403 (session not in_progress) - business rule violation
console.warn("[SessionSetAPI] Invalid session status:", {
  endpoint: "PATCH /api/v1/session-sets/:id",
  sessionSetId: id,
  userId: user.id,
  sessionStatus: session.status,
});

// Błędy 400 - podstawowe logowanie (opcjonalne)
console.debug("[SessionSetAPI] Validation error:", {
  endpoint: "PATCH /api/v1/session-sets/:id",
  sessionSetId: id,
  userId: user.id,
  errors: zodError.errors,
});
```

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **Baza danych - Query performance:**
   - Single row SELECT z JOIN do `workout_sessions`
   - PRIMARY KEY lookup jest bardzo szybki
   - JOIN dodaje overhead, ale oba indeksy (PK + FK) są zoptymalizowane
   - **Oczekiwany czas**: < 5ms

2. **Baza danych - UPDATE performance:**
   - Single row UPDATE z WHERE na PRIMARY KEY
   - Triggers: `update_updated_at_column` (minimal overhead)
   - Potencjalnie trigger dla `completed_at` (jeśli zaimplementowany)
   - **Oczekiwany czas**: < 10ms

3. **Autentykacja:**
   - Weryfikacja sessji Supabase na każde żądanie
   - **Mitygacja**: Session caching w middleware (już zaimplementowane w Astro)

4. **Walidacja:**
   - Zod validation jest synchroniczna i szybka
   - Custom validation logic (status transitions, completed rules)
   - **Overhead**: < 1ms

5. **Częstotliwość requestów:**
   - Podczas aktywnego treningu użytkownik może aktualizować serie co 30-120 sekund
   - Peak load: ~1-2 requesty/minutę per użytkownik
   - **Nie stanowi wąskiego gardła** przy normalnym użyciu

### 8.2 Strategie optymalizacji

#### 1. Indeksy bazy danych

**Istniejące indeksy:**

- PRIMARY KEY na `session_sets.id` ✓
- FOREIGN KEY index na `session_sets.workout_session_id` ✓

**Rekomendowane dodatkowe indeksy:**

```sql
-- Dla query sprawdzającego właściciela i status
CREATE INDEX idx_session_sets_workout_session_lookup
ON session_sets(id, workout_session_id);
```

**Uwaga**: Najprawdopodobniej nie będzie potrzebny, PK i FK wystarczą.

#### 2. Optymalizacja query

**Sprawdzenie właściciela i statusu w jednym query:**

```typescript
// ZAMIAST: Dwa oddzielne query (session set + workout session)
// LEPSZE: Jedno query z JOIN
const { data, error } = await supabase
  .from("session_sets")
  .select(
    `
    *,
    workout_sessions!inner(
      user_id,
      status
    )
  `
  )
  .eq("id", sessionSetId)
  .eq("workout_sessions.user_id", userId)
  .single();

// Teraz mamy session_set + owner validation + session status w jednym roundtrip
```

#### 3. Connection pooling

- Supabase automatycznie zarządza connection pool
- Używanie jednego client instance (`context.locals.supabase`)
- **Już zaimplementowane** w middleware Astro

#### 4. Response size optimization

- SessionSetDTO jest małym obiektem (~200-300 bytes)
- JSON serialization jest szybka
- Gzip compression przez Astro (automatyczne)
- **Nie wymaga optymalizacji**

#### 5. Optimistic Updates (client-side)

**Rekomendacja dla frontendu:**

```typescript
// Pseudo-kod React
const updateSet = async (setId, updates) => {
  // 1. Optimistic update (instant UI feedback)
  setLocalState((prev) => ({ ...prev, ...updates }));

  try {
    // 2. Send request to backend
    const result = await api.patchSessionSet(setId, updates);

    // 3. Confirm with server data
    setLocalState(result);
  } catch (error) {
    // 4. Rollback on error
    setLocalState(originalState);
    showError(error);
  }
};
```

**Korzyści:**

- Instant feedback dla użytkownika (zero perceived latency)
- Lepsza UX podczas treningu
- Sieć nie blokuje UI

#### 6. Debouncing weight_kg updates

**Problem**: Użytkownik może zmieniać ciężar wielokrotnie przed potwierdzeniem serii

**Rozwiązanie client-side**:

```typescript
// Debounce weight_kg updates (500ms), ale instant submit dla status
const debouncedWeightUpdate = debounce((setId, weight) => api.patchSessionSet(setId, { weight_kg: weight }), 500);
```

#### 7. Batch updates (potential future optimization)

**Obecny stan**: Każda seria aktualizowana osobnym PATCH request

**Potencjalna optymalizacja**:

```
POST /api/v1/session-sets/batch
Body: [
  { id: 1, actual_reps: 10, status: "completed" },
  { id: 2, actual_reps: 12, status: "completed" },
  ...
]
```

**Analiza**:

- Korzyść: Mniej HTTP roundtrips
- Koszt: Bardziej skomplikowana walidacja i error handling
- **Rekomendacja**: Implementować tylko jeśli profiling wykaże problem

### 8.3 Caching strategy

**Pytanie**: Czy cachować session sets?

**Odpowiedź**: **NIE**, z następujących powodów:

1. **Dane highly mutable**: Serie są aktualizowane w czasie rzeczywistym podczas treningu
2. **User-specific**: Cache per użytkownik byłoby nieefektywne
3. **Session duration**: Sesja trwa 30-90 minut, cache hit rate byłby niski
4. **Freshness requirement**: Użytkownik oczekuje natychmiastowych aktualizacji

**Alternative - Client-side state**:

- React Context/Zustand store dla aktywnej sesji
- Synchronizacja z backend po każdym update
- Invalidacja po zakończeniu sesji

### 8.4 Database connection management

**Best practices**:

```typescript
// ✓ DOBRZE: Używanie context.locals.supabase
const supabase = context.locals.supabase;

// ✗ ŹLE: Tworzenie nowego client instance
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, key); // creates new connection
```

### 8.5 Monitoring metryki

Metryki do monitorowania:

**Performance:**

- Czas odpowiedzi endpoint (p50, p95, p99)
  - Target: p95 < 100ms, p99 < 250ms
- Czas query do bazy danych
  - Target: średnio < 20ms

**Reliability:**

- Error rate per kod statusu (400, 403, 404, 500)
  - Target: 5xx < 0.1%
- Liczba 403 errors (session not in_progress)
  - Użyteczne dla UX improvements

**Usage:**

- Request rate per użytkownik
  - Dla calibration rate limiting
- Średnia liczba updates per session
  - Analiza user behavior

**Business:**

- Completion rate (ile serii completed vs skipped)
- Średni actual_reps vs target_reps

### 8.6 Load testing scenarios

**Scenario 1: Single user workout**

- 1 użytkownik
- 1 sesja (8 ćwiczeń × 3 serie = 24 session sets)
- Aktualizacja każdej serii: 2 requesty (weight_kg, potem completed)
- Total: ~48 requestów w 60 minut = 0.8 req/min
- **Result**: Żaden problem

**Scenario 2: Peak load (gym rush hour)**

- 100 równoczesnych użytkowników
- Każdy wykonuje trening (jak wyżej)
- Average: 80 req/min across all users
- Peak: ~200 req/min (podczas superset'ów)
- **Result**: Bardzo niski load, PostgreSQL + Supabase handle easily

**Scenario 3: Stress test**

- 1000 równoczesnych użytkowników
- Peak: 2000 req/min = ~33 req/s
- **Result**: Nadal w granicach Supabase free tier (nie testowane, ale prawdopodobnie OK)

**Conclusion**: Performance nie jest problemem dla tego endpointu przy przewidywalnym użyciu fitness app.

## 9. Etapy wdrożenia

### Krok 1: Implementacja warstwy walidacji

**Plik:** `src/lib/validation/session-set.validation.ts`

**Zadania:**

1. Import zależności:

   ```typescript
   import { z } from "zod";
   import type { SessionSetStatus } from "@/types";
   ```

2. Definicja schematu podstawowego:

   ```typescript
   export const sessionSetUpdateSchema = z
     .object({
       actual_reps: z.number().int().min(0).optional(),
       weight_kg: z.number().min(0).max(9999.99).optional(),
       status: z.enum(["pending", "completed", "skipped"]).optional(),
     })
     .strict() // Odrzuca dodatkowe pola
     .refine((data) => Object.keys(data).length > 0, {
       message: "At least one field must be provided for update",
     });
   ```

3. Dodanie custom validation dla business rules:

   ```typescript
   // Helper do walidacji completed status
   export const validateCompletedStatus = (
     data: z.infer<typeof sessionSetUpdateSchema>,
     currentActualReps: number | null
   ): { valid: boolean; error?: string } => {
     if (data.status === "completed") {
       const hasActualReps = data.actual_reps !== undefined || currentActualReps !== null;
       if (!hasActualReps) {
         return {
           valid: false,
           error: "Actual reps are required when status is 'completed'",
         };
       }
     }
     return { valid: true };
   };

   // Helper do walidacji status transitions
   export const validateStatusTransition = (
     currentStatus: SessionSetStatus,
     newStatus?: SessionSetStatus
   ): { valid: boolean; error?: string } => {
     if (!newStatus || newStatus === currentStatus) {
       return { valid: true }; // No transition or no-op
     }

     // Dozwolone przejścia: pending → completed/skipped
     if (currentStatus === "pending") {
       if (newStatus === "completed" || newStatus === "skipped") {
         return { valid: true };
       }
     }

     // Wszystkie inne przejścia zabronione
     return {
       valid: false,
       error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Only 'pending → completed' or 'pending → skipped' transitions are allowed.`,
     };
   };
   ```

4. Export typów inference:
   ```typescript
   export type SessionSetUpdateInput = z.infer<typeof sessionSetUpdateSchema>;
   ```

### Krok 2: Implementacja serwisu SessionSetService

**Plik:** `src/lib/services/session-set.service.ts`

**Zadania:**

1. Import zależności:

   ```typescript
   import type { SupabaseClient } from "@/db/supabase.client";
   import type { SessionSetDTO, SessionSetUpdateCommand, UUID } from "@/types";
   ```

2. Definicja interfejsu rozszerzonego (z danymi sesji):

   ```typescript
   interface SessionSetWithSession extends SessionSetDTO {
     workout_session: {
       user_id: UUID;
       status: string;
     };
   }
   ```

3. Metoda `getSessionSetWithSession()`:

   ```typescript
   export async function getSessionSetWithSession(
     supabase: SupabaseClient,
     sessionSetId: number,
     userId: UUID
   ): Promise<SessionSetWithSession> {
     const { data, error } = await supabase
       .from("session_sets")
       .select(
         `
         *,
         workout_sessions!inner(
           user_id,
           status
         )
       `
       )
       .eq("id", sessionSetId)
       .eq("workout_sessions.user_id", userId)
       .single();

     if (error) {
       if (error.code === "PGRST116") {
         throw new Error("NOT_FOUND");
       }
       throw error;
     }

     if (!data) {
       throw new Error("NOT_FOUND");
     }

     return data as SessionSetWithSession;
   }
   ```

4. Metoda `updateSessionSet()`:

   ```typescript
   export async function updateSessionSet(
     supabase: SupabaseClient,
     sessionSetId: number,
     userId: UUID,
     updates: SessionSetUpdateCommand
   ): Promise<SessionSetDTO> {
     // Prepare update payload
     const updatePayload: Record<string, unknown> = { ...updates };

     // Auto-set completed_at when status changes to completed
     if (updates.status === "completed") {
       updatePayload.completed_at = new Date().toISOString();
     }

     const { data, error } = await supabase
       .from("session_sets")
       .update(updatePayload)
       .eq("id", sessionSetId)
       // Extra security: ensure user owns the session
       .eq("workout_session_id" /* we need session_id here */)
       .select()
       .single();

     if (error) {
       throw error;
     }

     if (!data) {
       throw new Error("NOT_FOUND");
     }

     return data as SessionSetDTO;
   }
   ```

   **Uwaga**: Powyższa metoda wymaga refactor - potrzebujemy `workout_session_id` dla dodatkowego security check. Alternative: wykonać UPDATE bez dodatkowego WHERE i polegać na wcześniejszym sprawdzeniu w getSessionSetWithSession.

5. Simplified metoda `updateSessionSet()`:

   ```typescript
   export async function updateSessionSet(
     supabase: SupabaseClient,
     sessionSetId: number,
     updates: SessionSetUpdateCommand
   ): Promise<SessionSetDTO> {
     const updatePayload: Record<string, unknown> = { ...updates };

     // Auto-set completed_at when status changes to completed
     if (updates.status === "completed") {
       updatePayload.completed_at = new Date().toISOString();
     }

     const { data, error } = await supabase
       .from("session_sets")
       .update(updatePayload)
       .eq("id", sessionSetId)
       .select()
       .single();

     if (error) {
       throw error;
     }

     if (!data) {
       throw new Error("NOT_FOUND");
     }

     return data as SessionSetDTO;
   }
   ```

### Krok 3: Wykorzystanie istniejących funkcji pomocniczych API

**Plik:** `src/lib/api-helpers.ts` (już istnieje)

**Wykorzystywane funkcje** (zakładając, że już są zaimplementowane):

- `checkAuth()` - weryfikacja autentykacji
- `handleZodError()` - formatowanie błędów walidacji
- `jsonResponse()` - standaryzacja odpowiedzi JSON
- `errorResponse()` - standaryzacja odpowiedzi błędów

**Jeśli nie istnieją**, dodać następujące funkcje:

```typescript
// Check authentication
export function checkAuth(context: APIContext) {
  const user = context.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return null; // Auth OK
}

// Handle Zod errors
export function handleZodError(error: z.ZodError) {
  return new Response(
    JSON.stringify({
      error: "Validation Error",
      message: "Invalid input data",
      details: error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// JSON response helper
export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Error response helper
export function errorResponse(
  error: string,
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>
) {
  return new Response(JSON.stringify({ error, message, details }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Krok 4: Utworzenie struktury pliku endpointu

**Plik:** `src/pages/api/v1/session-sets/[id].ts`

**Struktura katalogów:**

```
src/pages/api/v1/
  session-sets/
    [id].ts          ← Nowy plik
```

**Uwaga**: Endpoint używa dynamic route parameter `[id]`

### Krok 5: Implementacja endpointu PATCH

**Plik:** `src/pages/api/v1/session-sets/[id].ts`

**Full implementation:**

```typescript
import type { APIContext } from "astro";
import { z } from "zod";
import {
  sessionSetUpdateSchema,
  validateCompletedStatus,
  validateStatusTransition,
} from "@/lib/validation/session-set.validation";
import { getSessionSetWithSession, updateSessionSet } from "@/lib/services/session-set.service";
import { checkAuth, handleZodError, jsonResponse, errorResponse } from "@/lib/api-helpers";

export const prerender = false;

export async function PATCH(context: APIContext) {
  // 1. Check authentication
  const authError = checkAuth(context);
  if (authError) return authError;

  const user = context.locals.user!;
  const supabase = context.locals.supabase;

  try {
    // 2. Parse and validate path parameter
    const sessionSetId = parseInt(context.params.id || "", 10);
    if (isNaN(sessionSetId) || sessionSetId <= 0) {
      return errorResponse("Bad Request", "Invalid session set ID", 400);
    }

    // 3. Parse request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch (e) {
      return errorResponse("Bad Request", "Invalid JSON in request body", 400);
    }

    // 4. Validate request body with Zod
    const validation = sessionSetUpdateSchema.safeParse(requestBody);
    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const updates = validation.data;

    // 5. Get session set with parent session details
    let sessionSet;
    try {
      sessionSet = await getSessionSetWithSession(supabase, sessionSetId, user.id);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        return errorResponse("Not Found", "Session set not found", 404);
      }
      throw error; // Re-throw for 500 handler
    }

    // 6. Validate parent session status
    if (sessionSet.workout_session.status !== "in_progress") {
      console.warn("[SessionSetAPI] Session not in progress:", {
        endpoint: "PATCH /api/v1/session-sets/:id",
        sessionSetId,
        userId: user.id,
        sessionStatus: sessionSet.workout_session.status,
      });

      return errorResponse(
        "Forbidden",
        "Session sets can only be updated when the workout session is in progress",
        403
      );
    }

    // 7. Validate status transition
    if (updates.status) {
      const transitionValidation = validateStatusTransition(sessionSet.status, updates.status);

      if (!transitionValidation.valid) {
        return errorResponse("Validation Error", "Invalid status transition", 400, [
          {
            field: "status",
            message: transitionValidation.error!,
          },
        ]);
      }
    }

    // 8. Validate completed status business rule
    const completedValidation = validateCompletedStatus(updates, sessionSet.actual_reps);

    if (!completedValidation.valid) {
      return errorResponse("Validation Error", "Invalid input data", 400, [
        {
          field: "actual_reps",
          message: completedValidation.error!,
        },
      ]);
    }

    // 9. Update session set
    const updatedSessionSet = await updateSessionSet(supabase, sessionSetId, updates);

    // 10. Return success response
    return jsonResponse(updatedSessionSet, 200);
  } catch (error: unknown) {
    // 500 error handler
    console.error("[SessionSetAPI] Unexpected error:", {
      endpoint: "PATCH /api/v1/session-sets/:id",
      sessionSetId: context.params.id,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
}
```
