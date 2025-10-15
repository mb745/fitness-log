# API Endpoint Implementation Plan: Muscle Dictionaries

## 1. Przegląd punktu końcowego

Endpointy `/api/v1/muscle-groups`, `/api/v1/muscle-groups/:id/subgroups` oraz `/api/v1/muscle-subgroups` zarządzają słownikami grup i podgrup mięśniowych w aplikacji fitness log. Są to statyczne dane referencyjne tylko do odczytu, wykorzystywane w całej aplikacji do kategoryzacji ćwiczeń.

Endpointy obsługują trzy operacje:

- **GET /api/v1/muscle-groups**: Pobieranie pełnej listy grup mięśniowych
- **GET /api/v1/muscle-groups/:id/subgroups**: Pobieranie podgrup dla konkretnej grupy mięśniowej
- **GET /api/v1/muscle-subgroups**: Pobieranie pełnej listy wszystkich podgrup mięśniowych

## 2. Szczegóły żądania

### 2.1 GET /api/v1/muscle-groups

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/muscle-groups`  
**Autentykacja:** Nie wymagana (publiczny endpoint)  
**Parametry:** Brak  
**Request Body:** Brak

### 2.2 GET /api/v1/muscle-groups/:id/subgroups

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/muscle-groups/:id/subgroups`  
**Autentykacja:** Nie wymagana (publiczny endpoint)  
**Content-Type:** `application/json`

**Parametry:**

- **Wymagane:**
  - `id` (path parameter) - integer, dodatni, identyfikator grupy mięśniowej
- **Opcjonalne:** Brak

**Request Body:** Brak

### 2.3 GET /api/v1/muscle-subgroups

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/muscle-subgroups`  
**Autentykacja:** Nie wymagana (publiczny endpoint)  
**Parametry:** Brak  
**Request Body:** Brak

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

### DTOs (Data Transfer Objects)

```typescript
export type MuscleGroupDTO = DbTables<"muscle_groups">;

// Struktura:
// {
//   id: number;
//   name: string;
//   created_at: string;
// }

export type MuscleSubgroupDTO = DbTables<"muscle_subgroups">;

// Struktura:
// {
//   id: number;
//   muscle_group_id: number;
//   name: string;
//   created_at: string;
// }
```

### Command Models

Brak - wszystkie endpointy są tylko do odczytu.

### Typy walidacji

Do utworzenia w `src/lib/validation/muscle-groups.validation.ts`:

```typescript
export const muscleGroupIdParamSchema = z.object({
  id: z.coerce
    .number({
      invalid_type_error: "Muscle group ID must be a number",
    })
    .int("Muscle group ID must be an integer")
    .positive("Muscle group ID must be a positive integer"),
});

export type MuscleGroupIdParam = z.infer<typeof muscleGroupIdParamSchema>;
```

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/v1/muscle-groups

**Sukces (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Klatka piersiowa",
    "created_at": "2025-01-09T12:00:00Z"
  },
  {
    "id": 2,
    "name": "Plecy",
    "created_at": "2025-01-09T12:00:00Z"
  }
]
```

**Błąd - Błąd serwera (500 Internal Server Error):**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### 4.2 GET /api/v1/muscle-groups/:id/subgroups

**Sukces (200 OK):**

```json
[
  {
    "id": 1,
    "muscle_group_id": 1,
    "name": "górna",
    "created_at": "2025-01-09T12:00:00Z"
  },
  {
    "id": 2,
    "muscle_group_id": 1,
    "name": "środkowa",
    "created_at": "2025-01-09T12:00:00Z"
  }
]
```

**Błąd - Nieprawidłowe dane (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "id",
      "message": "Muscle group ID must be a positive integer"
    }
  ]
}
```

**Błąd - Grupa nie znaleziona (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Muscle group not found"
}
```

**Błąd - Błąd serwera (500 Internal Server Error):**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### 4.3 GET /api/v1/muscle-subgroups

**Sukces (200 OK):**

```json
[
  {
    "id": 1,
    "muscle_group_id": 1,
    "name": "górna",
    "created_at": "2025-01-09T12:00:00Z"
  },
  {
    "id": 2,
    "muscle_group_id": 1,
    "name": "środkowa",
    "created_at": "2025-01-09T12:00:00Z"
  }
]
```

**Błąd - Błąd serwera (500 Internal Server Error):**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Przepływ danych

### 5.1 GET /api/v1/muscle-groups

```
1. Request → Astro API Endpoint (/api/v1/muscle-groups.ts)
2. Wywołanie MuscleGroupsService.getAllMuscleGroups()
3. Query do Supabase: SELECT * FROM muscle_groups ORDER BY name
4. Mapowanie DB Rows → MuscleGroupDTO[]
5. Response (200) z tablicą MuscleGroupDTO
```

### 5.2 GET /api/v1/muscle-groups/:id/subgroups

