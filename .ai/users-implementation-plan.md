# API Endpoint Implementation Plan: Profile Management

## 1. Przegląd punktu końcowego

Endpoint `/api/v1/profile` zarządza danymi profilu użytkownika w aplikacji fitness log. Rozszerza podstawową tabelę autentykacji Supabase (`auth.users`) o dane profilowe użytkownika takie jak waga, wzrost, płeć oraz informacje o kontuzjach i ograniczeniach.

Endpoint obsługuje trzy operacje:

- **GET**: Pobieranie profilu zalogowanego użytkownika
- **POST**: Tworzenie profilu bezpośrednio po rejestracji
- **PATCH**: Aktualizacja danych profilu

## 2. Szczegóły żądania

### 2.1 GET /api/v1/profile

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/profile`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Parametry:** Brak  
**Request Body:** Brak

### 2.2 POST /api/v1/profile

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/profile`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry:**

- **Wymagane:** Brak (profil może być pusty)
- **Opcjonalne:**
  - `weight_kg` (number): Waga użytkownika w kilogramach (0 < value ≤ 500)
  - `height_cm` (integer): Wzrost użytkownika w centymetrach (100 ≤ value ≤ 250)
  - `gender` (string): Płeć użytkownika (max 20 znaków)
  - `injuries_limitations` (string): Informacje o kontuzjach i ograniczeniach

**Request Body Example:**

```json
{
  "weight_kg": 75.5,
  "height_cm": 180,
  "gender": "male",
  "injuries_limitations": "Knee injury - avoid deep squats"
}
```

### 2.3 PATCH /api/v1/profile

**Metoda HTTP:** PATCH  
**Struktura URL:** `/api/v1/profile`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry:**

- **Wymagane:** Brak (częściowa aktualizacja)
- **Opcjonalne:** (wszystkie pola z POST)
  - `weight_kg` (number): 0 < value ≤ 500
  - `height_cm` (integer): 100 ≤ value ≤ 250
  - `gender` (string): max 20 znaków
  - `injuries_limitations` (string): text

**Request Body Example:**

```json
{
  "weight_kg": 73.2
}
```

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

### DTOs (Data Transfer Objects)

```typescript
export type ProfileDTO = DbTables<"users">;
```

### Command Models

```typescript
export type ProfileCreateCommand = Omit<DbInsert<"users">, "id" | "created_at" | "updated_at">;

export type ProfileUpdateCommand = Partial<Omit<DbUpdate<"users">, "id" | "created_at" | "updated_at">>;
```

### Pomocnicze typy

```typescript
export type UUID = string;
```

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/v1/profile

