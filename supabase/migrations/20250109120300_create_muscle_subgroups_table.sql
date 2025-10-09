-- migration: create_muscle_subgroups_table
-- purpose: create static dictionary table for muscle subgroups
-- affected: new table 'muscle_subgroups'
-- considerations: this table has foreign key to muscle_groups for hierarchical organization

-- create muscle_subgroups table as a static dictionary
create table public.muscle_subgroups (
  -- primary key
  id serial primary key,

-- foreign key to parent muscle group
muscle_group_id integer not null references public.muscle_groups (id) on delete cascade,

-- subgroup name (e.g., "upper", "middle", "lower")
name varchar(100) not null,

-- timestamp
created_at timestamp with time zone not null default now(),

-- ensure unique subgroup names within a muscle group
unique(muscle_group_id, name) );

-- create index on muscle_group_id for efficient joins
create index idx_muscle_subgroups_muscle_group_id on public.muscle_subgroups (muscle_group_id);

-- enable row level security (public read access)
alter table public.muscle_subgroups enable row level security;

-- rls policy: allow anonymous users to read muscle subgroups
create policy "Public read access to muscle subgroups for anonymous users" on public.muscle_subgroups for
select to anon using (true);

-- rls policy: allow authenticated users to read muscle subgroups
create policy "Public read access to muscle subgroups for authenticated users" on public.muscle_subgroups for
select to authenticated using (true);

-- add comment to table
comment on
table public.muscle_subgroups is 'Static dictionary of muscle subgroups for detailed exercise categorization';