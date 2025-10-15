# API Endpoint Implementation Plan: Workout Plans Management

## 1. Przegląd punktu końcowego

Endpoint `/api/v1/workout-plans` zarządza planami treningowymi użytkownika w aplikacji fitness log. Plan treningowy definiuje harmonogram treningów (cotygodniowy lub interwałowy) oraz listę ćwiczeń z parametrami (serie, powtórzenia, odpoczynek).

Endpoint obsługuje dziewięć operacji:

**Główny zasób (workout_plans):**

- **GET /api/v1/workout-plans**: Listowanie planów użytkownika z filtrowaniem i paginacją
- **POST /api/v1/workout-plans**: Tworzenie nowego planu wraz z ćwiczeniami
- **GET /api/v1/workout-plans/:id**: Pobieranie szczegółów planu z osadzonymi ćwiczeniami
- **PATCH /api/v1/workout-plans/:id**: Aktualizacja parametrów planu (nazwa, harmonogram, status aktywności)
- **DELETE /api/v1/workout-plans/:id**: Usuwanie planu
- **POST /api/v1/workout-plans/:id/activate**: Aktywacja planu (ustawia is_active=true, dezaktywuje pozostałe)

**Sub-zasób (plan_exercises):**

- **POST /api/v1/workout-plans/:id/exercises**: Masowa zamiana listy ćwiczeń w planie
- **PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId**: Aktualizacja parametrów pojedynczego ćwiczenia
- **DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId**: Usunięcie ćwiczenia z planu

## 2. Szczegóły żądania

### 2.1 GET /api/v1/workout-plans

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/workout-plans`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Parametry Query:**

- **Opcjonalne:**
  - `is_active` (boolean): Filtrowanie po statusie aktywności
  - `page` (integer): Numer strony (default: 1)
  - `page_size` (integer): Rozmiar strony (default: 20, max: 100)
  - `sort` (string): Sortowanie, np. "name", "-created_at" (default: "-created_at")

**Request Body:** Brak

**Przykład URL:**

```
GET /api/v1/workout-plans?is_active=true&page=1&page_size=20&sort=-created_at
```

### 2.2 POST /api/v1/workout-plans

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-plans`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry:**

- **Wymagane:**
  - `name` (string, max 200 znaków): Nazwa planu treningowego
  - `schedule_type` (string): Typ harmonogramu - "weekly" lub "interval"
  - `exercises` (array): Lista ćwiczeń (minimum 1 element)
    - `exercise_id` (integer): ID istniejącego ćwiczenia
    - `order_index` (integer, ≥0): Kolejność ćwiczenia w planie
    - `target_sets` (integer, >0): Docelowa liczba serii
    - `target_reps` (integer, >0): Docelowa liczba powtórzeń
    - `rest_seconds` (integer, ≥0): Czas odpoczynku w sekundach
    - `notes` (string, optional): Notatki do ćwiczenia

- **Warunkowo wymagane:**
  - Jeśli `schedule_type = "weekly"`:
    - `schedule_days` (integer[]): Dni tygodnia (1-7, gdzie 1=poniedziałek), min 1 element
    - `schedule_interval_days` musi być `null`
  - Jeśli `schedule_type = "interval"`:
    - `schedule_interval_days` (integer, >0): Liczba dni interwału
    - `schedule_days` musi być `null`

**Request Body Example:**

```json
{
  "name": "Push/Pull/Legs",
  "schedule_type": "weekly",
  "schedule_days": [1, 3, 5],
  "schedule_interval_days": null,
  "exercises": [
    {
      "exercise_id": 42,
      "order_index": 0,
      "target_sets": 4,
      "target_reps": 8,
      "rest_seconds": 120,
      "notes": "Pause reps"
    },
    {
      "exercise_id": 15,
      "order_index": 1,
      "target_sets": 3,
      "target_reps": 12,
      "rest_seconds": 90
    }
  ]
}
```

**Request Body Example (interval schedule):**

```json
{
  "name": "Full Body Workout",
  "schedule_type": "interval",
  "schedule_days": null,
  "schedule_interval_days": 2,
  "exercises": [
    {
      "exercise_id": 1,
      "order_index": 0,
      "target_sets": 5,
      "target_reps": 5,
      "rest_seconds": 180
    }
  ]
}
```

### 2.3 GET /api/v1/workout-plans/:id

**Metoda HTTP:** GET  
**Struktura URL:** `/api/v1/workout-plans/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego

**Request Body:** Brak

### 2.4 PATCH /api/v1/workout-plans/:id

**Metoda HTTP:** PATCH  
**Struktura URL:** `/api/v1/workout-plans/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego

**Parametry Body:**

- **Opcjonalne:** (częściowa aktualizacja)
  - `name` (string, max 200 znaków)
  - `schedule_type` (string): "weekly" lub "interval"
  - `schedule_days` (integer[]): Dla schedule_type='weekly'
  - `schedule_interval_days` (integer, >0): Dla schedule_type='interval'
  - `is_active` (boolean): Status aktywności planu

**Request Body Example:**

```json
{
  "name": "Updated Plan Name",
  "is_active": false
}
```

### 2.5 DELETE /api/v1/workout-plans/:id

**Metoda HTTP:** DELETE  
**Struktura URL:** `/api/v1/workout-plans/:id`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego

**Request Body:** Brak

