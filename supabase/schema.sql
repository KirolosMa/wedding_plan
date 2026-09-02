-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Built-in gen_random_uuid() needs pgcrypto on older Postgres versions.
create extension if not exists pgcrypto;

-- Single-row table holding shared wedding details, edited from the dashboard.
create table if not exists public.wedding_info (
  id integer primary key default 1 check (id = 1),
  couple_names text,
  wedding_date date,
  total_budget numeric default 0
);
insert into public.wedding_info (id, couple_names, wedding_date, total_budget)
values (1, 'Add your names here', null, 0)
on conflict (id) do nothing;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  price numeric,
  capacity integer,
  rating integer check (rating between 1 and 5),
  pros text,
  cons text,
  notes text,
  photo_url text,
  status text not null default 'considering' check (status in ('considering', 'visited', 'booked', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  due_date date,
  done boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  estimated_cost numeric not null default 0,
  actual_cost numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  side text check (side in ('bride', 'groom', 'both')),
  invited boolean not null default true,
  invited_church boolean not null default true,
  invited_venue boolean not null default true,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'yes', 'no')),
  meal_choice text,
  plus_one boolean not null default false,
  notes text,
  phone text,
  created_at timestamptz not null default now()
);

-- Added after the first deploy; keeps re-runs of this file upgrading an existing database.
alter table public.guests add column if not exists phone text;
alter table public.guests add column if not exists invited_church boolean not null default true;
alter table public.guests add column if not exists invited_venue boolean not null default true;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  category text,
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  price numeric,
  status text not null default 'considering' check (status in ('considering', 'contacted', 'booked', 'paid')),
  notes text,
  created_at timestamptz not null default now()
);

-- No login: anyone with the anon key (public in the deployed site) can read/write freely.
alter table public.wedding_info enable row level security;
alter table public.venues enable row level security;
alter table public.checklist_items enable row level security;
alter table public.budget_items enable row level security;
alter table public.guests enable row level security;
alter table public.vendors enable row level security;

-- Dropped first so this file can be re-run on an existing project without erroring.
drop policy if exists "Public full access" on public.wedding_info;
drop policy if exists "Public full access" on public.venues;
drop policy if exists "Public full access" on public.checklist_items;
drop policy if exists "Public full access" on public.budget_items;
drop policy if exists "Public full access" on public.guests;
drop policy if exists "Public full access" on public.vendors;

create policy "Public full access" on public.wedding_info for all to anon using (true) with check (true);
create policy "Public full access" on public.venues for all to anon using (true) with check (true);
create policy "Public full access" on public.checklist_items for all to anon using (true) with check (true);
create policy "Public full access" on public.budget_items for all to anon using (true) with check (true);
create policy "Public full access" on public.guests for all to anon using (true) with check (true);
create policy "Public full access" on public.vendors for all to anon using (true) with check (true);
