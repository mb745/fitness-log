-- migration: add_exercises_sorting_indexes
-- purpose: add indexes for efficient sorting of exercises by created_at and updated_at
-- affected: exercises table
-- considerations: these indexes optimize ORDER BY queries for exercise list endpoint

-- index for sorting by created_at (descending order for "newest first")
create index if not exists idx_exercises_created_at on public.exercises (created_at desc);

-- index for sorting by updated_at (descending order for "recently updated")
create index if not exists idx_exercises_updated_at on public.exercises (updated_at desc);

-- add comments for documentation
comment on index idx_exercises_created_at is 'Optimizes sorting exercises by creation date (newest first)';
comment on index idx_exercises_updated_at is 'Optimizes sorting exercises by last update date';