### 2.6 POST /api/v1/workout-plans/:id/activate

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-plans/:id/activate`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego do aktywacji

**Request Body:** Pusty obiekt `{}` lub brak body

### 2.7 POST /api/v1/workout-plans/:id/exercises

**Metoda HTTP:** POST  
**Struktura URL:** `/api/v1/workout-plans/:id/exercises`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego

**Parametry Body:**

- **Wymagane:**
  - `exercises` (array): Nowa lista ćwiczeń (minimum 1 element)
    - Struktura taka sama jak przy tworzeniu planu

**Request Body Example:**

```json
{
  "exercises": [
    {
      "exercise_id": 10,
      "order_index": 0,
      "target_sets": 3,
      "target_reps": 10,
      "rest_seconds": 60
    },
    {
      "exercise_id": 20,
      "order_index": 1,
      "target_sets": 4,
      "target_reps": 12,
      "rest_seconds": 90,
      "notes": "Focus on form"
    }
  ]
}
```

### 2.8 PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId

**Metoda HTTP:** PATCH  
**Struktura URL:** `/api/v1/workout-plans/:id/exercises/:planExerciseId`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** `application/json`

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego
  - `planExerciseId` (integer): ID plan_exercises (nie exercise_id!)

**Parametry Body:**

- **Opcjonalne:** (częściowa aktualizacja)
  - `order_index` (integer, ≥0)
  - `target_sets` (integer, >0)
  - `target_reps` (integer, >0)
  - `rest_seconds` (integer, ≥0)
  - `notes` (string)

**Request Body Example:**

```json
{
  "target_sets": 5,
  "rest_seconds": 150
}
```

### 2.9 DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId

**Metoda HTTP:** DELETE  
**Struktura URL:** `/api/v1/workout-plans/:id/exercises/:planExerciseId`  
**Autentykacja:** Wymagana (Supabase Auth)  
**Content-Type:** N/A

**Parametry URL:**

- **Wymagane:**
  - `id` (integer): ID planu treningowego
  - `planExerciseId` (integer): ID plan_exercises

**Request Body:** Brak

## 3. Wykorzystywane typy

Z pliku `src/types.ts` (już zdefiniowane):

### DTOs (Data Transfer Objects)

```typescript
export type ScheduleType = "weekly" | "interval";

export type WorkoutPlanDTO = Omit<WorkoutPlanRow, "schedule_type"> & {
  schedule_type: ScheduleType;
};

export type PlanExerciseDTO = DbTables<"plan_exercises">;

export type PlanExerciseWithExerciseDTO = PlanExerciseDTO & {
  exercise: ExerciseDTO;
};

export type WorkoutPlanDetailDTO = WorkoutPlanDTO & {
  exercises: PlanExerciseWithExerciseDTO[];
};
```

### Command Models

```typescript
export type PlanExerciseCreateInput = Omit<
  DbInsert<"plan_exercises">,
  "id" | "workout_plan_id" | "created_at" | "updated_at"
>;

export interface WorkoutPlanCreateCommand {
  name: string;
  schedule_type: ScheduleType;
  schedule_days: number[] | null;
  schedule_interval_days: number | null;
  exercises: PlanExerciseCreateInput[];
}

export type WorkoutPlanUpdateCommand = Partial<{
  name: string;
  schedule_type: ScheduleType;
  schedule_days: number[] | null;
  schedule_interval_days: number | null;
  is_active: boolean;
}>;

export interface PlanExercisesBulkReplaceCommand {
  exercises: PlanExerciseCreateInput[];
}

export type PlanExercisePatchCommand = Partial<{
  order_index: number;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
  notes: string | null;
}>;

export type EmptyPayload = Record<never, never>;
export type WorkoutPlanActivateCommand = EmptyPayload;
```

### Query Models

```typescript
export type WorkoutPlansListQuery = PaginationParams & {
  is_active?: boolean;
};

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort?: string;
}
```

### Response Types

```typescript
export interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  page_size: number;
  last_page: number;
}

export type WorkoutPlansListResponse = PaginatedResponse<WorkoutPlanDTO>;
```

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/v1/workout-plans

**Sukces (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Push/Pull/Legs",
      "schedule_type": "weekly",
      "schedule_days": [1, 3, 5],
      "schedule_interval_days": null,
      "is_active": true,
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Full Body",
      "schedule_type": "interval",
      "schedule_days": null,
      "schedule_interval_days": 2,
      "is_active": false,
      "created_at": "2025-01-10T08:00:00.000Z",
      "updated_at": "2025-01-10T08:00:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 20,
  "last_page": 1
}
```

**Błąd - Brak autentykacji (401 Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 4.2 POST /api/v1/workout-plans

**Sukces (201 Created):**

```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Push/Pull/Legs",
  "schedule_type": "weekly",
  "schedule_days": [1, 3, 5],
  "schedule_interval_days": null,
  "is_active": true,
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
      "field": "exercises",
      "message": "Array must contain at least 1 element(s)"
    },
    {
      "field": "schedule_days",
      "message": "Schedule days are required when schedule_type is 'weekly'"
    }
  ]
}
```

**Błąd - Nieprawidłowy exercise_id (409 Conflict):**

```json
{
  "error": "Conflict",
  "message": "One or more exercise IDs do not exist"
}
```

**Błąd - Duplikat order_index (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "exercises",
      "message": "Duplicate order_index values found. Each exercise must have a unique order_index."
    }
  ]
}
```

### 4.3 GET /api/v1/workout-plans/:id

**Sukces (200 OK):**

```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Push/Pull/Legs",
  "schedule_type": "weekly",
  "schedule_days": [1, 3, 5],
  "schedule_interval_days": null,
  "is_active": true,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "exercises": [
    {
      "id": 100,
      "workout_plan_id": 1,
      "exercise_id": 42,
      "order_index": 0,
      "target_sets": 4,
      "target_reps": 8,
      "rest_seconds": 120,
      "notes": "Pause reps",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z",
      "exercise": {
        "id": 42,
        "name": "Bench Press",
        "exercise_type": "compound",
        "muscle_group_id": 1,
        "muscle_subgroup_id": 2,
        "is_active": true,
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

**Błąd - Plan nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Workout plan not found"
}
```

**Błąd - Dostęp do cudzego planu (403 Forbidden):**

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this workout plan"
}
```

### 4.4 PATCH /api/v1/workout-plans/:id

**Sukces (200 OK):**

```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Plan Name",
  "schedule_type": "weekly",
  "schedule_days": [1, 3, 5],
  "schedule_interval_days": null,
  "is_active": false,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T14:45:00.000Z"
}
```

**Błąd - Pusty body (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Request body must contain at least one field to update"
}
```

**Błąd - Nieprawidłowy harmonogram (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "schedule_days",
      "message": "Schedule days are required when schedule_type is 'weekly'"
    }
  ]
}
```

### 4.5 DELETE /api/v1/workout-plans/:id

**Sukces (204 No Content):**

Brak body w odpowiedzi.

**Błąd - Plan nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Workout plan not found"
}
```

**Błąd - Plan używany w sesjach (409 Conflict):**

```json
{
  "error": "Conflict",
  "message": "Cannot delete workout plan that has been used in workout sessions"
}
```

### 4.6 POST /api/v1/workout-plans/:id/activate

**Sukces (200 OK):**

```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Push/Pull/Legs",
  "schedule_type": "weekly",
  "schedule_days": [1, 3, 5],
  "schedule_interval_days": null,
  "is_active": true,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T14:45:00.000Z"
}
```

**Błąd - Plan nie istnieje (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Workout plan not found"
}
```

