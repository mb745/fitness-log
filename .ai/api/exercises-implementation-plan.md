# API Endpoint Implementation Plan: Exercises Management

## 1. Przegląd punktu końcowego

Endpoint `/api/v1/exercises` zarządza globalną biblioteką ćwiczeń dostępną dla wszystkich użytkowników aplikacji fitness log. Biblioteka jest zarządzana centralnie i zawiera szczegółowe informacje o ćwiczeniach, w tym grupy mięśniowe, typ ćwiczenia, zalecane zakresy powtórzeń oraz instrukcje wykonania.

Endpoint obsługuje dwie operacje read-only:

- **GET /api/v1/exercises**: Pobieranie listy ćwiczeń z zaawansowanym wyszukiwaniem, filtrowaniem, paginacją i sortowaniem
- **GET /api/v1/exercises/:id**: Pobieranie szczegółowych informacji o konkretnym ćwiczeniu

Ćwiczenia są zasobem tylko do odczytu - nie ma możliwości tworzenia, aktualizacji ani usuwania ćwiczeń przez API użytkownika (zarządzanie odbywa się centralnie przez administratorów systemu).

## 2. Szczegóły żądania

### 2.1 GET /api/v1/exercises

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/exercises`  
**Autentykacja:** Opcjonalna (endpoint publiczny dla biblioteki ćwiczeń)  
**Content-Type:** N/A (GET request)

**Parametry Query String:**

- **Wymagane:** Brak (wszystkie parametry opcjonalne)
- **Opcjonalne:**
  - `q` (string): Wyszukiwanie pełnotekstowe po nazwie ćwiczenia (używa trigram index)
  - `muscle_group_id` (integer): Filtr po głównej grupie mięśniowej (FK do muscle_groups)
  - `muscle_subgroup_id` (integer): Filtr po podgrupie mięśniowej (FK do muscle_subgroups)
  - `type` (string): Filtr po typie ćwiczenia - `"compound"` lub `"isolation"`
  - `is_active` (boolean): Filtr po statusie aktywności (domyślnie `true`)
  - `page` (integer): Numer strony (domyślnie `1`, min `1`)
  - `page_size` (integer): Liczba wyników na stronę (domyślnie `20`, min `1`, max `100`)
  - `sort` (string): Sortowanie wyników (np. `"name"`, `"-created_at"`, `"exercise_type"`)

**Przykładowe URL:**

```
GET /api/v1/exercises?q=bench&type=compound&page=1&page_size=20
GET /api/v1/exercises?muscle_group_id=2&is_active=true&sort=name
GET /api/v1/exercises?muscle_subgroup_id=5&sort=-created_at
```

### 2.2 GET /api/v1/exercises/:id

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/exercises/:id`  
**Autentykacja:** Opcjonalna (endpoint publiczny)  
**Parametry URL:**

- **Wymagane:**
  - `id` (integer): Identyfikator ćwiczenia (PRIMARY KEY)

**Przykładowe URL:**

```
GET /api/v1/exercises/42
GET /api/v1/exercises/123
```

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

### DTOs (Data Transfer Objects)

```typescript
export type ExerciseDTO = Omit<DbTables<"exercises">, "exercise_type"> & {
  // Narrow DB string to domain union used by API
  exercise_type: ExerciseType;
};

// ExerciseDTO zawiera wszystkie pola z tabeli exercises:
// {
//   id: number;
//   name: string;
//   slug: string;
//   muscle_group_id: number;
//   muscle_subgroup_id: number | null;
//   exercise_type: ExerciseType; // "compound" | "isolation"
//   recommended_rep_range_min: number;
//   recommended_rep_range_max: number;
//   instructions: string;
//   is_active: boolean;
//   created_at: string; // ISO-8601
//   updated_at: string; // ISO-8601
// }
```

### Query Models

```typescript
export type ExercisesQueryParams = PaginationParams & {
  q?: string;
  muscle_group_id?: number;
  muscle_subgroup_id?: number;
  type?: ExerciseType;
  is_active?: boolean;
};

export interface PaginationParams {
  page?: number;
  page_size?: number; // default 20, max 100
  sort?: string; // e.g. "name", "-created_at"
}
```

### Response Types

```typescript
export type ExercisesListResponse = PaginatedResponse<ExerciseDTO>;

export interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  page_size: number;
  last_page: number;
}
```

