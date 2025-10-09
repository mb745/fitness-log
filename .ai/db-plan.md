# Schemat bazy danych PostgreSQL - Fitness Log

## 1. Ta**Check constraint:** `CHECK (muscle_subgroup_id IS NULL OR EXISTS (SELECT 1 FROM muscle_subgroups WHERE id = muscle_subgroup_id AND muscle_group_id = exe### 3.5. Indeksy dla e### 3.7. Ind### 3.8. Indek### 3.10. Indeksy dla workout_sessions
```sql
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_plan_id ON workout_sessions(workout_plan_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX idx_workout_sessions_scheduled_for ON workout_sessions(scheduled_for);
CREATE INDEX idx_workout_sessions_user_scheduled ON workout_sessions(user_id, scheduled_for DESC);
CREATE INDEX idx_workout_sessions_user_status ON workout_sessions(user_id, status);
CREATE UNIQUE INDEX idx_workout_sessions_user_in_progress ON workout_sessions(user_id) WHERE status = 'in_progress';
```

### 3.11. Indeksy dla session_setsexercises
```sql
CREATE INDEX idx_plan_exercises_workout_plan_id ON plan_exercises(workout_plan_id);
CREATE INDEX idx_plan_exercises_exercise_id ON plan_exercises(exercise_id);
CREATE INDEX idx_plan_exercises_plan_order ON plan_exercises(workout_plan_id, order_index);
```

### 3.9. Indeksy dla workout_sessions workout_plans
```sql
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_workout_plans_user_active ON workout_plans(user_id, is_active) WHERE is_active = TRUE;
```

### 3.8. Indeksy dla plan_exercisess
```sql
CREATE INDEX idx_exercises_muscle_group_id ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_muscle_subgroup_id ON exercises(muscle_subgroup_id);
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_active ON exercises(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);
CREATE INDEX idx_exercises_group_subgroup ON exercises(muscle_group_id, muscle_subgroup_id);
```
*Uwaga: Indeks `idx_exercises_name_trgm` wymaga rozszerzenia `pg_trgm` dla efektywnego wyszukiwania pełnotekstowego.*

### 3.6. Indeksy dla workout_plansle_group_id))` - zapewnia, że podgrupa należy do wybranej grupy mięśniowej

### 1.5. workout_plansele

### 1.1. users
Rozszerza tabelę `auth.users` z Supabase Auth o dane profilowe użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika z Supabase Auth |
| weight_kg | DECIMAL(5,2) | NULL, CHECK (weight_kg > 0 AND weight_kg <= 500) | Waga użytkownika w kilogramach |
| height_cm | INTEGER | NULL, CHECK (height_cm >= 100 AND height_cm <= 250) | Wzrost użytkownika w centymetrach |
| gender | VARCHAR(20) | NULL | Płeć użytkownika |
| injuries_limitations | TEXT | NULL | Kontuzje i ograniczenia użytkownika |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia profilu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

### 1.2. muscle_groups
Statyczna tabela słownikowa dla grup mięśniowych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator grupy mięśniowej |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Nazwa grupy mięśniowej (np. "Klatka piersiowa", "Plecy") |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

### 1.3. muscle_subgroups
Statyczna tabela słownikowa dla podgrup mięśniowych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator podgrupy mięśniowej |
| muscle_group_id | INTEGER | NOT NULL, REFERENCES muscle_groups(id) ON DELETE CASCADE | Grupa mięśniowa nadrzędna |
| name | VARCHAR(100) | NOT NULL | Nazwa podgrupy mięśniowej (np. "górna", "środkowa", "dolna") |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

**Unique constraint:** `UNIQUE(muscle_group_id, name)` - zapewnia unikalność nazwy podgrupy w ramach grupy mięśniowej