### 4.7 POST /api/v1/workout-plans/:id/exercises

**Sukces (200 OK):**

Zwraca pełny WorkoutPlanDetailDTO (plan z nowymi ćwiczeniami):

```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Push/Pull/Legs",
  "schedule_type": "weekly",
  "schedule_days": [1, 3, 5],
  "schedule_interval_days": null,
  "is_active": true,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T14:45:00.000Z",
  "exercises": [
    {
      "id": 101,
      "workout_plan_id": 1,
      "exercise_id": 10,
      "order_index": 0,
      "target_sets": 3,
      "target_reps": 10,
      "rest_seconds": 60,
      "notes": null,
      "created_at": "2025-01-15T14:45:00.000Z",
      "updated_at": "2025-01-15T14:45:00.000Z",
      "exercise": {
        "id": 10,
        "name": "Squat",
        "exercise_type": "compound",
        "muscle_group_id": 2,
        "muscle_subgroup_id": 5,
        "is_active": true,
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

**Błąd - Pusta lista ćwiczeń (400 Bad Request):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "exercises",
      "message": "Array must contain at least 1 element(s)"
    }
  ]
}
```

### 4.8 PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId

**Sukces (200 OK):**

```json
{
  "id": 100,
  "workout_plan_id": 1,
  "exercise_id": 42,
  "order_index": 0,
  "target_sets": 5,
  "target_reps": 8,
  "rest_seconds": 150,
  "notes": "Pause reps",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T14:50:00.000Z"
}
```

**Błąd - Ćwiczenie nie należy do planu (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Exercise not found in this workout plan"
}
```

### 4.9 DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId

**Sukces (204 No Content):**

Brak body w odpowiedzi.

**Błąd - Ostatnie ćwiczenie w planie (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Cannot delete the last exercise from a workout plan. A plan must have at least one exercise."
}
```

**Błąd - Ćwiczenie użyte w sesji (409 Conflict):**

```json
{
  "error": "Conflict",
  "message": "Cannot delete exercise that has been used in workout sessions"
}
```

## 5. Przepływ danych

### 5.1 GET /api/v1/workout-plans (List)

```
1. Request → Astro API Endpoint (/api/v1/workout-plans/index.ts)
2. Sprawdzenie autentykacji (checkAuth)
3. Parsowanie query params (is_active, page, page_size, sort)
4. Wywołanie WorkoutPlanService.listPlans(userId, query)
5. Query do Supabase:
   - SELECT * FROM workout_plans WHERE user_id = userId
   - Filtrowanie po is_active (jeśli podane)
   - Paginacja (LIMIT, OFFSET)
   - Sortowanie
   - COUNT(*) dla total
6. Mapowanie DB rows → WorkoutPlanDTO[]
7. Budowa PaginatedResponse
8. Response (200) z danymi
```

### 5.2 POST /api/v1/workout-plans (Create)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie i walidacja Request Body przez Zod Schema
   - Walidacja schedule_type i warunkowych pól
   - Walidacja exercises array (≥1 element)
4. Wywołanie WorkoutPlanService.createPlan(userId, command)
5. Rozpoczęcie transakcji Supabase
6. INSERT do workout_plans:
   - user_id, name, schedule_type, schedule_days/schedule_interval_days
   - Zwraca workout_plan_id
7. Batch INSERT do plan_exercises:
   - workout_plan_id, exercise_id, order_index, target_sets, target_reps, rest_seconds, notes
   - Supabase sprawdza foreign key constraint (exercise_id)
8. Commit transakcji
9. Mapowanie created plan → WorkoutPlanDTO
10. Response (201) z WorkoutPlanDTO
```

### 5.3 GET /api/v1/workout-plans/:id (Detail)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId z URL params
4. Wywołanie WorkoutPlanService.getPlanById(planId, userId)
5. Query do Supabase (single query with join):
   SELECT workout_plans.*,
          plan_exercises.*,
          exercises.*
   FROM workout_plans
   LEFT JOIN plan_exercises ON plan_exercises.workout_plan_id = workout_plans.id
   LEFT JOIN exercises ON exercises.id = plan_exercises.exercise_id
   WHERE workout_plans.id = planId
6. Weryfikacja ownership (workout_plans.user_id == userId)
7. Mapowanie do WorkoutPlanDetailDTO (z exercises: PlanExerciseWithExerciseDTO[])
8. Response (200) z WorkoutPlanDetailDTO lub (404)/(403)
```

### 5.4 PATCH /api/v1/workout-plans/:id (Update)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId z URL params
4. Parsowanie i walidacja Request Body (partial)
5. Guard: pusty body → 400
6. Weryfikacja ownership (WorkoutPlanService.verifyPlanOwnership)
7. Wywołanie WorkoutPlanService.updatePlan(planId, userId, command)
8. UPDATE w Supabase workout_plans:
   - SET fields FROM command WHERE id = planId AND user_id = userId
9. Mapowanie updated row → WorkoutPlanDTO
10. Response (200) z WorkoutPlanDTO lub (404)
```

### 5.5 DELETE /api/v1/workout-plans/:id

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId z URL params
4. Weryfikacja ownership
5. Wywołanie WorkoutPlanService.deletePlan(planId, userId)
6. DELETE z Supabase:
   - DELETE FROM workout_plans WHERE id = planId AND user_id = userId
   - Cascade delete usuwa również plan_exercises (ON DELETE CASCADE)
   - UWAGA: Jeśli plan_exercises są używane w session_sets (ON DELETE RESTRICT),
     operacja zakończy się błędem foreign key (23503)
7. Catch foreign key error → 409 "Cannot delete workout plan that has been used in workout sessions"
8. Response (204) lub (404) lub (409)
```

### 5.6 POST /api/v1/workout-plans/:id/activate

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId z URL params
4. Weryfikacja ownership
5. Wywołanie WorkoutPlanService.activatePlan(planId, userId)
6. Rozpoczęcie transakcji Supabase
7. UPDATE workout_plans SET is_active = false
   WHERE user_id = userId AND id != planId
8. UPDATE workout_plans SET is_active = true
   WHERE id = planId AND user_id = userId
