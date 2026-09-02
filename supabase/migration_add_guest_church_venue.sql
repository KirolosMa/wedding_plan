-- Run once in the Supabase SQL editor to track which event each guest is invited to
-- (church ceremony vs. reception venue, tracked independently). Safe to re-run.
alter table public.guests add column if not exists invited_church boolean not null default true;
alter table public.guests add column if not exists invited_venue boolean not null default true;
