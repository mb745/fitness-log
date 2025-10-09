-- migration: create_workout_sessions_table
-- purpose: create workout sessions table for scheduled workout instances
-- affected: new table 'workout_sessions'
-- considerations: represents concrete workout instances in user's calendar with status tracking

-- create workout_sessions table for scheduled workouts
create table public.workout_sessions (
  -- primary key
  id serial primary key,

-- ownership and plan reference
user_id uuid not null references public.users (id) on delete cascade,
workout_plan_id integer not null references public.workout_plans (id) on delete restrict,

-- session status and timing
status varchar(20) not null default 'scheduled' check (
    status in (
        'scheduled',
        'in_progress',
        'completed',
        'abandoned'
    )
),
scheduled_for date not null,
started_at timestamp
with
    time zone null,
    completed_at timestamp
with
    time zone null,

-- additional information
notes text null,

-- timestamps
created_at timestamp
with
    time zone not null default now(),
    updated_at timestamp
with
    time zone not null default now(),

-- ensure in_progress sessions have started_at
check ( status != 'in_progress' or started_at is not null ),

-- ensure completed sessions have both started_at and completed_at
check (
    status != 'completed'
    or (
        started_at is not null
        and completed_at is not null
    )
),

-- ensure completed_at is not before started_at
check (completed_at is null or completed_at >= started_at) );

-- create indexes for efficient querying
create index idx_workout_sessions_user_id on public.workout_sessions (user_id);

create index idx_workout_sessions_plan_id on public.workout_sessions (workout_plan_id);

create index idx_workout_sessions_status on public.workout_sessions (status);

create index idx_workout_sessions_scheduled_for on public.workout_sessions (scheduled_for);

create index idx_workout_sessions_user_scheduled on public.workout_sessions (user_id, scheduled_for desc);

create index idx_workout_sessions_user_status on public.workout_sessions (user_id, status);

-- create unique partial index to ensure only one in_progress session per user
-- warning: this is a critical constraint that prevents concurrent active workouts
create unique index idx_workout_sessions_user_in_progress on public.workout_sessions (user_id)
where
    status = 'in_progress';

-- enable row level security
alter table public.workout_sessions enable row level security;

-- rls policy: users can view their own workout sessions
create policy "Users can view own workout sessions" on public.workout_sessions for
select to authenticated using (auth.uid () = user_id);

-- rls policy: users can insert their own workout sessions
create policy "Users can insert own workout sessions" on public.workout_sessions for
insert
    to authenticated
with
    check (auth.uid () = user_id);

-- rls policy: users can update their own workout sessions
create policy "Users can update own workout sessions" on public.workout_sessions for
update to authenticated using (auth.uid () = user_id);

-- rls policy: users can delete their own workout sessions
create policy "Users can delete own workout sessions" on public.workout_sessions for delete to authenticated using (auth.uid () = user_id);

-- add comment to table
comment on
table public.workout_sessions is 'Scheduled workout instances in user calendar with status tracking';