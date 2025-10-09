-- migration: create_triggers
-- purpose: create database triggers for automated behavior
-- affected: multiple tables with updated_at columns and workout_sessions
-- considerations: triggers handle timestamp updates and workout session lifecycle

-- function to automatically update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger for users table
create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function public.update_updated_at_column();

-- trigger for exercises table
create trigger update_exercises_updated_at
  before update on public.exercises
  for each row
  execute function public.update_updated_at_column();

-- trigger for workout_plans table
create trigger update_workout_plans_updated_at
  before update on public.workout_plans
  for each row
  execute function public.update_updated_at_column();

-- trigger for plan_exercises table
create trigger update_plan_exercises_updated_at
  before update on public.plan_exercises
  for each row
  execute function public.update_updated_at_column();

-- trigger for workout_sessions table
create trigger update_workout_sessions_updated_at
  before update on public.workout_sessions
  for each row
  execute function public.update_updated_at_column();

-- trigger for session_sets table
create trigger update_session_sets_updated_at
  before update on public.session_sets
  for each row
  execute function public.update_updated_at_column();

-- function to validate and auto-set workout session status timestamps
create or replace function public.validate_workout_session_status_change()
returns trigger as $$
begin
  -- auto-set started_at when status changes to in_progress
  if new.status = 'in_progress' and new.started_at is null then
    new.started_at = now();
  end if;

  -- auto-set completed_at when status changes to completed
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;

  -- auto-set completed_at when status changes from in_progress to abandoned
  if new.status = 'abandoned' and old.status = 'in_progress' and new.completed_at is null then
    new.completed_at = now();
  end if;

  return new;
end;
$$ language plpgsql;

-- trigger to validate workout session status changes before update
create trigger validate_session_status_before_update
  before update on public.workout_sessions
  for each row
  execute function public.validate_workout_session_status_change();

-- function to automatically create session_sets when workout session starts
create or replace function public.create_session_sets_for_workout()
returns trigger as $$
begin
  -- create session_sets only when status changes from scheduled to in_progress
  if new.status = 'in_progress' and old.status = 'scheduled' then
    insert into public.session_sets (
      workout_session_id,
      plan_exercise_id,
      set_number,
      target_reps,
      status
    )
    select
      new.id,
      pe.id,
      generate_series(1, pe.target_sets),
      pe.target_reps,
      'pending'
    from public.plan_exercises pe
    where pe.workout_plan_id = new.workout_plan_id
    order by pe.order_index;
  end if;

  return new;
end;
$$ language plpgsql;

-- trigger to create sets automatically when session starts
create trigger create_sets_on_session_start
  after update on public.workout_sessions
  for each row
  execute function public.create_session_sets_for_workout();

-- add comments to functions
comment on function public.update_updated_at_column () is 'Automatically updates updated_at timestamp on row modification';

comment on function public.validate_workout_session_status_change () is 'Validates and auto-sets timestamps for workout session status transitions';

comment on function public.create_session_sets_for_workout () is 'Automatically creates session_sets when workout session starts';