### 1.4. exercises
Globalna biblioteka ćwiczeń zarządzana centralnie.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator ćwiczenia |
| name | VARCHAR(200) | NOT NULL | Nazwa ćwiczenia |
| slug | VARCHAR(200) | NOT NULL, UNIQUE | Slug dla URL |
| muscle_group_id | INTEGER | NOT NULL, REFERENCES muscle_groups(id) ON DELETE RESTRICT | Główna grupa mięśniowa |
| muscle_subgroup_id | INTEGER | NULL, REFERENCES muscle_subgroups(id) ON DELETE SET NULL | Podgrupa mięśniowa |
| exercise_type | VARCHAR(50) | NOT NULL, CHECK (exercise_type IN ('compound', 'isolation')) | Typ ćwiczenia: złożone lub izolowane |
| recommended_rep_range_min | INTEGER | NOT NULL, CHECK (recommended_rep_range_min > 0) | Minimalna zalecana liczba powtórzeń |
| recommended_rep_range_max | INTEGER | NOT NULL, CHECK (recommended_rep_range_max >= recommended_rep_range_min) | Maksymalna zalecana liczba powtórzeń |
| instructions | TEXT | NOT NULL | Instrukcje wykonania ćwiczenia |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Czy ćwiczenie jest aktywne w bibliotece |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

### 1.4. workout_plans
Plany treningowe stworzone przez użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator planu treningowego |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Właściciel planu |
| name | VARCHAR(200) | NOT NULL | Nazwa planu treningowego |
| schedule_type | VARCHAR(20) | NOT NULL, CHECK (schedule_type IN ('weekly', 'interval')) | Typ harmonogramu: dni tygodnia lub interwał |
| schedule_days | INTEGER[] | NULL, CHECK (schedule_type = 'weekly' AND array_length(schedule_days, 1) > 0) | Dni tygodnia (1-7, gdzie 1=poniedziałek) dla schedule_type='weekly' |
| schedule_interval_days | INTEGER | NULL, CHECK (schedule_type = 'interval' AND schedule_interval_days > 0) | Liczba dni interwału dla schedule_type='interval' |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Czy plan jest aktywny |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia planu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraint sprawdzający poprawność harmonogramu:**
```sql
CHECK (
  (schedule_type = 'weekly' AND schedule_days IS NOT NULL AND schedule_interval_days IS NULL) OR
  (schedule_type = 'interval' AND schedule_interval_days IS NOT NULL AND schedule_days IS NULL)
)
```

### 1.5. plan_exercises
Tabela łącząca plany treningowe z ćwiczeniami.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator rekordu |
| workout_plan_id | INTEGER | NOT NULL, REFERENCES workout_plans(id) ON DELETE CASCADE | Plan treningowy |
| exercise_id | INTEGER | NOT NULL, REFERENCES exercises(id) ON DELETE RESTRICT | Ćwiczenie z biblioteki |
| order_index | INTEGER | NOT NULL, CHECK (order_index >= 0) | Kolejność ćwiczenia w planie (0-indexed) |
| target_sets | INTEGER | NOT NULL, CHECK (target_sets > 0) | Planowana liczba serii |
| target_reps | INTEGER | NOT NULL, CHECK (target_reps > 0) | Planowana liczba powtórzeń |
| rest_seconds | INTEGER | NOT NULL, CHECK (rest_seconds >= 0) | Czas przerwy między seriami w sekundach |
| notes | TEXT | NULL | Dodatkowe notatki do ćwiczenia |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Unique constraint:** `UNIQUE(workout_plan_id, order_index)` - zapewnia unikalność kolejności w ramach planu

### 1.6. workout_sessions
Konkretne instancje treningów w kalendarzu użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator sesji treningowej |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Właściciel sesji |
| workout_plan_id | INTEGER | NOT NULL, REFERENCES workout_plans(id) ON DELETE RESTRICT | Plan treningowy |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'scheduled', CHECK (status IN ('scheduled', 'in_progress', 'completed', 'abandoned')) | Status sesji |
| scheduled_for | DATE | NOT NULL | Data zaplanowanego treningu |
| started_at | TIMESTAMP WITH TIME ZONE | NULL | Czas rozpoczęcia treningu |
| completed_at | TIMESTAMP WITH TIME ZONE | NULL | Czas zakończenia treningu |
| notes | TEXT | NULL | Notatki użytkownika do sesji |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Unique constraint:** `UNIQUE(user_id, status) WHERE status = 'in_progress'` - zapewnia, że użytkownik może mieć tylko jedną sesję w toku

**Check constraints:**
- `CHECK (status != 'in_progress' OR started_at IS NOT NULL)` - sesja w toku musi mieć czas rozpoczęcia
- `CHECK (status != 'completed' OR (started_at IS NOT NULL AND completed_at IS NOT NULL))` - sesja ukończona musi mieć czas rozpoczęcia i zakończenia
- `CHECK (completed_at IS NULL OR completed_at >= started_at)` - czas zakończenia nie może być wcześniejszy niż rozpoczęcia

