-- migration: create_views
-- purpose: create helper views for common queries
-- affected: new views for upcoming workouts, workout history, and exercise progression
-- considerations: views simplify complex queries and provide pre-aggregated data

-- view for upcoming scheduled and in-progress workouts
create or replace view public.upcoming_workouts as
select
    ws.id,
    ws.user_id,
    ws.scheduled_for,
    ws.status,
    wp.name as plan_name,
    count(distinct pe.id) as exercise_count,
    sum(pe.target_sets) as total_sets
from public.workout_sessions ws
    join public.workout_plans wp on ws.workout_plan_id = wp.id
    left join public.plan_exercises pe on pe.workout_plan_id = wp.id
where
    ws.status in ('scheduled', 'in_progress')
    and ws.scheduled_for >= current_date
group by
    ws.id,
    ws.user_id,
    ws.scheduled_for,
    ws.status,
    wp.name
order by ws.scheduled_for asc;

-- view for completed and abandoned workout history
create or replace view public.workout_history as
select
    ws.id,
    ws.user_id,
    ws.scheduled_for,
    ws.started_at,
    ws.completed_at,
    ws.status,
    wp.name as plan_name,
    count(distinct ss.id) filter (
        where
            ss.status = 'completed'
    ) as completed_sets,
    count(distinct ss.id) as total_sets,
    extract(
        epoch
        from (
                ws.completed_at - ws.started_at
            )
    ) / 60 as duration_minutes
from public.workout_sessions ws
    join public.workout_plans wp on ws.workout_plan_id = wp.id
    left join public.session_sets ss on ss.workout_session_id = ws.id
where
    ws.status in ('completed', 'abandoned')
group by
    ws.id,
    ws.user_id,
    ws.scheduled_for,
    ws.started_at,
    ws.completed_at,
    ws.status,
    wp.name
order by ws.scheduled_for desc;

-- view for exercise progression analysis
create or replace view public.exercise_progression as
select
    ss.plan_exercise_id,
    pe.exercise_id,
    ws.user_id,
    e.name as exercise_name,
    ws.scheduled_for,
    ss.set_number,
    ss.actual_reps,
    ss.weight_kg,
    ss.status,
    row_number() over (
        partition by
            ss.plan_exercise_id,
            ws.user_id
        order by ws.scheduled_for desc, ss.set_number
    ) as recent_rank
from public.session_sets ss
    join public.workout_sessions ws on ss.workout_session_id = ws.id
    join public.plan_exercises pe on ss.plan_exercise_id = pe.id
    join public.exercises e on pe.exercise_id = e.id
where
    ws.status = 'completed'
    and ss.status = 'completed'
order by ws.user_id, pe.exercise_id, ws.scheduled_for desc, ss.set_number;

-- add comments to views
comment on view public.upcoming_workouts is 'Aggregated view of upcoming scheduled and in-progress workouts';

comment on view public.workout_history is 'Historical view of completed and abandoned workouts with statistics';

comment on view public.exercise_progression is 'Detailed view of exercise performance over time for progression analysis';