9. Commit transakcji
10. Pobranie zaktualizowanego planu
11. Response (200) z WorkoutPlanDTO lub (404)
```

### 5.7 POST /api/v1/workout-plans/:id/exercises (Bulk Replace)

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId z URL params
4. Parsowanie i walidacja Request Body (exercises array)
5. Weryfikacja ownership
6. Wywołanie WorkoutPlanService.replaceExercises(planId, userId, exercises)
7. Rozpoczęcie transakcji Supabase
8. DELETE FROM plan_exercises WHERE workout_plan_id = planId
9. Batch INSERT nowych exercises do plan_exercises
10. Commit transakcji
11. Pobranie pełnego planu z ćwiczeniami (getPlanById)
12. Response (200) z WorkoutPlanDetailDTO
```

### 5.8 PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId i planExerciseId z URL params
4. Parsowanie i walidacja Request Body (partial)
5. Guard: pusty body → 400
6. Wywołanie WorkoutPlanService.updateExercise(planExerciseId, userId, data)
7. Weryfikacja że plan_exercise należy do planu użytkownika:
   - JOIN plan_exercises z workout_plans
   - WHERE plan_exercises.id = planExerciseId
   - AND workout_plans.user_id = userId
8. UPDATE plan_exercises SET fields WHERE id = planExerciseId
9. Response (200) z PlanExerciseDTO lub (404)/(403)
```

### 5.9 DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId

```
1. Request → Astro API Endpoint
2. Sprawdzenie autentykacji
3. Parsowanie planId i planExerciseId z URL params
4. Wywołanie WorkoutPlanService.deleteExercise(planExerciseId, userId)
5. Sprawdzenie liczby ćwiczeń w planie:
   - COUNT(*) FROM plan_exercises WHERE workout_plan_id = planId
   - Jeśli count == 1 → 400 (nie można usunąć ostatniego)
6. Weryfikacja ownership przez JOIN
7. DELETE FROM plan_exercises WHERE id = planExerciseId
   - UWAGA: Jeśli plan_exercise jest używany w session_sets (ON DELETE RESTRICT),
     operacja zakończy się błędem foreign key (23503)
8. Catch foreign key error → 409 "Cannot delete exercise that has been used in workout sessions"
9. Response (204) lub (404)/(400)/(409)
```

### Interakcje z zewnętrznymi usługami:

**Supabase:**

- Autentykacja użytkownika przez Supabase Auth
- Operacje CRUD na tabelach `workout_plans` i `plan_exercises`
- Wykorzystanie JOIN do pobierania powiązanych danych (exercises)
- Transakcje dla operacji atomowych (create, activate, bulk replace)
- **Foreign key constraints:**
  - exercise_id → exercises(id) ON DELETE RESTRICT: Sprawdza czy ćwiczenie istnieje
  - workout_plan_id → workout_plans(id) ON DELETE CASCADE: Cascade delete plan_exercises
  - plan_exercise_id ← session_sets ON DELETE RESTRICT: Blokuje usunięcie plan_exercise używanego w sesjach
- **Unique constraint:** (workout_plan_id, order_index) zapewnia unikalność kolejności
- Triggery `update_updated_at_column` dla automatycznej aktualizacji `updated_at`
- RLS policies dla bezpieczeństwa dostępu do danych

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Wymagana autentykacja**: Wszystkie endpointy wymagają zalogowanego użytkownika
- **Implementacja**: Sprawdzenie `context.locals.user` w każdym endpoincie
- **Kod błędu**: 401 Unauthorized gdy brak autentykacji

### 6.2 Autoryzacja

- **Izolacja danych**: Użytkownik może zarządzać tylko własnymi planami
- **Implementacja**:
  - Wszystkie query zawierają warunek `WHERE user_id = userId`
  - Metoda `verifyPlanOwnership()` sprawdza czy plan należy do użytkownika
  - Weryfikacja przed każdą operacją modyfikacji (UPDATE, DELETE)
- **Kod błędu**: 403 Forbidden gdy próba dostępu do cudzego planu
- **Ochrona**: Brak możliwości modyfikacji planów innych użytkowników przez parametry URL

### 6.3 Walidacja danych wejściowych

- **Schemat Zod**: Walidacja wszystkich danych przed zapisem do bazy
- **Constraints**:
  - `name`: string, max 200 znaków, required, trim
  - `schedule_type`: enum "weekly" | "interval", required
  - `schedule_days`: integer array, values 1-7, required gdy weekly
  - `schedule_interval_days`: integer > 0, required gdy interval
  - `exercises`: array, min length 1
  - Per exercise:
    - `exercise_id`: positive integer, required
    - `order_index`: integer ≥ 0, required
    - `target_sets`: integer > 0, required
    - `target_reps`: integer > 0, required
    - `rest_seconds`: integer ≥ 0, required
    - `notes`: string, optional
- **Warunkowa walidacja**:
  - Jeśli `schedule_type = "weekly"`: `schedule_days` required, `schedule_interval_days` must be null
  - Jeśli `schedule_type = "interval"`: `schedule_interval_days` required, `schedule_days` must be null
- **Walidacja unikalności order_index**:
  - W ramach jednego array `exercises` wszystkie `order_index` muszą być unikalne (custom Zod refinement)
  - Naruszenie powoduje błąd walidacji 400
  - Baza danych ma UNIQUE constraint na (workout_plan_id, order_index)
- **Ochrona przed injection**: Supabase client automatycznie sanityzuje zapytania
- **Foreign key validation**:
  - Baza danych sprawdza czy exercise_id istnieje (ON DELETE RESTRICT)
  - Baza danych sprawdza czy plan_exercise jest używany w session_sets (ON DELETE RESTRICT)

### 6.4 Sanityzacja danych

- **Tekstowe pola**: Trimowanie białych znaków (name, notes)
- **Ochrona przed XSS**: Dane są przechowywane jako plain text, frontend odpowiada za escapowanie przy wyświetlaniu
- **Numeryczne pola**: Walidacja typów i zakresów przez Zod

### 6.5 Ochrona przed race conditions

- **Transakcje**: Operacje atomowe (create z exercises, activate, bulk replace) wykonywane w transakcjach
- **Optimistic locking**: Można rozważyć dodanie version field dla advanced concurrency control

### 6.6 Input size limits

- **Request body size**: Ograniczenie rozmiaru body (np. max 1MB)
- **Arrays**: Ograniczenie max liczby ćwiczeń w planie (np. max 50)
- **Strings**: Max długość notes (np. 1000 znaków)

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Kod | Nazwa                 | Scenariusz                                                                               | Odpowiedź               |
| --- | --------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| 200 | OK                    | Pomyślne GET, PATCH, POST (activate, bulk replace)                                       | DTO                     |
| 201 | Created               | Pomyślne POST (create)                                                                   | WorkoutPlanDTO          |
| 204 | No Content            | Pomyślne DELETE                                                                          | Brak body               |
| 400 | Bad Request           | Nieprawidłowe dane (walidacja Zod), pusty body, ostatnie exercise, duplicate order_index | Error z details         |
| 401 | Unauthorized          | Brak autentykacji                                                                        | Error message           |
| 403 | Forbidden             | Dostęp do cudzego planu                                                                  | Error message           |
| 404 | Not Found             | Plan/exercise nie istnieje                                                               | Error message           |
| 409 | Conflict              | Foreign key violation (exercise_id, session_sets), unique constraint (order_index)       | Error message           |
| 500 | Internal Server Error | Błąd bazy danych lub nieoczekiwany błąd                                                  | Error message (generic) |

### 7.2 Szczegółowe scenariusze

**401 Unauthorized:**

- Trigger: Brak `context.locals.user` lub nieprawidłowy token
- Response: `{ "error": "Unauthorized", "message": "Authentication required" }`
- Logging: Brak (normalny przypadek)

**400 Bad Request - Walidacja:**

- Trigger: Nieprawidłowe dane (Zod validation fails)
- Response:

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "exercises",
      "message": "Array must contain at least 1 element(s)"
    },
    {
      "field": "schedule_days",
      "message": "Schedule days are required when schedule_type is 'weekly'"
    }
  ]
}
```