### 1.7. session_sets
Szczegółowy zapis wykonanych serii w ramach sesji treningowej.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator rekordu serii |
| workout_session_id | INTEGER | NOT NULL, REFERENCES workout_sessions(id) ON DELETE CASCADE | Sesja treningowa |
| plan_exercise_id | INTEGER | NOT NULL, REFERENCES plan_exercises(id) ON DELETE RESTRICT | Ćwiczenie z planu |
| set_number | INTEGER | NOT NULL, CHECK (set_number > 0) | Numer serii (1-indexed) |
| target_reps | INTEGER | NOT NULL, CHECK (target_reps > 0) | Planowana liczba powtórzeń (snapshot z planu) |
| actual_reps | INTEGER | NULL, CHECK (actual_reps >= 0) | Faktyczna liczba wykonanych powtórzeń |
| weight_kg | DECIMAL(6,2) | NULL, CHECK (weight_kg >= 0) | Użyty ciężar w kilogramach |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'completed', 'skipped')) | Status wykonania serii |
| completed_at | TIMESTAMP WITH TIME ZONE | NULL | Czas zakończenia serii |
| notes | TEXT | NULL | Notatki do serii |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Unique constraint:** `UNIQUE(workout_session_id, plan_exercise_id, set_number)` - zapewnia unikalność numeru serii dla danego ćwiczenia w sesji

**Check constraint:** `CHECK (status != 'completed' OR (actual_reps IS NOT NULL AND completed_at IS NOT NULL))` - ukończona seria musi mieć zarejestrowane powtórzenia i czas

## 2. Relacje między tabelami

### 2.1. users ↔ auth.users (1:1)
- Jeden użytkownik w `auth.users` ma jeden rekord w `users`
- Relacja: `users.id` → `auth.users(id)`

### 2.2. users → workout_plans (1:N)
- Jeden użytkownik może mieć wiele planów treningowych
- Relacja: `workout_plans.user_id` → `users(id)`

### 2.3. users → workout_sessions (1:N)
- Jeden użytkownik może mieć wiele sesji treningowych
- Relacja: `workout_sessions.user_id` → `users(id)`

### 2.4. muscle_groups → muscle_subgroups (1:N)
- Jedna grupa mięśniowa może mieć wiele podgrup
- Relacja: `muscle_subgroups.muscle_group_id` → `muscle_groups(id)`

### 2.5. muscle_groups → exercises (1:N)
- Jedna grupa mięśniowa może być przypisana do wielu ćwiczeń
- Relacja: `exercises.muscle_group_id` → `muscle_groups(id)`

### 2.6. muscle_subgroups → exercises (1:N, opcjonalna)
- Jedna podgrupa mięśniowa może być przypisana do wielu ćwiczeń
- Relacja: `exercises.muscle_subgroup_id` → `muscle_subgroups(id)`
- Relacja opcjonalna - ćwiczenie może nie mieć przypisanej podgrupy

### 2.7. workout_plans ↔ exercises (N:M przez plan_exercises)
- Wiele planów może zawierać wiele ćwiczeń
- Tabela łącząca: `plan_exercises`
- Relacje:
  - `plan_exercises.workout_plan_id` → `workout_plans(id)`
  - `plan_exercises.exercise_id` → `exercises(id)`

### 2.8. workout_plans → workout_sessions (1:N)
- Jeden plan treningowy może generować wiele sesji treningowych
- Relacja: `workout_sessions.workout_plan_id` → `workout_plans(id)`

### 2.9. workout_sessions → session_sets (1:N)
- Jedna sesja treningowa zawiera wiele serii
- Relacja: `session_sets.workout_session_id` → `workout_sessions(id)`

### 2.10. plan_exercises → session_sets (1:N)
- Jedno ćwiczenie z planu może być wykonane w wielu seriach
- Relacja: `session_sets.plan_exercise_id` → `plan_exercises(id)`

## 3. Indeksy

