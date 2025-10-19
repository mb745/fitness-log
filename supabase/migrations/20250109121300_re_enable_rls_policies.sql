-- migration: re_enable_rls_policies
-- purpose: re-enable row level security policies for all tables after development
-- affected: all tables with rls that were previously disabled
-- considerations: restores security model for production use

-- ============================================================================
-- users table: re-enable rls and recreate user-scoped policies
-- ============================================================================
alter table public.users enable row level security;

-- rls policy: users can view their own profile
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);

-- rls policy: users can insert their own profile
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- rls policy: users can update their own profile
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- ============================================================================
-- muscle_groups table: re-enable rls and recreate public read policies
-- ============================================================================
alter table public.muscle_groups enable row level security;

-- rls policy: allow anonymous users to read muscle groups
create policy "Public read access to muscle groups for anonymous users" on public.muscle_groups for select to anon using (true);

-- rls policy: allow authenticated users to read muscle groups
create policy "Public read access to muscle groups for authenticated users" on public.muscle_groups for select to authenticated using (true);

-- ============================================================================
-- muscle_subgroups table: re-enable rls and recreate public read policies
-- ============================================================================
alter table public.muscle_subgroups enable row level security;

-- rls policy: allow anonymous users to read muscle subgroups
create policy "Public read access to muscle subgroups for anonymous users" on public.muscle_subgroups for select to anon using (true);

-- rls policy: allow authenticated users to read muscle subgroups
create policy "Public read access to muscle subgroups for authenticated users" on public.muscle_subgroups for select to authenticated using (true);

-- ============================================================================
-- exercises table: re-enable rls and recreate public read active exercises policies
-- ============================================================================
alter table public.exercises enable row level security;

-- rls policy: allow anonymous users to read active exercises
create policy "Public read access to active exercises for anonymous users" on public.exercises for select to anon using (is_active = true);

-- rls policy: allow authenticated users to read active exercises
create policy "Public read access to active exercises for authenticated users" on public.exercises for select to authenticated using (is_active = true);

-- ============================================================================
-- workout_plans table: re-enable rls and recreate user-scoped policies
-- ============================================================================
alter table public.workout_plans enable row level security;

-- rls policy: users can view their own workout plans
create policy "Users can view own workout plans" on public.workout_plans for select to authenticated using (auth.uid() = user_id);

-- rls policy: users can insert their own workout plans
create policy "Users can insert own workout plans" on public.workout_plans for insert to authenticated with check (auth.uid() = user_id);

-- rls policy: users can update their own workout plans
create policy "Users can update own workout plans" on public.workout_plans for update to authenticated using (auth.uid() = user_id);

-- rls policy: users can delete their own workout plans
create policy "Users can delete own workout plans" on public.workout_plans for delete to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- plan_exercises table: re-enable rls and recreate policies for plan access
-- ============================================================================
alter table public.plan_exercises enable row level security;

-- rls policy: users can view exercises in their own plans
create policy "Users can view own plan exercises" on public.plan_exercises for select to authenticated using (
    exists (
        select 1 from public.workout_plans
        where workout_plans.id = plan_exercises.workout_plan_id
        and workout_plans.user_id = auth.uid()
    )
);

-- rls policy: users can insert exercises into their own plans
create policy "Users can insert own plan exercises" on public.plan_exercises for insert to authenticated with check (
    exists (
        select 1 from public.workout_plans
        where workout_plans.id = plan_exercises.workout_plan_id
        and workout_plans.user_id = auth.uid()
    )
);

-- rls policy: users can update exercises in their own plans
create policy "Users can update own plan exercises" on public.plan_exercises for update to authenticated using (
    exists (
        select 1 from public.workout_plans
        where workout_plans.id = plan_exercises.workout_plan_id
        and workout_plans.user_id = auth.uid()
    )
);

-- rls policy: users can delete exercises from their own plans
create policy "Users can delete own plan exercises" on public.plan_exercises for delete to authenticated using (
    exists (
        select 1 from public.workout_plans
        where workout_plans.id = plan_exercises.workout_plan_id
        and workout_plans.user_id = auth.uid()
    )
);

-- ============================================================================
-- workout_sessions table: re-enable rls and recreate user-scoped policies
-- ============================================================================
alter table public.workout_sessions enable row level security;

-- rls policy: users can view their own workout sessions
create policy "Users can view own workout sessions" on public.workout_sessions for select to authenticated using (auth.uid() = user_id);

-- rls policy: users can insert their own workout sessions
create policy "Users can insert own workout sessions" on public.workout_sessions for insert to authenticated with check (auth.uid() = user_id);

-- rls policy: users can update their own workout sessions
create policy "Users can update own workout sessions" on public.workout_sessions for update to authenticated using (auth.uid() = user_id);

-- rls policy: users can delete their own workout sessions
create policy "Users can delete own workout sessions" on public.workout_sessions for delete to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- session_sets table: re-enable rls and recreate policies for session access
-- ============================================================================
alter table public.session_sets enable row level security;

-- rls policy: users can view sets in their own workout sessions
create policy "Users can view own session sets" on public.session_sets for select to authenticated using (
    exists (
        select 1 from public.workout_sessions
        where workout_sessions.id = session_sets.workout_session_id
        and workout_sessions.user_id = auth.uid()
    )
);

-- rls policy: users can insert sets into their own workout sessions
create policy "Users can insert own session sets" on public.session_sets for insert to authenticated with check (
    exists (
        select 1 from public.workout_sessions
        where workout_sessions.id = session_sets.workout_session_id
        and workout_sessions.user_id = auth.uid()
    )
);

-- rls policy: users can update sets in their own workout sessions
create policy "Users can update own session sets" on public.session_sets for update to authenticated using (
    exists (
        select 1 from public.workout_sessions
        where workout_sessions.id = session_sets.workout_session_id
        and workout_sessions.user_id = auth.uid()
    )
);

-- rls policy: users can delete sets from their own workout sessions
create policy "Users can delete own session sets" on public.session_sets for delete to authenticated using (
    exists (
        select 1 from public.workout_sessions
        where workout_sessions.id = session_sets.workout_session_id
        and workout_sessions.user_id = auth.uid()
    )
);
