-- Optional one-time seed: run in the Supabase SQL editor (after schema.sql) to bulk-load
-- vendor leads gathered from the "Wedding Venues" WhatsApp group export (chat + PDFs).
insert into public.vendors (category, name, contact_name, contact_email, contact_phone, price, notes, status) values
  (
    'Catering',
    'LO Experiential Catering Collection',
    null,
    null,
    null,
    1400,
    '6 catering tiers, per person: Experiential passarounds EGP 1,400, Classic buffet EGP 1,590 (or a la carte buffet), A la carte seated set menu EGP 1,900, Dinatoire buffet EGP 2,490, Signature buffet EGP 2,890, Grand Buffet Experience EGP 3,490. All-inclusive of unlimited non-alcoholic drinks, setup, service, waiters, tax and transportation in Greater Cairo. No contact info was included in the shared PDF.',
    'considering'
  ),
  (
    'Catering',
    'The Kitchen Club',
    null,
    null,
    null,
    null,
    'Instagram: instagram.com/the.kitchen.club - shared as a catering recommendation in the group chat, no pricing given yet.',
    'considering'
  ),
  (
    'Entertainment',
    'El Andalos Agency',
    'Hosny Elbeltagy',
    null,
    '+20100 514 8965',
    null,
    'Recommended entertainment agency (per Sofitel''s wedding packages document).',
    'considering'
  ),
  (
    'Wedding Planner',
    'Golden Events',
    'Taha Ibrahim',
    null,
    '+20100 044 7828',
    null,
    'Instagram: instagram.com/taha.i.saleh - recommended wedding planner (per Sofitel''s wedding packages document).',
    'considering'
  ),
  (
    'Wedding Planner',
    'Azza El Kady',
    'Azza El Kady',
    null,
    '+20100 111 1590',
    null,
    'Instagram: instagram.com/azzaelkadyweddings - recommended wedding planner (per Sofitel''s wedding packages document).',
    'considering'
  ),
  (
    'Wedding Planner',
    'Evantastic',
    'Hanan Mohamed',
    null,
    '+20127 562 0100',
    null,
    'fb.com/Eventastic.event - recommended wedding planner (per Sofitel''s wedding packages document).',
    'considering'
  ),
  (
    'Wedding Planner',
    'ROSA Events',
    'Amira / Habiba',
    null,
    '+20103 153 7555 / +20122 323 8614',
    null,
    'Instagram: instagram.com/rosa.event.planning - recommended wedding planner (per Sofitel''s wedding packages document).',
    'considering'
  ),
  (
    'DJ',
    'DJ Faramawy',
    null,
    null,
    null,
    null,
    'Instagram: instagram.com/dj.faramawy - shared as a DJ recommendation in the group chat.',
    'considering'
  ),
  (
    'Photography',
    'Amr Farrag Photography',
    'Amr Farrag',
    null,
    null,
    null,
    'Instagram: instagram.com/amr.farrag.photography - shared as a photography recommendation in the group chat.',
    'considering'
  );