### 3.1. Indeksy dla users
```sql
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 3.2. Indeksy dla muscle_groups
```sql
CREATE INDEX idx_muscle_groups_slug ON muscle_groups(slug);
```

### 3.3. Indeksy dla muscle_subgroups
```sql
CREATE INDEX idx_muscle_subgroups_muscle_group_id ON muscle_subgroups(muscle_group_id);
CREATE INDEX idx_muscle_subgroups_slug ON muscle_subgroups(slug);
```

### 3.4. Indeksy dla exercises
```sql
CREATE INDEX idx_exercises_muscle_group_id ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_active ON exercises(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);
```
*Uwaga: Indeks `idx_exercises_name_trgm` wymaga rozszerzenia `pg_trgm` dla efektywnego wyszukiwania pełnotekstowego.*

### 3.4. Indeksy dla workout_plans
```sql
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_workout_plans_user_active ON workout_plans(user_id, is_active) WHERE is_active = TRUE;
```

### 3.5. Indeksy dla plan_exercises
```sql
CREATE INDEX idx_plan_exercises_workout_plan_id ON plan_exercises(workout_plan_id);
CREATE INDEX idx_plan_exercises_exercise_id ON plan_exercises(exercise_id);
CREATE INDEX idx_plan_exercises_plan_order ON plan_exercises(workout_plan_id, order_index);
```

### 3.6. Indeksy dla workout_sessions
```sql
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_plan_id ON workout_sessions(workout_plan_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX idx_workout_sessions_scheduled_for ON workout_sessions(scheduled_for);
CREATE INDEX idx_workout_sessions_user_scheduled ON workout_sessions(user_id, scheduled_for DESC);
CREATE INDEX idx_workout_sessions_user_status ON workout_sessions(user_id, status);
CREATE UNIQUE INDEX idx_workout_sessions_user_in_progress ON workout_sessions(user_id) WHERE status = 'in_progress';
```

### 3.7. Indeksy dla session_sets
```sql
CREATE INDEX idx_session_sets_workout_session_id ON session_sets(workout_session_id);
CREATE INDEX idx_session_sets_plan_exercise_id ON session_sets(plan_exercise_id);
CREATE INDEX idx_session_sets_session_exercise ON session_sets(workout_session_id, plan_exercise_id);
CREATE INDEX idx_session_sets_status ON session_sets(status);
```

## 4. Polityki Row-Level Security (RLS)

### 4.1. Włączenie RLS na wszystkich tabelach
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sets ENABLE ROW LEVEL SECURITY;
```
*Uwaga: Tabele `muscle_groups` i `exercises` są publiczne i nie wymagają RLS.*

### 4.2. Polityki dla users
```sql
-- Użytkownik może widzieć i edytować tylko swój profil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 4.3. Polityki dla workout_plans
```sql
-- Użytkownik ma pełny dostęp do swoich planów treningowych
CREATE POLICY "Users can view own workout plans" ON workout_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans" ON workout_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" ON workout_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans" ON workout_plans
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.4. Polityki dla plan_exercises
```sql
-- Użytkownik ma dostęp do ćwiczeń w swoich planach
CREATE POLICY "Users can view own plan exercises" ON plan_exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = plan_exercises.workout_plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan exercises" ON plan_exercises
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = plan_exercises.workout_plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan exercises" ON plan_exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = plan_exercises.workout_plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan exercises" ON plan_exercises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = plan_exercises.workout_plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );
```

### 4.5. Polityki dla workout_sessions
```sql
-- Użytkownik ma pełny dostęp do swoich sesji treningowych
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON workout_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON workout_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON workout_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.6. Polityki dla session_sets
```sql
-- Użytkownik ma dostęp do serii w swoich sesjach treningowych
CREATE POLICY "Users can view own session sets" ON session_sets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = session_sets.workout_session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session sets" ON session_sets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = session_sets.workout_session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session sets" ON session_sets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = session_sets.workout_session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session sets" ON session_sets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = session_sets.workout_session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );
```

### 4.7. Publiczny dostęp do muscle_groups, muscle_subgroups i exercises
```sql
-- Tabele muscle_groups, muscle_subgroups i exercises są publiczne do odczytu
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to muscle groups" ON muscle_groups
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Public read access to muscle subgroups" ON muscle_subgroups
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Public read access to active exercises" ON exercises
  FOR SELECT
  USING (is_active = TRUE);
```

## 5. Funkcje i triggery

### 5.1. Automatyczna aktualizacja updated_at
```sql
-- Funkcja do automatycznej aktualizacji kolumny updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla wszystkich tabel z kolumną updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_exercises_updated_at
  BEFORE UPDATE ON plan_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_sets_updated_at
  BEFORE UPDATE ON session_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.2. Polityka retencji danych (2 lata)
```sql
-- Funkcja do usuwania starych sesji treningowych (starszych niż 2 lata)
CREATE OR REPLACE FUNCTION delete_old_workout_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM workout_sessions
  WHERE scheduled_for < CURRENT_DATE - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Funkcja ta powinna być wywoływana cyklicznie (np. przez CRON job)
-- W Supabase można użyć pg_cron extension:
-- SELECT cron.schedule('delete-old-sessions', '0 2 * * 0', 'SELECT delete_old_workout_sessions();');
```

### 5.3. Walidacja statusu sesji
```sql
-- Funkcja walidująca zmiany statusu sesji treningowej
CREATE OR REPLACE FUNCTION validate_workout_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Sprawdzenie czy zmiana statusu na 'in_progress' ustawia started_at
  IF NEW.status = 'in_progress' AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;

  -- Sprawdzenie czy zmiana statusu na 'completed' ustawia completed_at
  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;

  -- Sprawdzenie czy zmiana statusu na 'abandoned' ustawia completed_at
  IF NEW.status = 'abandoned' AND OLD.status = 'in_progress' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_session_status_before_update
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_workout_session_status_change();
```

### 5.4. Automatyczne tworzenie session_sets przy rozpoczęciu sesji
```sql
-- Funkcja tworząca rekordy session_sets na podstawie plan_exercises
CREATE OR REPLACE FUNCTION create_session_sets_for_workout()
RETURNS TRIGGER AS $$
BEGIN
  -- Tworzymy serie tylko przy zmianie statusu na 'in_progress'
  IF NEW.status = 'in_progress' AND OLD.status = 'scheduled' THEN
    INSERT INTO session_sets (
      workout_session_id,
      plan_exercise_id,
      set_number,
      target_reps_min,
      target_reps_max,
      status
    )
    SELECT
      NEW.id,
      pe.id,
      generate_series(1, pe.target_sets),
      pe.target_reps_min,
      pe.target_reps_max,
      'pending'
    FROM plan_exercises pe
    WHERE pe.workout_plan_id = NEW.workout_plan_id
    ORDER BY pe.order_index;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_sets_on_session_start
  AFTER UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_session_sets_for_workout();
```

## 6. Rozszerzenia PostgreSQL

```sql
-- Rozszerzenie dla wyszukiwania pełnotekstowego z użyciem trigramów
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Rozszerzenie dla UUID (już dostępne w Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rozszerzenie dla zaplanowanych zadań (opcjonalne, dla polityki retencji)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## 7. Widoki pomocnicze

### 7.1. Widok dla nadchodzących treningów użytkownika
```sql
CREATE OR REPLACE VIEW upcoming_workouts AS
SELECT
  ws.id,
  ws.user_id,
  ws.scheduled_for,
  ws.status,
  wp.name AS plan_name,
  COUNT(DISTINCT pe.id) AS exercise_count,
  SUM(pe.target_sets) AS total_sets
FROM workout_sessions ws
JOIN workout_plans wp ON ws.workout_plan_id = wp.id
LEFT JOIN plan_exercises pe ON pe.workout_plan_id = wp.id
WHERE ws.status IN ('scheduled', 'in_progress')
  AND ws.scheduled_for >= CURRENT_DATE
GROUP BY ws.id, ws.user_id, ws.scheduled_for, ws.status, wp.name
ORDER BY ws.scheduled_for ASC;
```

### 7.2. Widok dla historii treningów
```sql
CREATE OR REPLACE VIEW workout_history AS
SELECT
  ws.id,
  ws.user_id,
  ws.scheduled_for,
  ws.started_at,
  ws.completed_at,
  ws.status,
  wp.name AS plan_name,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'completed') AS completed_sets,
  COUNT(DISTINCT ss.id) AS total_sets,
  EXTRACT(EPOCH FROM (ws.completed_at - ws.started_at))/60 AS duration_minutes
