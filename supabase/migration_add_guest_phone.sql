-- Run once in the Supabase SQL editor to add guest mobile numbers (used for RSVP links today
-- and automated WhatsApp/SMS invites later). Safe to re-run.
alter table public.guests add column if not exists phone text;
