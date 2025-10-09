-- migration: create_muscle_groups_table
-- purpose: create static dictionary table for muscle groups
-- affected: new table 'muscle_groups'
-- considerations: this is a read-only reference table for categorizing exercises

-- create muscle_groups table as a static dictionary
create table public.muscle_groups (
  -- primary key
  id serial primary key,

-- muscle group name (e.g., "Chest", "Back", "Legs")
name varchar(100) not null unique,

-- timestamp
created_at timestamp with time zone not null default now() );

-- enable row level security (public read access)
alter table public.muscle_groups enable row level security;

-- rls policy: allow anonymous users to read muscle groups
create policy "Public read access to muscle groups for anonymous users" on public.muscle_groups for
select to anon using (true);

-- rls policy: allow authenticated users to read muscle groups
create policy "Public read access to muscle groups for authenticated users" on public.muscle_groups for
select to authenticated using (true);

-- add comment to table
comment on
table public.muscle_groups is 'Static dictionary of muscle groups for exercise categorization';