```
1. Request → Astro API Endpoint (/api/v1/muscle-groups/[id].ts)
2. Walidacja parametru :id przez Zod Schema
3. Wywołanie MuscleGroupsService.getMuscleGroupById(id)
4. Sprawdzenie czy grupa istnieje (404 jeśli nie)
5. Wywołanie MuscleGroupsService.getSubgroupsByMuscleGroupId(id)
6. Query do Supabase: SELECT * FROM muscle_subgroups WHERE muscle_group_id = id
7. Mapowanie DB Rows → MuscleSubgroupDTO[]
8. Response (200) z tablicą MuscleSubgroupDTO
```

### 5.3 GET /api/v1/muscle-subgroups

```
1. Request → Astro API Endpoint (/api/v1/muscle-subgroups.ts)
2. Wywołanie MuscleGroupsService.getAllMuscleSubgroups()
3. Query do Supabase: SELECT * FROM muscle_subgroups ORDER BY muscle_group_id
4. Mapowanie DB Rows → MuscleSubgroupDTO[]
5. Response (200) z tablicą MuscleSubgroupDTO
```

### Interakcje z zewnętrznymi usługami:

**Supabase:**

- Operacje odczytu na tabelach `muscle_groups` i `muscle_subgroups`
- Wykorzystanie connection pooling Supabase SDK
- Automatyczna parametryzacja queries zapobiegająca SQL injection

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Brak wymaganej autentykacji**: Endpointy są publiczne zgodnie ze specyfikacją
- **Uzasadnienie**: Słowniki grup mięśniowych są danymi referencyjnymi, niezbędnymi dla publicznych funkcji aplikacji
- **Implementacja**: Nie używamy `checkAuth()` z `api-helpers.ts`

### 6.2 Autoryzacja

- **Dane publiczne**: Wszystkie dane są dostępne publicznie bez ograniczeń
- **Brak wrażliwych informacji**: Słowniki zawierają tylko nazwy grup i podgrup mięśniowych

### 6.2.1 Row-Level Security (RLS)

**Ważne:** Mimo że endpointy API są publiczne, tabele `muscle_groups` i `muscle_subgroups` mają **włączone RLS** w bazie danych:

```sql
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_subgroups ENABLE ROW LEVEL SECURITY;

-- Polityka publicznego dostępu do odczytu
CREATE POLICY "Public read access to muscle groups" ON muscle_groups
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Public read access to muscle subgroups" ON muscle_subgroups
  FOR SELECT
  USING (TRUE);
```

**Implikacje:**

- **SELECT queries:** Działają normalnie - każdy może czytać dane (policy USING TRUE)
- **INSERT/UPDATE/DELETE:** Wymagają bypass RLS lub dodatkowych policies
  - W produkcji: tylko admin/system może modyfikować dane
  - W development: użyj service_role key lub `SET ROLE service_role;` w migracji
- **Supabase client:** Domyślnie używa anon key - ma tylko dostęp do SELECT zgodnie z polityką
- **Zarządzanie danymi:** Wstawianie danych słownikowych powinno odbywać się przez migracje z service_role credentials

**Rekomendacje:**

- Seed data dla tych tabel powinien być w migracjach, nie przez API
- Jeśli w przyszłości potrzebny będzie admin endpoint do zarządzania słownikami, należy dodać policies dla admin role

### 6.3 Walidacja danych wejściowych

- **Parametr :id**: Walidowany używając Zod schema
- **Constrainty**:
  - Typ: number (coerce string to number)
  - Ograniczenia: integer, positive
  - Zapobiega: SQL injection, type coercion bugs

### 6.4 Sanityzacja danych

- **Supabase SDK**: Automatycznie parametryzuje queries
- **Walidacja typów**: Zod schema wymusza integer, zapobiegając injection przez malformed input

### 6.5 Rate Limiting

- **Rekomendacja**: Implementacja rate limiting na poziomie middleware lub Cloudflare
- **Cel**: Zapobieganie DoS attacks na publiczne endpointy
- **Uwaga**: Brak implementacji w MVP

### 6.6 Caching

- **Rekomendacja**: Cache-Control headers dla statycznych danych
- **Przykład**: `Cache-Control: public, max-age=3600`
- **Korzyść**: Zmniejsza obciążenie serwera i bazy danych

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Kod | Nazwa                 | Scenariusz                                                   | Odpowiedź       |
| --- | --------------------- | ------------------------------------------------------------ | --------------- |
| 200 | OK                    | Pomyślne GET                                                 | Array DTO       |
| 400 | Bad Request           | Parametr :id nieprawidłowy (nie liczba, ujemny, zero, float) | Error z details |
| 404 | Not Found             | Grupa mięśniowa o podanym ID nie istnieje                    | Error message   |
| 500 | Internal Server Error | Błąd bazy danych lub nieoczekiwany błąd                      | Error message   |

### 7.2 Szczegółowe scenariusze

**400 Bad Request:**