- Logging: `console.warn` z userId i validation errors

**400 Bad Request - Pusty body:**

- Trigger: PATCH endpoint z pustym body
- Response: `{ "error": "Bad Request", "message": "Request body must contain at least one field to update" }`

**400 Bad Request - Ostatnie ćwiczenie:**

- Trigger: Próba usunięcia ostatniego ćwiczenia z planu
- Response: `{ "error": "Bad Request", "message": "Cannot delete the last exercise from a workout plan. A plan must have at least one exercise." }`

**403 Forbidden:**

- Trigger: Próba dostępu/modyfikacji planu innego użytkownika
- Response: `{ "error": "Forbidden", "message": "You do not have permission to access this workout plan" }`
- Logging: `console.warn` z userId, planId (potencjalne security issue)

**404 Not Found:**

- Trigger: Plan/exercise nie istnieje lub nie należy do użytkownika
- Response: `{ "error": "Not Found", "message": "Workout plan not found" }` lub `"Exercise not found in this workout plan"`
- Logging: Brak (normalny przypadek)

**409 Conflict - Foreign Key (exercise_id):**

- Trigger: Nieprawidłowy exercise_id (nie istnieje w tabeli exercises)
- Response: `{ "error": "Conflict", "message": "One or more exercise IDs do not exist" }`
- Logging: `console.warn` z userId i invalid exercise_ids
- Postgres error code: 23503 (foreign_key_violation)

**409 Conflict - Foreign Key (plan_exercise w użyciu):**

- Trigger: Próba usunięcia plan_exercise używanego w session_sets (ON DELETE RESTRICT)
- Response: `{ "error": "Conflict", "message": "Cannot delete exercise that has been used in workout sessions" }`
- Logging: `console.warn` z userId, planId, planExerciseId
- Postgres error code: 23503 (foreign_key_violation)

**409 Conflict - Unique Constraint (duplicate order_index):**

- Trigger: Duplikat order_index w ramach tego samego workout_plan_id
- Response: `{ "error": "Conflict", "message": "Duplicate exercise order in the workout plan" }`
- Logging: `console.warn` z userId, planId, order_index
- Postgres error code: 23505 (unique_violation)
- Constraint: plan_exercises_workout_plan_id_order_index_key

**500 Internal Server Error:**

- Trigger: Błąd bazy danych, niespodziewany wyjątek, błąd transakcji
- Response: `{ "error": "Internal Server Error", "message": "An unexpected error occurred" }`
- Logging: `console.error` z pełnym stack trace

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
console.error("[WorkoutPlanAPI] Unexpected error:", {
  endpoint: "POST /api/v1/workout-plans",
  userId: user.id,
  error: error.message,
  stack: error.stack,
});

// Błędy 400/409 - podstawowe logowanie
console.warn("[WorkoutPlanAPI] Validation error:", {
  endpoint: "POST /api/v1/workout-plans",
  userId: user.id,
  errors: zodError.errors,
});

// Błędy 403 - security warning
console.warn("[WorkoutPlanAPI] Unauthorized access attempt:", {
  endpoint: "GET /api/v1/workout-plans/:id",
  userId: user.id,
  planId: planId,
});
```

### 7.5 Obsługa błędów transakcji

Dla operacji transakcyjnych (create, activate, bulk replace):

- Rollback transakcji przy jakimkolwiek błędzie
- Retry logic dla transient errors (np. deadlock)
- Szczegółowe logowanie błędów transakcji

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **Listowanie planów (GET /api/v1/workout-plans):**
   - Query po user_id z filtrowaniem i paginacją
   - Potencjalnie dużo planów na użytkownika
   - Mitygacja: Indeks na (user_id, is_active, created_at)

2. **Pobieranie szczegółów planu (GET /api/v1/workout-plans/:id):**
   - JOIN między workout_plans, plan_exercises i exercises
   - Potencjalnie wiele ćwiczeń (np. 10-30 per plan)
   - Mitygacja: Single query z eager loading zamiast N+1 queries

3. **Tworzenie planu (POST /api/v1/workout-plans):**
   - Transakcja z INSERT do 2 tabel
   - Batch insert do plan_exercises (multiple rows)
   - Weryfikacja foreign keys
   - Mitygacja: Batch insert zamiast individual inserts

4. **Aktywacja planu (POST /api/v1/workout-plans/:id/activate):**
   - Update wielu wierszy (wszystkie plany użytkownika)
   - Transakcja z 2 UPDATE statements
   - Mitygacja: Indeks na (user_id, is_active)

5. **Masowa zamiana ćwiczeń (POST /api/v1/workout-plans/:id/exercises):**
   - DELETE wszystkich exercises + batch INSERT nowych
   - Transakcja może być długa dla dużych planów
   - Mitygacja: Limit max liczby exercises, batch operations

6. **Connection pooling:**
   - Wiele concurrent requests do Supabase
   - Mitygacja: Supabase automatycznie zarządza connection pool

### 8.2 Strategie optymalizacji

#### 8.2.1 Indeksy bazy danych

**Wymagane indeksy:**

```sql
-- Indeks na workout_plans dla list queries
CREATE INDEX idx_workout_plans_user_id_is_active
ON workout_plans(user_id, is_active);

