-- migration: create_exercises_table
-- purpose: create global exercise library with categorization and instructions
-- affected: new table 'exercises'
-- considerations: this is a centrally managed library with public read access to active exercises

-- create exercises table for global exercise library
create table public.exercises (
  -- primary key
  id serial primary key,

-- exercise identification
name varchar(200) not null, slug varchar(200) not null unique,

-- categorization
muscle_group_id integer not null references public.muscle_groups (id) on delete restrict,
muscle_subgroup_id integer null references public.muscle_subgroups (id) on delete set null,

-- exercise properties
exercise_type varchar(50) not null check (
    exercise_type in ('compound', 'isolation')
),
recommended_rep_range_min integer not null check (recommended_rep_range_min > 0),
recommended_rep_range_max integer not null check (
    recommended_rep_range_max >= recommended_rep_range_min
),

-- instructions and metadata
instructions text not null, is_active boolean not null default true,

-- timestamps
created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- create indexes for efficient querying
create index idx_exercises_muscle_group_id on public.exercises (muscle_group_id);

create index idx_exercises_muscle_subgroup_id on public.exercises (muscle_subgroup_id);

create index idx_exercises_slug on public.exercises (slug);

create index idx_exercises_type on public.exercises (exercise_type);

create index idx_exercises_active on public.exercises (is_active)
where
    is_active = true;

create index idx_exercises_group_subgroup on public.exercises (
    muscle_group_id,
    muscle_subgroup_id
);

-- create trigram index for full-text search on exercise names
-- requires pg_trgm extension enabled
create index idx_exercises_name_trgm on public.exercises using gin (name gin_trgm_ops);

-- enable row level security (public read access to active exercises)
alter table public.exercises enable row level security;

-- rls policy: allow anonymous users to read active exercises
create policy "Public read access to active exercises for anonymous users" on public.exercises for
select to anon using (is_active = true);

-- rls policy: allow authenticated users to read active exercises
create policy "Public read access to active exercises for authenticated users" on public.exercises for
select to authenticated using (is_active = true);

-- create trigger function to validate muscle_subgroup belongs to muscle_group
create or replace function public.validate_exercise_muscle_group()
returns trigger as $$
begin
  -- if muscle_subgroup_id is set, verify it belongs to the selected muscle_group
  if new.muscle_subgroup_id is not null then
    if not exists (
      select 1 from public.muscle_subgroups
      where id = new.muscle_subgroup_id
      and muscle_group_id = new.muscle_group_id
    ) then
      raise exception 'muscle_subgroup_id % does not belong to muscle_group_id %', 
        new.muscle_subgroup_id, new.muscle_group_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- create trigger to validate muscle group relationship
create trigger validate_exercise_muscle_group_before_insert_update
  before insert or update on public.exercises
  for each row
  execute function public.validate_exercise_muscle_group();

-- add comment to table
comment on
table public.exercises is 'Global library of exercises with categorization and instructions';