- Trigger: Parametr :id nie jest liczbą / jest ujemny / jest zerem (ZodError)
- Response:

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "id",
      "message": "Muscle group ID must be a positive integer"
    }
  ]
}
```

**404 Not Found:**

- Trigger: Grupa mięśniowa o podanym ID nie istnieje w bazie
- Response: `{ "error": "Not Found", "message": "Muscle group not found" }`

**500 Internal Server Error:**

- Trigger: Błąd połączenia z bazą, timeout query, nieoczekiwany wyjątek
- Logging: `logApiError()` z pełnym stack trace
- Response: `{ "error": "Internal Server Error", "message": "An unexpected error occurred" }`

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
// Błędy walidacji (poziom: warn)
logApiError("GET /api/v1/muscle-groups/:id/subgroups", undefined, error, "warn");

// Błędy serwera (poziom: error, ze stack trace)
logApiError("GET /api/v1/muscle-groups/:id/subgroups", undefined, error);
```

Format logów:

```json
{
  "endpoint": "GET /api/v1/muscle-groups/:id/subgroups",
  "userId": "unknown",
  "error": "Muscle group ID must be a positive integer",
  "stack": "..." // tylko dla level: error
}
```

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **Baza danych:**
   - Małe statyczne słowniki (~10-20 grup, ~30-50 podgrup)
   - Proste SELECT queries bez joins
   - Primary key i foreign key indexes zapewniają szybkie wyszukiwanie

### 8.2 Strategie optymalizacji

1. **Indeksy bazy danych:**
   - PRIMARY KEY na `muscle_groups.id` (już istnieje)
   - PRIMARY KEY na `muscle_subgroups.id` (już istnieje)
   - FOREIGN KEY na `muscle_subgroups.muscle_group_id` (już istnieje)
   - Brak potrzeby dodatkowych indeksów

2. **Query optimization:**
   - Proste SELECT queries są automatycznie optymalizowane przez PostgreSQL
   - Sortowanie po `name` dla lepszego UX
   - Zakładany czas odpowiedzi: < 10ms

3. **Connection pooling:**
   - Supabase SDK automatycznie zarządza connection pool
   - Używanie jednego client instance (`context.locals.supabase`)

### 8.3 Monitoring

Metryki do monitorowania:

- Czas odpowiedzi endpoint (p50, p95, p99)
- Liczba błędów 500 per endpoint
- Cache hit ratio (gdy cache zostanie zaimplementowany)
- Request volume per endpoint

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury projektu

Utworzenie wymaganych katalogów i plików:

- `src/lib/validation/muscle-groups.validation.ts`
- `src/lib/services/muscle-groups.service.ts`
- `src/pages/api/v1/muscle-groups.ts`
- `src/pages/api/v1/muscle-groups/[id].ts`
- `src/pages/api/v1/muscle-subgroups.ts`

### Krok 2: Implementacja warstwy walidacji

**Plik:** `src/lib/validation/muscle-groups.validation.ts`

- Definicja schematu Zod dla `muscleGroupIdParamSchema`
- Walidacja parametru :id (coerce number, integer, positive)
- Export typu TypeScript z inference

### Krok 3: Implementacja serwisu MuscleGroupsService

**Plik:** `src/lib/services/muscle-groups.service.ts`

- Metoda `getAllMuscleGroups()` - pobieranie wszystkich grup
- Metoda `getMuscleGroupById()` - pobieranie grupy po ID
- Metoda `getSubgroupsByMuscleGroupId()` - pobieranie podgrup dla grupy
- Metoda `getAllMuscleSubgroups()` - pobieranie wszystkich podgrup
- Obsługa błędów Supabase (kod PGRST116 dla not found)
- Sortowanie wyników dla lepszego UX

### Krok 4: Implementacja endpointu GET /api/v1/muscle-groups

**Plik:** `src/pages/api/v1/muscle-groups.ts`

- Handler GET z `export const prerender = false`
- Brak guard clause dla autentykacji (publiczny endpoint)
- Wywołanie `MuscleGroupsService.getAllMuscleGroups()`
- Try-catch z logowaniem błędów 500
- Zwrot kodu 200 przy sukcesie

### Krok 5: Implementacja endpointu GET /api/v1/muscle-groups/:id/subgroups

**Plik:** `src/pages/api/v1/muscle-groups/[id].ts`

- Handler GET z walidacją parametru :id przez Zod
- Sprawdzenie czy grupa istnieje (404)
- Wywołanie `MuscleGroupsService.getSubgroupsByMuscleGroupId()`
- Obsługa błędów: ZodError (400), Not Found (404), Server Error (500)
- Odpowiednie poziomy logowania (warn dla 400, error dla 500)

### Krok 6: Implementacja endpointu GET /api/v1/muscle-subgroups

**Plik:** `src/pages/api/v1/muscle-subgroups.ts`

- Handler GET bez parametrów
- Wywołanie `MuscleGroupsService.getAllMuscleSubgroups()`
- Try-catch z logowaniem błędów 500
- Zwrot kodu 200 przy sukcesie

---
