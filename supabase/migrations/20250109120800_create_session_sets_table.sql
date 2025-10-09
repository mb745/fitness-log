-- migration: create_session_sets_table
-- purpose: create session sets table for detailed logging of exercise sets
-- affected: new table 'session_sets'
-- considerations: records actual performance data for each set in a workout session

-- create session_sets table for detailed set tracking
create table public.session_sets (
  -- primary key
  id serial primary key,

-- relationships
workout_session_id integer not null references public.workout_sessions (id) on delete cascade,
plan_exercise_id integer not null references public.plan_exercises (id) on delete restrict,

-- set identification and planning
set_number integer not null check (set_number > 0),
target_reps integer not null check (target_reps > 0),

-- actual performance data
actual_reps integer null check (actual_reps >= 0),
weight_kg decimal(6, 2) null check (weight_kg >= 0),

-- set status
status varchar(20) not null default 'pending' check (
    status in (
        'pending',
        'completed',
        'skipped'
    )
),
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

-- ensure unique set numbers per exercise in a session
unique ( workout_session_id, plan_exercise_id, set_number ),

-- ensure completed sets have actual_reps and completed_at
check (status != 'completed' or (actual_reps is not null and completed_at is not null))
);

-- create indexes for efficient querying
create index idx_session_sets_workout_session_id on public.session_sets (workout_session_id);

create index idx_session_sets_plan_exercise_id on public.session_sets (plan_exercise_id);

create index idx_session_sets_session_exercise on public.session_sets (
    workout_session_id,
    plan_exercise_id
);

create index idx_session_sets_status on public.session_sets (status);

-- enable row level security
alter table public.session_sets enable row level security;

-- rls policy: users can view sets in their own workout sessions
create policy "Users can view own session sets" on public.session_sets for
select to authenticated using (
        exists (
            select 1
            from public.workout_sessions
            where
                workout_sessions.id = session_sets.workout_session_id
                and workout_sessions.user_id = auth.uid ()
        )
    );

-- rls policy: users can insert sets into their own workout sessions
create policy "Users can insert own session sets" on public.session_sets for
insert
    to authenticated
with
    check (
        exists (
            select 1
            from public.workout_sessions
            where
                workout_sessions.id = session_sets.workout_session_id
                and workout_sessions.user_id = auth.uid ()
        )
    );

-- rls policy: users can update sets in their own workout sessions
create policy "Users can update own session sets" on public.session_sets for
update to authenticated using (
    exists (
        select 1
        from public.workout_sessions
        where
            workout_sessions.id = session_sets.workout_session_id
            and workout_sessions.user_id = auth.uid ()
    )
);

-- rls policy: users can delete sets from their own workout sessions
create policy "Users can delete own session sets" on public.session_sets for delete to authenticated using (
    exists (
        select 1
        from public.workout_sessions
        where
            workout_sessions.id = session_sets.workout_session_id
            and workout_sessions.user_id = auth.uid ()
    )
);

-- add comment to table
comment on
table public.session_sets is 'Detailed logging of individual exercise sets within workout sessions';