-- Indeks na workout_plans dla sortowania po created_at
CREATE INDEX idx_workout_plans_created_at
ON workout_plans(created_at DESC);

-- Indeks na plan_exercises dla joins
CREATE INDEX idx_plan_exercises_workout_plan_id
ON plan_exercises(workout_plan_id);

-- Indeks na plan_exercises dla exercise lookup
CREATE INDEX idx_plan_exercises_exercise_id
ON plan_exercises(exercise_id);
```

**Uwaga:** UNIQUE constraint `UNIQUE(workout_plan_id, order_index)` na tabeli plan_exercises automatycznie tworzy indeks, który obsługuje:

- Sprawdzanie unikalności order_index w ramach planu
- Efektywne queries po (workout_plan_id, order_index)
- Ownership verification przy operacjach na pojedynczych exercises

Dzięki temu nie jest potrzebny dodatkowy `idx_plan_exercises_plan_order` - jest już obsłużony przez constraint.

#### 8.2.2 Query optimization

**Eager loading dla detail:**

```typescript
// Single query zamiast N+1
const { data } = await supabase
  .from("workout_plans")
  .select(
    `
    *,
    plan_exercises (
      *,
      exercises (*)
    )
  `
  )
  .eq("id", planId)
  .single();
```

**Pagination dla list:**

```typescript
const pageSize = Math.min(query.page_size || 20, 100); // max 100
const offset = (page - 1) * pageSize;

const { data, count } = await supabase
  .from("workout_plans")
  .select("*", { count: "exact" })
  .eq("user_id", userId)
  .range(offset, offset + pageSize - 1);