FROM workout_sessions ws
JOIN workout_plans wp ON ws.workout_plan_id = wp.id
LEFT JOIN session_sets ss ON ss.workout_session_id = ws.id
WHERE ws.status IN ('completed', 'abandoned')
GROUP BY ws.id, ws.user_id, ws.scheduled_for, ws.started_at, ws.completed_at, ws.status, wp.name
ORDER BY ws.scheduled_for DESC;
```

### 7.3. Widok dla analizy progresji w ćwiczeniu
```sql
CREATE OR REPLACE VIEW exercise_progression AS
SELECT
  ss.plan_exercise_id,
  pe.exercise_id,
  ws.user_id,
  e.name AS exercise_name,
  ws.scheduled_for,
  ss.set_number,
  ss.actual_reps,
  ss.weight_kg,
  ss.status,
  ROW_NUMBER() OVER (
    PARTITION BY ss.plan_exercise_id, ws.user_id
    ORDER BY ws.scheduled_for DESC, ss.set_number
  ) AS recent_rank
FROM session_sets ss
JOIN workout_sessions ws ON ss.workout_session_id = ws.id
JOIN plan_exercises pe ON ss.plan_exercise_id = pe.id
JOIN exercises e ON pe.exercise_id = e.id
WHERE ws.status = 'completed' AND ss.status = 'completed'
ORDER BY ws.user_id, pe.exercise_id, ws.scheduled_for DESC, ss.set_number;
```

## 8. Uwagi dotyczące decyzji projektowych

### 8.1. Architektura użytkowników
- Tabela `users` rozszerza `auth.users` z Supabase Auth zamiast duplikować dane uwierzytelniające
- Relacja 1:1 z `auth.users` przez klucz obcy zapewnia spójność
- Dane profilowe (waga, wzrost, etc.) przechowywane osobno od danych autoryzacyjnych

### 8.2. Harmonogram treningów
- Elastyczny model obsługuje dwa typy harmonogramów: dni tygodnia (weekly) i interwał (interval)
- Constraint na poziomie bazy zapewnia, że tylko jeden typ harmonogramu jest używany
- `workout_sessions` są instancjami wygenerowanymi z `workout_plans` dla konkretnych dat

### 8.3. Snapshot parametrów
- `session_sets` przechowuje snapshot parametrów z planu (`target_reps_min`, `target_reps_max`)
- Pozwala to na modyfikację planu bez wpływu na historyczne dane
- Umożliwia dokładną analizę progresji w czasie

### 8.4. Statusy i workflow
- Statusy sesji: `scheduled` → `in_progress` → `completed`/`abandoned`
- Unique index zapewnia tylko jedną sesję `in_progress` na użytkownika
- Triggery automatycznie ustawiają znaczniki czasu przy zmianach statusu

### 8.5. Wydajność
- Indeksy zoptymalizowane pod najczęstsze zapytania:
  - Wyszukiwanie treningów użytkownika po dacie
  - Filtrowanie ćwiczeń po grupach mięśniowych
  - Analiza progresji (indeksy composite)
- Indeks trigramowy dla pełnotekstowego wyszukiwania ćwiczeń

### 8.6. Bezpieczeństwo
- RLS na wszystkich tabelach użytkownika
- Tabele `muscle_groups` i `exercises` publiczne do odczytu
- Polityki wykorzystują `auth.uid()` dla kontroli dostępu
- Kaskadowe usuwanie zapewnia spójność danych przy usunięciu użytkownika

### 8.7. Retencja danych
- Funkcja `delete_old_workout_sessions()` do usuwania sesji starszych niż 2 lata
- Można zaplanować przez `pg_cron` jako cotygodniowe zadanie
- Kaskadowe usuwanie automatycznie usuwa powiązane `session_sets`

### 8.8. Skalowalnośc
- Model zaprojektowany z myślą o przyszłym partycjonowaniu:
  - `workout_sessions` można partycjonować po `scheduled_for`
  - `session_sets` można partycjonować po `created_at`
- Widoki pomocnicze upraszczają złożone zapytania
- Brak denormalizacji w MVP - można dodać w razie potrzeby

### 8.9. Integracja z Supabase
- Wykorzystanie natywnych funkcji Supabase Auth
- RLS policies kompatybilne z SDK Supabase
- Triggery i funkcje w PL/pgSQL (natywne wsparcie PostgreSQL)
- Możliwość użycia Realtime dla aktualizacji na żywo (przyszła funkcjonalność)

### 8.10. Brak obsługi stref czasowych
- Zgodnie z wymaganiami MVP, brak kompleksowej obsługi stref czasowych
- `TIMESTAMP WITH TIME ZONE` dla precyzyjnych znaczników czasu
- `DATE` dla `scheduled_for` (prosty kalendarz bez godzin)
- W przyszłości można dodać kolumnę `timezone` do profilu użytkownika
