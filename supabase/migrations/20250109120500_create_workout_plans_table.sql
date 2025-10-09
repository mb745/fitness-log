-- migration: create_workout_plans_table
-- purpose: create workout plans table for user-created training programs
-- affected: new table 'workout_plans'
-- considerations: supports both weekly and interval-based scheduling

-- create workout_plans table for user training programs
create table public.workout_plans (
  -- primary key
  id serial primary key,

-- ownership
user_id uuid not null references public.users (id) on delete cascade,

-- plan details
name varchar(200) not null,

-- scheduling configuration
schedule_type varchar(20) not null check (
    schedule_type in ('weekly', 'interval')
),

-- weekly schedule: array of day numbers (1-7, where 1=Monday)
schedule_days integer[] null,

-- interval schedule: number of days between workouts
schedule_interval_days integer null,

-- plan status
is_active boolean not null default true,

-- timestamps
created_at timestamp
with
    time zone not null default now(),
    updated_at timestamp
with
    time zone not null default now(),

-- ensure schedule_type has corresponding configuration
check (
    (schedule_type = 'weekly' and schedule_days is not null and array_length(schedule_days, 1) > 0 and schedule_interval_days is null) or
    (schedule_type = 'interval' and schedule_interval_days is not null and schedule_interval_days > 0 and schedule_days is null)
  )
);

-- create indexes for efficient querying
create index idx_workout_plans_user_id on public.workout_plans (user_id);

create index idx_workout_plans_user_active on public.workout_plans (user_id, is_active)
where
    is_active = true;

-- enable row level security
alter table public.workout_plans enable row level security;

-- rls policy: users can view their own workout plans
create policy "Users can view own workout plans" on public.workout_plans for
select to authenticated using (auth.uid () = user_id);

-- rls policy: users can insert their own workout plans
create policy "Users can insert own workout plans" on public.workout_plans for
insert
    to authenticated
with
    check (auth.uid () = user_id);

-- rls policy: users can update their own workout plans
create policy "Users can update own workout plans" on public.workout_plans for
update to authenticated using (auth.uid () = user_id);

-- rls policy: users can delete their own workout plans
create policy "Users can delete own workout plans" on public.workout_plans for delete to authenticated using (auth.uid () = user_id);

-- add comment to table
comment on
table public.workout_plans is 'User-created workout plans with flexible scheduling options';