```

**Efficient counting:**

- Supabase `count: "exact"` może być kosztowne
- Rozważyć `count: "estimated"` dla dużych tabel
- Lub cache count w separate table/column

#### 8.2.3 Caching

**Client-side caching:**

- Cache active plan w React Context/Zustand
- TTL: 15 minut lub invalidacja po modyfikacji
- Cache list of plans (short TTL: 5 minut)

**Server-side caching (opcjonalnie):**

- Redis cache dla active planu użytkownika
- Key: `workout_plan:active:{userId}`
- TTL: 10 minut
- Invalidacja po każdej operacji modyfikacji

**Query result caching:**

- Supabase PostgREST automatically caches some queries
- Use `Prefer: return=minimal` header for faster writes

#### 8.2.4 Batch operations

**Bulk insert dla exercises:**

```typescript
// Zamiast multiple pojedynczych inserts
await supabase.from("plan_exercises").insert(exercises); // batch
```

**Batch operations w transakcjach:**

- Użycie Supabase RPC functions dla complex atomic operations
- Zmniejsza round-trips do bazy

#### 8.2.5 Connection pooling

- Używanie jednego `context.locals.supabase` instance
- Nie tworzyć nowych klientów w każdym service method
- Supabase automatycznie zarządza connection pool

#### 8.2.6 Response compression

- Astro automatycznie kompresuje odpowiedzi (gzip/brotli)
- Dla list responses kompresja może znacząco zmniejszyć transfer size

#### 8.2.7 Limits i constraints

**Business limits:**

- Max 50 ćwiczeń per plan (reasonable limit)
- Max 100 planów per użytkownik (soft limit)
- Max 1000 znaków w notes field

**Technical limits:**

- Request body size: 1MB
- Query timeout: 30 seconds
- Transaction timeout: 10 seconds

### 8.3 Monitoring

**Metryki do monitorowania:**

1. **Response time metrics:**
   - p50, p95, p99 per endpoint
   - Alerty dla p95 > 500ms lub p99 > 1s

2. **Database query performance:**
   - Slow query log (queries > 100ms)
   - Query execution plans (EXPLAIN ANALYZE)
   - Index usage statistics

3. **Error rates:**
   - 5xx errors per endpoint (alert if > 1%)
   - 4xx errors (track trends)
   - Transaction rollback rate

4. **Business metrics:**
   - Number of active plans per user (percentiles)
   - Average exercises per plan
   - Most popular exercises

5. **Resource utilization:**
   - Database connection pool usage
   - Memory usage
   - CPU usage

**Monitoring tools:**

- Supabase dashboard (built-in metrics)
- Application logs (structured JSON logs)
- APM tools (optional: Sentry, New Relic)

### 8.4 Relacje z innymi tabelami

**Relacje plan_exercises:**

1. **workout_plans → plan_exercises (1:N)**
   - Relacja: `plan_exercises.workout_plan_id` → `workout_plans(id)`
   - ON DELETE CASCADE: Usunięcie planu automatycznie usuwa wszystkie jego ćwiczenia
   - RLS: Dostęp do plan_exercises wymaga ownership workout_plan

2. **exercises → plan_exercises (1:N)**
   - Relacja: `plan_exercises.exercise_id` → `exercises(id)`
   - ON DELETE RESTRICT: Nie można usunąć ćwiczenia z biblioteki jeśli jest używane w planach
   - Wymaga najpierw usunięcia wszystkich plan_exercises używających tego exercise
   - Kod błędu: 23503 (foreign_key_violation)

3. **plan_exercises → session_sets (1:N)**
   - Relacja: `session_sets.plan_exercise_id` → `plan_exercises(id)`
   - ON DELETE RESTRICT: Nie można usunąć plan_exercise jeśli jest używany w sesjach
   - Wpływa na DELETE /exercises/:planExerciseId endpoint
   - Kod błędu: 23503 (foreign_key_violation)
   - Message: "Cannot delete exercise that has been used in workout sessions"

**Unique constraints:**

1. **UNIQUE(workout_plan_id, order_index)**
   - Zapewnia unikalność kolejności ćwiczeń w planie
   - Automatycznie tworzy indeks
   - Walidowane także po stronie aplikacji (Zod schema)
   - Kod błędu: 23505 (unique_violation)

**Cascade effects:**

Usunięcie workout_plan → CASCADE:

- Automatycznie usuwa wszystkie plan_exercises
- **NIE** usuwa powiązanych session_sets (session_sets → plan_exercises ON DELETE RESTRICT)
- Jeśli jakieś plan_exercises są używane w session_sets, usunięcie workout_plan zakończy się błędem foreign key

Rozwiązanie: Przed usunięciem planu należy sprawdzić czy nie ma aktywnych sesji. W przyszłości można rozważyć:

- Soft delete dla workout_plans (kolumna deleted_at)
- Lub zmiana ON DELETE RESTRICT na ON DELETE SET NULL dla session_sets.plan_exercise_id

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury projektu

**Zadania:**

- Struktura katalogów już istnieje (utworzona przy implementacji profile endpoint)
- Weryfikacja że foldery istnieją: `src/lib/services/`, `src/lib/validation/`, `src/pages/api/v1/`

### Krok 2: Implementacja warstwy walidacji

**Plik:** `src/lib/validation/workout-plan.validation.ts`

**Zawartość:**

- `planExerciseInputSchema` - Walidacja pojedynczego ćwiczenia w planie
- `workoutPlanCreateSchema` - Full validation dla tworzenia planu
  - Warunkowa walidacja schedule (weekly vs interval)
  - Custom refinement dla sprawdzenia schedule_days/schedule_interval_days
  - Walidacja exercises array (min 1 element)
  - **Custom refinement dla unique order_index** - sprawdza czy w exercises array nie ma duplikatów order_index
- `workoutPlanUpdateSchema` - Partial validation dla PATCH
  - Opcjonalne pola
  - Zachowanie warunkowej walidacji schedule
- `planExercisesBulkReplaceSchema` - Walidacja bulk replace
  - **Custom refinement dla unique order_index**
- `planExercisePatchSchema` - Partial validation dla update exercise
- Export inference types

**Przykład walidacji schedule:**

```typescript
.superRefine((data, ctx) => {
  if (data.schedule_type === "weekly") {
    if (!data.schedule_days || data.schedule_days.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schedule days are required when schedule_type is 'weekly'",
        path: ["schedule_days"],
      });
    }
    if (data.schedule_interval_days !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schedule interval days must be null when schedule_type is 'weekly'",
        path: ["schedule_interval_days"],
      });
    }
  } else if (data.schedule_type === "interval") {
    // Similar validation for interval
  }
})
```

**Przykład walidacji unique order_index:**

```typescript
.superRefine((data, ctx) => {
  // Sprawdzenie unikalności order_index w exercises array
  const orderIndexes = data.exercises.map(ex => ex.order_index);
  const duplicates = orderIndexes.filter((item, index) => orderIndexes.indexOf(item) !== index);

  if (duplicates.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Duplicate order_index values found. Each exercise must have a unique order_index.",
      path: ["exercises"],
    });
  }
})
```

### Krok 3: Implementacja serwisu WorkoutPlanService

**Plik:** `src/lib/services/workout-plan.service.ts`

**Klasa:** `WorkoutPlanService`

**Constructor:** `constructor(private supabase: SupabaseClient) {}`

**Metody:**

1. **`listPlans(userId: UUID, query: WorkoutPlansListQuery): Promise<WorkoutPlansListResponse>`**
   - Buduje query z filtrowaniem (is_active)
   - Implementuje paginację (page, page_size)
   - Implementuje sortowanie (default: -created_at)
   - Wykonuje COUNT dla total
   - Oblicza last_page
   - Zwraca PaginatedResponse

2. **`createPlan(userId: UUID, command: WorkoutPlanCreateCommand): Promise<WorkoutPlanDTO>`**
   - Rozpoczyna transakcję (jeśli Supabase supports, lub manual rollback)
   - INSERT do workout_plans (zwraca plan.id)
   - Batch INSERT do plan_exercises z workout_plan_id
   - Catch foreign key error (invalid exercise_id) → throw "One or more exercise IDs do not exist"
   - Commit transakcji
   - Return created plan

3. **`getPlanById(planId: number, userId: UUID): Promise<WorkoutPlanDetailDTO | null>`**
   - Single query z nested select (eager loading)
   - Weryfikacja ownership (user_id = userId)
   - Return null jeśli nie istnieje lub nie należy do użytkownika
   - Mapowanie do WorkoutPlanDetailDTO

4. **`updatePlan(planId: number, userId: UUID, command: WorkoutPlanUpdateCommand): Promise<WorkoutPlanDTO | null>`**
   - UPDATE workout_plans WHERE id = planId AND user_id = userId
   - Return updated plan lub null jeśli nie znaleziono

5. **`deletePlan(planId: number, userId: UUID): Promise<boolean>`**
   - DELETE FROM workout_plans WHERE id = planId AND user_id = userId
   - Return true jeśli deleted, false jeśli nie znaleziono
   - Cascade delete plan_exercises (automatyczne przez DB)
   - **Obsługa foreign key error:** Jeśli plan_exercises są używane w session_sets (ON DELETE RESTRICT) → throw error "Cannot delete workout plan that has been used in workout sessions"

6. **`activatePlan(planId: number, userId: UUID): Promise<WorkoutPlanDTO | null>`**
   - Rozpoczyna transakcję
   - UPDATE workout_plans SET is_active = false WHERE user_id = userId AND id != planId
   - UPDATE workout_plans SET is_active = true WHERE id = planId AND user_id = userId
   - Commit transakcji
   - Fetch i return updated plan

7. **`replaceExercises(planId: number, userId: UUID, exercises: PlanExerciseCreateInput[]): Promise<WorkoutPlanDetailDTO | null>`**
   - Weryfikacja ownership (verifyPlanOwnership)
   - Rozpoczyna transakcję
   - DELETE FROM plan_exercises WHERE workout_plan_id = planId
   - Batch INSERT nowych exercises
   - Commit transakcji
   - Fetch i return pełny plan (getPlanById)

8. **`updateExercise(planExerciseId: number, userId: UUID, data: PlanExercisePatchCommand): Promise<PlanExerciseDTO | null>`**
   - UPDATE plan_exercises z JOIN do workout_plans dla ownership verification
   - WHERE plan_exercises.id = planExerciseId AND workout_plans.user_id = userId
   - Return updated exercise lub null

9. **`deleteExercise(planExerciseId: number, planId: number, userId: UUID): Promise<boolean>`**
   - Sprawdzenie liczby exercises: COUNT(\*) FROM plan_exercises WHERE workout_plan_id = planId
   - Jeśli count == 1 → throw error "Cannot delete last exercise"
   - DELETE z ownership verification (JOIN)
   - **Obsługa foreign key error:** Jeśli plan_exercise jest używany w session_sets (ON DELETE RESTRICT) → throw error "Cannot delete exercise that has been used in workout sessions"
   - Return true/false

10. **`verifyPlanOwnership(planId: number, userId: UUID): Promise<boolean>`** (helper)
    - SELECT user_id FROM workout_plans WHERE id = planId
    - Return true jeśli user_id == userId

**Error handling w service:**

- Supabase error codes: PGRST116 (not found), 23503 (foreign key violation), 23505 (unique violation)
- Throw descriptive errors dla business logic violations
- Let database errors bubble up (będą obsłużone w endpoint)

### Krok 4: Rozszerzenie API helpers (jeśli potrzebne)

**Plik:** `src/lib/api-helpers.ts`

**Potencjalne nowe funkcje:**

- `parseIntParam(param: string | undefined, name: string): number` - Parse i validate URL param jako integer
- `parsePaginationParams(url: URL): PaginationParams` - Parse pagination z query string
- Istniejące funkcje są wystarczające dla większości przypadków

### Krok 5: Implementacja endpointu głównego zasobu - GET list

**Plik:** `src/pages/api/v1/workout-plans/index.ts`

**Handler:** `export const GET: APIRoute`

**Logika:**

1. `export const prerender = false`
2. Check auth → 401 jeśli brak
3. Parse query params (is_active, page, page_size, sort)
4. Validate i sanitize params
5. Initialize `WorkoutPlanService`
6. Call `listPlans(userId, query)`
7. Return 200 z PaginatedResponse
8. Catch errors → 500

### Krok 6: Implementacja endpointu głównego zasobu - POST create

**Plik:** `src/pages/api/v1/workout-plans/index.ts` (ten sam plik)

**Handler:** `export const POST: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse request body
3. Validate przez `workoutPlanCreateSchema`
4. Handle ZodError → 400 z details
5. Initialize service
6. Call `createPlan(userId, command)`
7. Catch foreign key error → 409 "One or more exercise IDs do not exist"
8. Return 201 z WorkoutPlanDTO
9. Catch errors → 500

