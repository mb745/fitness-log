-- migration: disable_rls_policies
-- purpose: disable all row level security policies for development
-- affected: all tables with rls enabled
-- considerations: this is for development purposes only - re-enable for production

-- disable rls policies for users table
drop policy if exists "Users can view own profile" on public.users;

drop policy if exists "Users can insert own profile" on public.users;

drop policy if exists "Users can update own profile" on public.users;

alter table public.users disable row level security;

-- disable rls policies for muscle_groups table
drop policy if exists "Public read access to muscle groups for anonymous users" on public.muscle_groups;

drop policy if exists "Public read access to muscle groups for authenticated users" on public.muscle_groups;

alter table public.muscle_groups disable row level security;

-- disable rls policies for muscle_subgroups table
drop policy if exists "Public read access to muscle subgroups for anonymous users" on public.muscle_subgroups;

drop policy if exists "Public read access to muscle subgroups for authenticated users" on public.muscle_subgroups;

alter table public.muscle_subgroups disable row level security;

-- disable rls policies for exercises table
drop policy if exists "Public read access to active exercises for anonymous users" on public.exercises;

drop policy if exists "Public read access to active exercises for authenticated users" on public.exercises;

alter table public.exercises disable row level security;

-- disable rls policies for workout_plans table
drop policy if exists "Users can view own workout plans" on public.workout_plans;

drop policy if exists "Users can insert own workout plans" on public.workout_plans;

drop policy if exists "Users can update own workout plans" on public.workout_plans;

drop policy if exists "Users can delete own workout plans" on public.workout_plans;

alter table public.workout_plans disable row level security;

-- disable rls policies for plan_exercises table
drop policy if exists "Users can view own plan exercises" on public.plan_exercises;

drop policy if exists "Users can insert own plan exercises" on public.plan_exercises;

drop policy if exists "Users can update own plan exercises" on public.plan_exercises;

drop policy if exists "Users can delete own plan exercises" on public.plan_exercises;

alter table public.plan_exercises disable row level security;

-- disable rls policies for workout_sessions table
drop policy if exists "Users can view own workout sessions" on public.workout_sessions;

drop policy if exists "Users can insert own workout sessions" on public.workout_sessions;

drop policy if exists "Users can update own workout sessions" on public.workout_sessions;

drop policy if exists "Users can delete own workout sessions" on public.workout_sessions;

alter table public.workout_sessions disable row level security;

-- disable rls policies for session_sets table
drop policy if exists "Users can view own session sets" on public.session_sets;

drop policy if exists "Users can insert own session sets" on public.session_sets;

drop policy if exists "Users can update own session sets" on public.session_sets;

drop policy if exists "Users can delete own session sets" on public.session_sets;

alter table public.session_sets disable row level security;