**Sukces (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "weight_kg": 75.5,
  "height_cm": 180,
  "gender": "male",
  "injuries_limitations": "Knee injury - avoid deep squats",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

**Błąd - Brak autentykacji (401 Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Błąd - Profil nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Profile not found"
}
```

### 4.2 POST /api/v1/profile

**Sukces (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "weight_kg": 75.5,
  "height_cm": 180,
  "gender": "male",
  "injuries_limitations": "Knee injury - avoid deep squats",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

**Błąd - Nieprawidłowe dane (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "weight_kg",
      "message": "Weight must be greater than 0 and less than or equal to 500"
    }
  ]
}
```

**Błąd - Profil już istnieje (409 Conflict):**

```json
{
  "error": "Conflict",
  "message": "Profile already exists"
}
```

### 4.3 PATCH /api/v1/profile

**Sukces (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "weight_kg": 73.2,
  "height_cm": 180,
  "gender": "male",
  "injuries_limitations": "Knee injury - avoid deep squats",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T14:45:00.000Z"
}
```

**Błąd - Profil nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Profile not found"
}
```

## 5. Przepływ danych

### 5.1 GET /api/v1/profile

```
1. Request → Astro API Endpoint (/api/v1/profile.ts)
2. Sprawdzenie autentykacji (context.locals.user)
3. Wywołanie ProfileService.getProfile(userId)
4. Query do Supabase: SELECT * FROM users WHERE id = userId
5. Mapowanie DB Row → ProfileDTO
6. Response (200) z ProfileDTO lub (404) jeśli brak profilu
```

### 5.2 POST /api/v1/profile

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Walidacja Request Body przez Zod Schema
4. Sprawdzenie czy profil już nie istnieje
5. Wywołanie ProfileService.createProfile(userId, data)
6. INSERT do Supabase users table
7. Mapowanie created row → ProfileDTO
8. Response (201) z ProfileDTO
```

### 5.3 PATCH /api/v1/profile

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Walidacja Request Body przez Zod Schema (partial)
4. Wywołanie ProfileService.updateProfile(userId, data)
5. UPDATE w Supabase users table
6. Mapowanie updated row → ProfileDTO
7. Response (200) z ProfileDTO lub (404) jeśli profil nie istnieje
```

### Interakcje z zewnętrznymi usługami:

**Supabase:**

- Autentykacja użytkownika przez Supabase Auth
- Operacje CRUD na tabeli `users`
- Wykorzystanie triggera `update_updated_at_column` do automatycznej aktualizacji `updated_at`

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Wymagana autentykacja**: Wszystkie endpointy wymagają zalogowanego użytkownika
- **Implementacja**: Sprawdzenie `context.locals.user` w middleware Astro
- **Kod błędu**: 401 Unauthorized gdy brak autentykacji

### 6.2 Autoryzacja

- **Izolacja danych**: Użytkownik może zarządzać tylko własnym profilem
- **Implementacja**: Użycie `user.id` z sessji jako identyfikatora w zapytaniach
- **Ochrona**: Brak możliwości modyfikacji profilu innego użytkownika przez parametry URL

### 6.3 Walidacja danych wejściowych

- **Schemat Zod**: Walidacja wszystkich danych przed zapisem do bazy
- **Constrainty**:
  - `weight_kg`: number, > 0, ≤ 500
  - `height_cm`: integer, ≥ 100, ≤ 250
  - `gender`: string, max 20 znaków
  - `injuries_limitations`: string (text)
- **Ochrona przed injection**: Supabase client automatycznie sanityzuje zapytania

### 6.4 Sanityzacja danych

- **Tekstowe pola**: Trimowanie białych znaków
- **Ochrona przed XSS**: Dane są przechowywane jako plain text, frontend odpowiada za escapowanie przy wyświetlaniu

### 6.5 Rate Limiting

- **Rekomendacja**: Implementacja rate limiting w middleware Astro
- **Limit**: np. 100 żądań/15 minut per użytkownik

### 6.6 CORS

- **Konfiguracja**: Ograniczenie dostępu tylko z dozwolonych domen
- **Implementacja**: Ustawienie odpowiednich nagłówków CORS w middleware

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Kod | Nazwa                 | Scenariusz                                   | Odpowiedź                      |
| --- | --------------------- | -------------------------------------------- | ------------------------------ |
| 200 | OK                    | Pomyślne GET lub PATCH                       | ProfileDTO                     |
| 201 | Created               | Pomyślne POST                                | ProfileDTO                     |
| 400 | Bad Request           | Nieprawidłowe dane wejściowe (walidacja Zod) | Error z details                |
| 401 | Unauthorized          | Brak autentykacji                            | Error message                  |
| 404 | Not Found             | Profil nie istnieje (GET/PATCH)              | Error message                  |
| 409 | Conflict              | Profil już istnieje (POST)                   | Error message                  |
| 500 | Internal Server Error | Błąd bazy danych lub nieoczekiwany błąd      | Error message (bez szczegółów) |

### 7.2 Szczegółowe scenariusze

**401 Unauthorized:**

- Trigger: Brak `context.locals.user`
- Response: `{ "error": "Unauthorized", "message": "Authentication required" }`

**400 Bad Request:**

- Trigger: Nieprawidłowe dane (Zod validation fails)
- Response:

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "weight_kg",
      "message": "Weight must be greater than 0 and less than or equal to 500"
    }
  ]
}
```

**404 Not Found:**

- Trigger: Profil nie istnieje w bazie (GET/PATCH)
- Response: `{ "error": "Not Found", "message": "Profile not found" }`

**409 Conflict:**

- Trigger: Próba utworzenia profilu, który już istnieje (POST)
- Response: `{ "error": "Conflict", "message": "Profile already exists" }`

**500 Internal Server Error:**

- Trigger: Błąd bazy danych, niespodziewany wyjątek
- Logging: `console.error` z pełnym stack trace
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
// Błędy 500 - pełne logowanie
console.error("[ProfileAPI] Unexpected error:", {
  endpoint: "POST /api/v1/profile",
  userId: user.id,
  error: error.message,
  stack: error.stack,
});

// Błędy 400 - podstawowe logowanie
console.warn("[ProfileAPI] Validation error:", {
  endpoint: "POST /api/v1/profile",
  userId: user.id,
  errors: zodError.errors,
});
```

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **Baza danych:**
   - Single row queries są szybkie dzięki PRIMARY KEY lookup
   - Tabela `users` jest stosunkowo mała (jeden wiersz per użytkownik)