### Pomocnicze typy

```typescript
export type ExerciseType = "compound" | "isolation";
```

### Command Models

Brak - endpoint jest read-only (komentarz w `types.ts`: "// 2.3 Exercises are read-only (no commands)")

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/v1/exercises (lista)

**Sukces (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Barbell Bench Press",
      "slug": "barbell-bench-press",
      "muscle_group_id": 2,
      "muscle_subgroup_id": 5,
      "exercise_type": "compound",
      "recommended_rep_range_min": 6,
      "recommended_rep_range_max": 12,
      "instructions": "Lie flat on bench, grip bar slightly wider than shoulder width...",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Incline Dumbbell Press",
      "slug": "incline-dumbbell-press",
      "muscle_group_id": 2,
      "muscle_subgroup_id": 6,
      "exercise_type": "compound",
      "recommended_rep_range_min": 8,
      "recommended_rep_range_max": 15,
      "instructions": "Set bench to 30-45 degree angle, hold dumbbells at shoulder level...",
      "is_active": true,
      "created_at": "2025-01-15T10:05:00.000Z",
      "updated_at": "2025-01-15T10:05:00.000Z"
    }
  ],
  "total": 145,
  "page": 1,
  "page_size": 20,
  "last_page": 8
}
```

**Błąd - Nieprawidłowe parametry (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "page_size",
      "message": "Page size must be between 1 and 100"
    },
    {
      "field": "type",
      "message": "Invalid enum value. Expected 'compound' | 'isolation'"
    }
  ]
}
```

**Pusta lista (200 OK):**

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "last_page": 0
}
```

### 4.2 GET /api/v1/exercises/:id (szczegóły)

**Sukces (200 OK):**

```json
{
  "id": 42,
  "name": "Barbell Back Squat",
  "slug": "barbell-back-squat",
  "muscle_group_id": 1,
  "muscle_subgroup_id": 3,
  "exercise_type": "compound",
  "recommended_rep_range_min": 5,
  "recommended_rep_range_max": 10,
  "instructions": "Position barbell on upper traps, feet shoulder-width apart. Descend by bending knees and hips, keeping chest up and core tight. Drive through heels to return to starting position. Maintain neutral spine throughout movement.",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T11:20:00.000Z"
}
```

**Błąd - Nieprawidłowe ID (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid exercise ID",
  "details": [
    {
      "field": "id",
      "message": "ID must be a positive integer"
    }
  ]
}
```

**Błąd - Ćwiczenie nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Exercise not found"
}
```

### 4.3 Wspólne błędy

**Błąd serwera (500 Internal Server Error):**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### 5.1 GET /api/v1/exercises (lista)

```
1. Request → Astro API Endpoint (/api/v1/exercises/index.ts)
2. Parsowanie query string parameters
3. Walidacja parametrów przez Zod Schema (exercisesQuerySchema)
4. Wywołanie ExerciseService.listExercises(queryParams)
5. Budowanie query Supabase:
   a. SELECT * FROM exercises
   b. Aplikacja filtrów (WHERE):
      - is_active (domyślnie true jeśli nie podano)
      - muscle_group_id
      - muscle_subgroup_id
      - exercise_type
      - q (full-text search: ILIKE '%query%')
   c. Sortowanie (ORDER BY z parsowaniem sort param)
   d. Paginacja (LIMIT, OFFSET calculation)
