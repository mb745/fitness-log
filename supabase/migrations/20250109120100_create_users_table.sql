-- migration: create_users_table
-- purpose: create users table that extends auth.users with profile information
-- affected: new table 'users'
-- considerations: this table has 1:1 relationship with auth.users

-- create users table to extend supabase auth.users with profile data
create table public.users (
  -- primary key references auth.users for 1:1 relationship
  id uuid primary key references auth.users(id) on delete cascade,

-- physical attributes
weight_kg decimal(5, 2) null check (
    weight_kg > 0
    and weight_kg <= 500
),
height_cm integer null check (
    height_cm >= 100
    and height_cm <= 250
),
gender varchar(20) null,

-- health information
injuries_limitations text null,

-- timestamps
created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- create index on created_at for sorting/filtering users by registration date
create index idx_users_created_at on public.users (created_at);

-- enable row level security
alter table public.users enable row level security;

-- rls policy: users can view their own profile
create policy "Users can view own profile" on public.users for
select using (auth.uid () = id);

-- rls policy: users can insert their own profile
create policy "Users can insert own profile" on public.users for
insert
with
    check (auth.uid () = id);

-- rls policy: users can update their own profile
create policy "Users can update own profile" on public.users for
update using (auth.uid () = id);

-- add comment to table
comment on
table public.users is 'User profiles extending auth.users with fitness-related information';