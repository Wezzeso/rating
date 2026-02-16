-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Table: Professors
create table public.professors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  department text not null,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Ratings
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  professor_id uuid not null references public.professors(id) on delete cascade,
  user_fingerprint text not null,
  teaching integer not null check (teaching >= 1 and teaching <= 5),
  proctoring integer not null check (proctoring >= 1 and proctoring <= 5),
  unique(professor_id, user_fingerprint)
);

-- RLS Policies
alter table public.professors enable row level security;
alter table public.ratings enable row level security;

-- Professors Policies
create policy "Enable read access for approved professors"
on public.professors for select
using (is_approved = true);

create policy "Enable read access for admins"
on public.professors for select
to authenticated
using (true);

create policy "Enable insert for everyone (suggestions)"
on public.professors for insert
with check (true);

create policy "Enable update for admins only"
on public.professors for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for admins only"
on public.professors for delete
to authenticated
using (true);

-- Ratings Policies
create policy "Enable read access for all"
on public.ratings for select
using (true);

create policy "Enable insert for all"
on public.ratings for insert
with check (true);

-- RPC Function: get_professors_with_ratings
create or replace function get_professors_with_ratings()
returns table (
  id uuid,
  name text,
  department text,
  is_approved boolean,
  created_at timestamptz,
  teaching_rating numeric,
  proctoring_rating numeric
)
language sql
as $$
  select
    p.id,
    p.name,
    p.department,
    p.is_approved,
    p.created_at,
    round(avg(r.teaching), 1) as teaching_rating,
    round(avg(r.proctoring), 1) as proctoring_rating
  from
    public.professors p
  left join
    public.ratings r on p.id = r.professor_id
  where
    p.is_approved = true
  group by
    p.id;
$$;