6. Wykonanie count query dla total
7. Mapowanie DB rows → ExerciseDTO[]
8. Kalkulacja last_page (Math.ceil(total / page_size))
9. Konstrukcja PaginatedResponse
10. Response (200) z ExercisesListResponse
```

### 5.2 GET /api/v1/exercises/:id (szczegóły)

```
1. Request → Astro API Endpoint (/api/v1/exercises/[id].ts)
2. Ekstrakcja id z URL params
3. Walidacja ID przez Zod Schema (exerciseIdSchema)
4. Wywołanie ExerciseService.getExerciseById(id)
5. Query do Supabase: SELECT * FROM exercises WHERE id = $1
6. Mapowanie DB row → ExerciseDTO
7. Response (200) z ExerciseDTO lub (404) jeśli brak ćwiczenia
```

### Interakcje z zewnętrznymi usługami:

**Supabase:**

- Query do tabeli `exercises` z dynamicznymi filtrami
- Wykorzystanie trigram index dla wyszukiwania pełnotekstowego
- Relacje FK do `muscle_groups` i `muscle_subgroups` (validacja integralności)
- Connection pooling zarządzany automatycznie przez Supabase client

**Brak autentykacji:**

- Endpoint publiczny - nie wymaga sprawdzenia `context.locals.user`
- Opcjonalnie można dodać autentykację w przyszłości bez zmian w strukturze

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Status**: Endpoint publiczny (brak wymaganej autentykacji)
- **Uzasadnienie**: Biblioteka ćwiczeń jest publicznym zasobem read-only
- **Przyszłość**: Możliwość dodania autentykacji w przyszłości (np. dla dostępu do nieaktywnych ćwiczeń)

### 6.2 Autoryzacja

- **Izolacja danych**: Nie dotyczy (brak danych użytkownika)
- **Filtr domyślny**: Dla niezalogowanych użytkowników domyślnie `is_active = true` (ukrycie nieaktywnych ćwiczeń)
- **Admin access**: Dostęp do `is_active = false` wymagałby implementacji ról użytkownika

### 6.3 Walidacja danych wejściowych

**Schemat Zod dla listy (`exercisesQuerySchema`):**

- `q`: `string().trim().max(200).optional()` - ochrona przed długimi zapytaniami
- `muscle_group_id`: `number().int().positive().optional()` - tylko dodatnie integery
- `muscle_subgroup_id`: `number().int().positive().optional()` - tylko dodatnie integery
- `type`: `enum(["compound", "isolation"]).optional()` - tylko dozwolone wartości
- `is_active`: `boolean().optional()` - coercion ze stringa ("true"/"false")
- `page`: `number().int().positive().default(1)` - minimum 1
- `page_size`: `number().int().min(1).max(100).default(20)` - limit 100 dla DoS protection
- `sort`: `string().regex(/^-?(name|created_at|updated_at|exercise_type)$/).optional()` - whitelist pól

**Schemat Zod dla szczegółów (`exerciseIdSchema`):**

- `id`: `number().int().positive()` - tylko dodatnie integery

**Constrainty:**

- Wszystkie ID muszą być dodatnimi integerami
- Parametr `sort` whitelist (tylko dozwolone pola)
- `page_size` max 100 dla ochrony przed DoS
- Full-text search `q` max 200 znaków

### 6.4 Ochrona przed SQL Injection

- **Supabase client**: Automatyczna parametryzacja zapytań
- **ILIKE search**: Escapowanie wildcards (%, \_) w user input
- **Brak raw SQL**: Używanie tylko query builder API Supabase

### 6.5 Sanityzacja danych wyjściowych

- **Tekstowe pola**: Brak dodatkowej sanityzacji (odpowiedzialność frontend)
- **JSON encoding**: Automatyczne przez `JSON.stringify()`
- **Ochrona przed XSS**: Content-Type: application/json zapobiega wykonaniu skryptów

### 6.6 Information Disclosure

- **Błędy 500**: Nie zwracać szczegółów błędów bazy danych klientowi
- **Logowanie**: Pełne błędy logowane server-side z kontekstem
- **Stack traces**: Nigdy nie wysyłane w response

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Kod | Nazwa                 | Scenariusz                                           | Odpowiedź                           |
| --- | --------------------- | ---------------------------------------------------- | ----------------------------------- |
| 200 | OK                    | Pomyślne GET (lista lub szczegóły)                   | ExercisesListResponse / ExerciseDTO |
| 400 | Bad Request           | Nieprawidłowe parametry query lub ID (walidacja Zod) | Error z details                     |
| 404 | Not Found             | Ćwiczenie o podanym ID nie istnieje                  | Error message                       |
| 500 | Internal Server Error | Błąd bazy danych lub nieoczekiwany błąd              | Error message (generic)             |

**Uwaga:** Kody 401/403 nie są używane, ponieważ endpoint jest publiczny.

### 7.2 Szczegółowe scenariusze

**400 Bad Request - Nieprawidłowe parametry query:**

- **Trigger**: Walidacja Zod fails dla query params
- **Przykłady**:
  - `page_size = 150` (przekracza max 100)
  - `type = "invalid"` (nie jest compound ani isolation)
  - `page = -1` (musi być positive)
  - `muscle_group_id = "abc"` (musi być integer)
  - `sort = "invalid_field"` (pole nie jest na whiteliście)
- **Response**:

```json
{
  "error": "Validation Error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "page_size",
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

**400 Bad Request - Nieprawidłowe ID:**

- **Trigger**: ID w URL nie jest positive integer
- **Przykłady**: `/api/v1/exercises/abc`, `/api/v1/exercises/-5`, `/api/v1/exercises/0`
- **Response**:

```json
{
  "error": "Validation Error",
  "message": "Invalid exercise ID",
  "details": [
    {
      "field": "id",
      "message": "Number must be greater than 0"
    }
  ]
}
```

**404 Not Found:**

- **Trigger**: Ćwiczenie o podanym ID nie istnieje w bazie
- **Response**:

```json
{
  "error": "Not Found",
  "message": "Exercise not found"
}
```

**500 Internal Server Error:**

- **Trigger**: Błąd bazy danych, timeout, niespodziewany wyjątek
- **Logging**: `console.error` z pełnym stack trace i kontekstem query
- **Response**:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### 7.3 Format odpowiedzi błędu

```typescript
interface ErrorResponse {
  error: string; // Nazwa błędu (np. "Validation Error", "Not Found")
  message: string; // Czytelny komunikat dla użytkownika
  details?: Array<{
    // Opcjonalne szczegóły (dla błędów walidacji)
    field: string; // Nazwa pola
    message: string; // Opis błędu
  }>;
}
```

### 7.4 Logowanie błędów

```typescript
// Błędy 500 - pełne logowanie
console.error("[ExercisesAPI] Unexpected error:", {
  endpoint: "GET /api/v1/exercises",
  params: queryParams,
  error: error.message,
  stack: error.stack,
});

// Błędy 400 - podstawowe logowanie
console.warn("[ExercisesAPI] Validation error:", {
  endpoint: "GET /api/v1/exercises",
  params: queryParams,
  errors: zodError.errors,
});

// Błędy 404 - info logging
console.info("[ExercisesAPI] Exercise not found:", {
  endpoint: "GET /api/v1/exercises/:id",
  exerciseId: id,
});
```

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **Full-text search (trigram):**
   - Wyszukiwanie `ILIKE '%query%'` może być kosztowne bez indeksu
   - Mitygacja: Wykorzystanie istniejącego trigram index na kolumnie `name`
   - Sprawdzenie: Upewnić się że extension `pg_trgm` jest włączona
   - Query: `CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON exercises USING gin (name gin_trgm_ops);`

2. **COUNT query dla paginacji:**
   - Oddzielne `COUNT(*)` query może być wolne dla dużych tabel
   - Mitygacja: Użycie `count: 'exact'` dla małych filtrowanych zbiorów, `count: 'estimated'` dla pełnej tabeli
   - Optymalizacja: Cache count result na 5-10 minut dla popularnych filtrów

3. **Brak indeksów na kolumnach filtrowania:**
   - Filtry `muscle_group_id`, `muscle_subgroup_id`, `is_active` mogą wymagać full table scan
   - Mitygacja: Utworzenie composite index
   - Rekomendacja: `CREATE INDEX idx_exercises_filters ON exercises (is_active, muscle_group_id, muscle_subgroup_id, exercise_type);`

4. **Duże response payloads:**
   - Pole `instructions` (TEXT) może być długie
   - Mitygacja opcjonalna: Nie zwracać `instructions` w liście (tylko w szczegółach)
   - Obecnie: Zwracamy pełne dane (zgodnie ze specyfikacją)

5. **N+1 problem:**
   - Nie dotyczy - brak JOINów, wszystkie dane w jednej tabeli
   - FK są tylko jako integery, nie pobieramy powiązanych rekordów

### 8.2 Strategie optymalizacji

#### 8.2.1 Indeksy bazy danych

**Istniejące:**

- PRIMARY KEY na `id` (automatyczny index)
- UNIQUE index na `slug`

**Rekomendowane do utworzenia (zgodnie z db-plan.md):**

```sql
-- Trigram index dla full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
  ON exercises
  USING gin (name gin_trgm_ops);

-- Individual indexes (już zdefiniowane w db-plan.md):
CREATE INDEX idx_exercises_muscle_group_id ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_active ON exercises(is_active) WHERE is_active = TRUE;
```

**Uwaga:** Strategia indeksowania używa pojedynczych indeksów zamiast composite index. PostgreSQL query planner może efektywnie łączyć individual indexes (bitmap index scan) dla złożonych zapytań. Partial index na `is_active` (WHERE is_active = TRUE) jest bardziej efektywny niż pełny indeks, ponieważ większość zapytań filtruje tylko aktywne ćwiczenia.

#### 8.2.2 Query optimization

1. **Selective field retrieval:**
   - Obecnie: `SELECT *` (wszystkie pola)
   - Opcjonalnie: Wybrać tylko potrzebne pola jeśli `instructions` zbyt duże
   - Implementacja: `.select('id, name, slug, ...')` w Supabase query

2. **Efficient counting:**
   - Dla paginacji używać `count: 'exact'` tylko gdy potrzebne
   - Dla dużych niesfiltrowanych zbiorów używać `count: 'estimated'`
   - Cache count results w Redis/memory (TTL 5-10 min)

3. **Query planner hints:**
   - Supabase automatycznie optymalizuje queries
   - Monitoring przez `EXPLAIN ANALYZE` dla slow queries

#### 8.2.3 Connection pooling

- Supabase automatycznie zarządza connection pool
- Używanie singleton instance: `context.locals.supabase` (już skonfigurowane)
- Brak potrzeby dodatkowej konfiguracji

#### 8.2.4 Response compression

- Astro automatycznie włącza gzip/brotli compression
- Dla JSON responses (~5-20KB) kompresja daje 60-70% redukcję

### 8.3 Monitoring i metryki

**Kluczowe metryki do śledzenia:**

1. **Response time:**
   - p50, p95, p99 latency dla obu endpoints
   - Target: p95 < 200ms dla listy, p95 < 100ms dla szczegółów

2. **Database metrics:**
   - Query execution time
   - Number of slow queries (> 1s)
   - Connection pool utilization

3. **Error rates:**
   - 4xx errors (szczególnie 400 validation errors)
   - 5xx errors (target < 0.1%)
   - 404 rate (może wskazywać na problemy z linkingiem)

4. **Usage patterns:**
   - Najpopularniejsze query params (dla cache optimization)
   - Peak traffic times
   - Average page_size requested

5. **Rate limiting:**
   - Number of rate limit violations per hour
   - Top IP addresses hitting limits

**Narzędzia:**

- Supabase Dashboard: Query performance, slow queries
- Application logging: Structured logs z query params i timing
- APM tools: New Relic / Datadog dla end-to-end monitoring
- Alerting: Slack/email alerts dla error rate > 1%

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie bazy danych

**Cel:** Upewnić się że indeksy i extensions są skonfigurowane

**Plik:** `supabase/migrations/YYYYMMDDHHMMSS_optimize_exercises_queries.sql`

```sql
-- Włączenie trigram extension dla full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index dla wyszukiwania po nazwie
CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx
  ON exercises
  USING gin (name gin_trgm_ops);

-- Composite index dla popularnych filtrów
CREATE INDEX IF NOT EXISTS idx_exercises_filters
  ON exercises (is_active, muscle_group_id, exercise_type);

-- Index dla sortowania po dacie utworzenia
CREATE INDEX IF NOT EXISTS idx_exercises_created_at
  ON exercises (created_at DESC);

-- Index dla sortowania po dacie aktualizacji
CREATE INDEX IF NOT EXISTS idx_exercises_updated_at
  ON exercises (updated_at DESC);
```

**Akcje:**

- Utworzyć plik migracji
- Uruchomić migrację lokalnie: `supabase migration up`
- Zweryfikować indeksy: `\d exercises` w psql

### Krok 2: Implementacja warstwy walidacji

**Plik:** `src/lib/validation/exercise.validation.ts`

**Zawartość:**

- Import Zod i typów z `src/types.ts`
- Schemat `exercisesQuerySchema` dla walidacji query params listy:
  - `q`: optional string z trim i max length 200
  - `muscle_group_id`: optional positive integer
  - `muscle_subgroup_id`: optional positive integer
  - `type`: optional enum ["compound", "isolation"]
  - `is_active`: optional boolean z coercion
  - `page`: integer z default 1
  - `page_size`: integer z default 20, max 100
  - `sort`: optional string z regex whitelist
- Schemat `exerciseIdSchema` dla walidacji ID:
  - `id`: positive integer
- Export typów inference: `ExercisesQueryInput`, `ExerciseIdInput`

### Krok 3: Implementacja pomocniczych funkcji dla query building

**Plik:** `src/lib/api-helpers.ts` (rozszerzenie istniejącego pliku)

**Nowe funkcje:**

- `parseQueryParams<T>(url: URL, schema: ZodSchema): T` - parsowanie i walidacja query params z URL
- `parseSortParam(sort: string | undefined): { column: string; ascending: boolean }` - parsowanie parametru sort
- `buildPaginationMeta(total: number, page: number, pageSize: number)` - kalkulacja metadanych paginacji

### Krok 4: Implementacja serwisu ExerciseService

**Plik:** `src/lib/services/exercise.service.ts`

**Zawartość:**

- Import typów: `ExerciseDTO`, `ExercisesListResponse`, `ExercisesQueryParams` z `src/types.ts`
- Import `SupabaseClient` z `src/db/supabase.client.ts`
- Klasa `ExerciseService`:
  - Constructor przyjmujący `SupabaseClient`
  - Metoda `listExercises(params: ExercisesQueryParams): Promise<ExercisesListResponse>`
    - Budowanie query z filtrami (muscle_group_id, muscle_subgroup_id, type, is_active)
    - Implementacja full-text search dla `q` (ILIKE)
    - Aplikacja sortowania (parsowanie sort param)
    - Aplikacja paginacji (LIMIT, OFFSET)
    - Wykonanie count query
    - Mapowanie rows → ExerciseDTO[]
    - Konstrukcja PaginatedResponse
  - Metoda `getExerciseById(id: number): Promise<ExerciseDTO | null>`
    - Query: SELECT \* FROM exercises WHERE id = $1
    - Mapowanie row → ExerciseDTO
    - Return null jeśli not found

### Krok 5: Implementacja endpointu GET /api/v1/exercises (lista)

**Plik:** `src/pages/api/v1/exercises/index.ts`

**Zawartość:**

- Import typów: `APIRoute` z Astro
- Import: `ZodError` z zod
- Import: `ExerciseService` z `src/lib/services/exercise.service.ts`
- Import: `exercisesQuerySchema` z `src/lib/validation/exercise.validation.ts`
- Import helpers: `errorResponse`, `handleZodError`, `jsonResponse`, `logApiError`, `parseQueryParams`
- Export `prerender = false`
- Export handler `GET`:
  - Try-catch block
  - Parsowanie i walidacja query params
  - Inicjalizacja ExerciseService
  - Wywołanie listExercises()
  - Return 200 z results
  - Catch: ZodError → 400, inne → 500

### Krok 6: Implementacja endpointu GET /api/v1/exercises/:id (szczegóły)

**Plik:** `src/pages/api/v1/exercises/[id].ts`

**Zawartość:**

- Import typów: `APIRoute` z Astro
- Import: `ZodError` z zod
- Import: `ExerciseService` z `src/lib/services/exercise.service.ts`
- Import: `exerciseIdSchema` z `src/lib/validation/exercise.validation.ts`
- Import helpers: `errorResponse`, `handleZodError`, `jsonResponse`, `logApiError`
- Export `prerender = false`
- Export handler `GET`:
  - Try-catch block
  - Ekstrakcja i parsowanie ID z `context.params.id`
  - Walidacja ID przez exerciseIdSchema
  - Inicjalizacja ExerciseService
  - Wywołanie getExerciseById()
  - Guard: if not found → 404
  - Return 200 z exercise
  - Catch: ZodError → 400, inne → 500

### Krok 7: Dokumentacja API

**Plik:** `docs/api/exercises.md` (opcjonalny)

**Zawartość:**

- Opis endpoints z przykładami curl/fetch
- Wszystkie możliwe parametry query
- Przykładowe response dla różnych scenariuszy
- Kody błędów i ich znaczenie
- Rate limiting policy

**Przykład:**

````markdown
## GET /api/v1/exercises

Returns a paginated list of exercises from the global library.

### Request

```bash
curl "https://api.example.com/api/v1/exercises?q=bench&type=compound&page=1&page_size=20"
```
````

### Response

200 OK

```json
{
  "data": [...],
  "total": 145,
  "page": 1,
  "page_size": 20,
  "last_page": 8
}
```