2. **Autentykacja:**
   - Weryfikacja sessji Supabase na każde żądanie
   - Mitygacja: Session caching w middleware

3. **Walidacja:**
   - Zod validation jest synchroniczna i szybka
   - Minimalny wpływ na performance

### 8.2 Strategie optymalizacji

1. **Caching:**
   - **Cache profilu**: Cache profilu użytkownika w session storage
   - **TTL**: 5-15 minut
   - **Invalidacja**: Po każdej operacji POST/PATCH

2. **Indeksy bazy danych:**
   - PRIMARY KEY na `id` (już istnieje)
   - Brak potrzeby dodatkowych indeksów (query only by id)

3. **Connection pooling:**
   - Supabase automatycznie zarządza connection pool
   - Używanie jednego client instance (`context.locals.supabase`)

4. **Response compression:**
   - Astro automatycznie kompresuje odpowiedzi
   - Dla małych JSONów (~1KB) korzyść minimalna

5. **Lazy loading:**
   - Profile ładowany tylko gdy potrzebny (nie na każdej stronie)
   - Client-side cache w React Context/Store

### 8.3 Monitoring

Metryki do monitorowania:

- Czas odpowiedzi endpoint (p50, p95, p99)
- Liczba błędów 500 per endpoint
- Czas zapytań do bazy danych
- Rate limit violations

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury projektu

Utworzenie wymaganych katalogów:

- `src/lib/services/`
- `src/lib/validation/`
- `src/pages/api/v1/`

### Krok 2: Implementacja warstwy walidacji

**Plik:** `src/lib/validation/profile.validation.ts`

- Definicja schematów Zod dla `profileCreateSchema` i `profileUpdateSchema`
- Walidacja zgodna z constraintami bazy danych (weight_kg, height_cm)
- Export typów inference z Zod

### Krok 3: Implementacja serwisu ProfileService

**Plik:** `src/lib/services/profile.service.ts`

- Metoda `getProfile()` - pobieranie profilu użytkownika
- Metoda `createProfile()` - tworzenie nowego profilu
- Metoda `updateProfile()` - aktualizacja istniejącego profilu
- Metoda `profileExists()` - sprawdzenie istnienia profilu
- Obsługa błędów Supabase (kody PGRST116 dla not found)

### Krok 4: Implementacja funkcji pomocniczych API

**Plik:** `src/lib/api-helpers.ts`

- `checkAuth()` - weryfikacja autentykacji użytkownika
- `handleZodError()` - formatowanie błędów walidacji
- `jsonResponse()` - standaryzacja odpowiedzi JSON
- `errorResponse()` - standaryzacja odpowiedzi błędów

### Krok 5: Implementacja endpointu GET

**Plik:** `src/pages/api/v1/profile.ts`

- Handler GET z `export const prerender = false`
- Guard clause dla autentykacji
- Wywołanie `ProfileService.getProfile()`
- Obsługa przypadku 404 (profil nie istnieje)
- Try-catch z logowaniem błędów

### Krok 6: Implementacja endpointu POST

**Rozszerzenie:** `src/pages/api/v1/profile.ts`

- Handler POST z walidacją przez Zod
- Sprawdzenie czy profil już nie istnieje (409)
- Wywołanie `ProfileService.createProfile()`
- Obsługa błędów: ZodError, SyntaxError, PostgreSQL unique violation
- Zwrot kodu 201 przy sukcesie

### Krok 7: Implementacja endpointu PATCH

**Rozszerzenie:** `src/pages/api/v1/profile.ts`

- Handler PATCH z partial validation
- Guard dla pustego body
- Wywołanie `ProfileService.updateProfile()`
- Obsługa przypadku 404 (profil nie istnieje)
- Zwrot kodu 200 z zaktualizowanymi danymi

---
