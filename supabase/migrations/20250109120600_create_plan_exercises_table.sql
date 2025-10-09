-- migration: create_plan_exercises_table
-- purpose: create junction table linking workout plans to exercises
-- affected: new table 'plan_exercises'
-- considerations: many-to-many relationship between workout_plans and exercises

-- create plan_exercises table for workout plan composition
create table public.plan_exercises (
  -- primary key
  id serial primary key,

-- relationships
workout_plan_id integer not null references public.workout_plans (id) on delete cascade,
exercise_id integer not null references public.exercises (id) on delete restrict,

-- exercise ordering and parameters
order_index integer not null check (order_index >= 0),
target_sets integer not null check (target_sets > 0),
target_reps integer not null check (target_reps > 0),
rest_seconds integer not null check (rest_seconds >= 0),

-- additional information
notes text null,

-- timestamps
created_at timestamp
with
    time zone not null default now(),
    updated_at timestamp
with
    time zone not null default now(),

-- ensure unique order_index within a workout plan
unique(workout_plan_id, order_index) );

-- create indexes for efficient querying
create index idx_plan_exercises_workout_plan_id on public.plan_exercises (workout_plan_id);

create index idx_plan_exercises_exercise_id on public.plan_exercises (exercise_id);

create index idx_plan_exercises_plan_order on public.plan_exercises (workout_plan_id, order_index);

-- enable row level security
alter table public.plan_exercises enable row level security;

-- rls policy: users can view exercises in their own plans
create policy "Users can view own plan exercises" on public.plan_exercises for
select to authenticated using (
        exists (
            select 1
            from public.workout_plans
            where
                workout_plans.id = plan_exercises.workout_plan_id
                and workout_plans.user_id = auth.uid ()
        )
    );

-- rls policy: users can insert exercises into their own plans
create policy "Users can insert own plan exercises" on public.plan_exercises for
insert
    to authenticated
with
    check (
        exists (
            select 1
            from public.workout_plans
            where
                workout_plans.id = plan_exercises.workout_plan_id
                and workout_plans.user_id = auth.uid ()
        )
    );

-- rls policy: users can update exercises in their own plans
create policy "Users can update own plan exercises" on public.plan_exercises for
update to authenticated using (
    exists (
        select 1
        from public.workout_plans
        where
            workout_plans.id = plan_exercises.workout_plan_id
            and workout_plans.user_id = auth.uid ()
    )
);

-- rls policy: users can delete exercises from their own plans
create policy "Users can delete own plan exercises" on public.plan_exercises for delete to authenticated using (
    exists (
        select 1
        from public.workout_plans
        where
            workout_plans.id = plan_exercises.workout_plan_id
            and workout_plans.user_id = auth.uid ()
    )
);

-- add comment to table
comment on
table public.plan_exercises is 'Junction table linking workout plans to exercises with configuration';