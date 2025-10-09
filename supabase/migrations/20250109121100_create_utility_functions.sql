-- migration: create_utility_functions
-- purpose: create utility functions for data retention and maintenance
-- affected: new function for deleting old workout sessions
-- considerations: supports 2-year data retention policy

-- function to delete workout sessions older than 2 years
-- warning: this will cascade delete to session_sets due to foreign key constraints
create or replace function public.delete_old_workout_sessions()
returns void as $$
begin
  delete from public.workout_sessions
  where scheduled_for < current_date - interval '2 years';
end;
$$ language plpgsql;

-- add comment to function
comment on function public.delete_old_workout_sessions () is 'Deletes workout sessions older than 2 years for data retention compliance. Should be scheduled as a periodic task.';

-- note: this function should be called periodically (e.g., weekly) using pg_cron or external scheduler
-- example pg_cron usage (requires pg_cron extension and configuration):
-- select cron.schedule('delete-old-sessions', '0 2 * * 0', 'select public.delete_old_workout_sessions();');