### Krok 7: Implementacja endpointu szczegółów - GET detail

**Plik:** `src/pages/api/v1/workout-plans/[id].ts`

**Handler:** `export const GET: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` z `context.params.id`
3. Validate id jest liczbą → 400
4. Initialize service
5. Call `getPlanById(planId, userId)`
6. If null → check if plan exists but belongs to another user → 403 vs 404
   - Można sprawdzić przez separate query bez user_id filter
   - Jeśli exists → 403, jeśli nie → 404
7. Return 200 z WorkoutPlanDetailDTO
8. Catch errors → 500

### Krok 8: Implementacja endpointu szczegółów - PATCH update

**Plik:** `src/pages/api/v1/workout-plans/[id].ts` (ten sam)

**Handler:** `export const PATCH: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` z params
3. Parse request body
4. Guard: pusty body → 400
5. Validate przez `workoutPlanUpdateSchema` (partial)
6. Handle ZodError → 400
7. Initialize service
8. Call `updatePlan(planId, userId, command)`
9. If null → 404 (or 403 if exists for another user)
10. Return 200 z updated WorkoutPlanDTO
11. Catch errors → 500

### Krok 9: Implementacja endpointu szczegółów - DELETE

**Plik:** `src/pages/api/v1/workout-plans/[id].ts` (ten sam)

**Handler:** `export const DELETE: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` z params
3. Initialize service
4. Call `deletePlan(planId, userId)`
5. **Catch foreign key error (23503)** "Cannot delete workout plan that has been used in workout sessions" → 409
6. If false → 404
7. Return 204 No Content (empty response)
8. Catch errors → 500

### Krok 10: Implementacja endpointu activate

**Plik:** `src/pages/api/v1/workout-plans/[id]/activate.ts`

**Handler:** `export const POST: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` z params
3. Parse request body (może być puste)
4. Initialize service
5. Call `activatePlan(planId, userId)`
6. If null → 404
7. Return 200 z activated WorkoutPlanDTO
8. Catch errors → 500

### Krok 11: Implementacja sub-resource - POST bulk replace exercises

**Plik:** `src/pages/api/v1/workout-plans/[id]/exercises/index.ts`

**Handler:** `export const POST: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` z params
3. Parse request body
4. Validate przez `planExercisesBulkReplaceSchema`
5. Handle ZodError → 400
6. Initialize service
7. Verify plan ownership (może być w service)
8. If plan nie istnieje lub nie należy do użytkownika → 404/403
9. Call `replaceExercises(planId, userId, exercises)`
10. Catch foreign key error → 409
11. Return 200 z WorkoutPlanDetailDTO (pełny plan z nowymi exercises)
12. Catch errors → 500

### Krok 12: Implementacja sub-resource - PATCH update exercise

**Plik:** `src/pages/api/v1/workout-plans/[id]/exercises/[planExerciseId].ts`

**Handler:** `export const PATCH: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` i `planExerciseId` z params
3. Parse request body
4. Guard: pusty body → 400
5. Validate przez `planExercisePatchSchema` (partial)
6. Handle ZodError → 400
7. Initialize service
8. Call `updateExercise(planExerciseId, userId, data)`
9. If null → 404 "Exercise not found in this workout plan"
10. Return 200 z updated PlanExerciseDTO
11. Catch errors → 500

### Krok 13: Implementacja sub-resource - DELETE exercise

**Plik:** `src/pages/api/v1/workout-plans/[id]/exercises/[planExerciseId].ts` (ten sam)

**Handler:** `export const DELETE: APIRoute`

**Logika:**

1. Check auth → 401
2. Parse `id` i `planExerciseId` z params
3. Initialize service
4. Call `deleteExercise(planExerciseId, planId, userId)`
5. Catch business logic error "Cannot delete last exercise" → 400
6. **Catch foreign key error (23503)** "Cannot delete exercise that has been used in workout sessions" → 409
7. If false → 404
8. Return 204 No Content
9. Catch errors → 500

---
