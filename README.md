# Wedding Planner

A simple wedding planning site: venue comparison, checklist/timeline, budget tracker,
guest list & RSVP, and vendor tracker. Plain HTML/CSS/JS (no build step), hosted on
GitHub Pages, with data synced across devices via [Supabase](https://supabase.com).

## 1. Create a Supabase project

1. Sign up at https://supabase.com and create a new project (free tier).
2. Go to the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and run it. This creates all tables and opens them up to the public `anon` key.
3. (Optional) Also run these in the SQL editor to bulk-load data already gathered:
   - [`supabase/seed_guests.sql`](supabase/seed_guests.sql) — the guest list (side/RSVP/meal
     come in unset — fill those in later on guests.html).
   - [`supabase/seed_venues.sql`](supabase/seed_venues.sql) — venue options pulled from the
     "Wedding Venues" WhatsApp group (prices/capacities as quoted by each venue; add your own
     ratings/status on venues.html as you visit/decide).
   - [`supabase/seed_vendors.sql`](supabase/seed_vendors.sql) — catering/planner/DJ/photography
     leads from the same group chat.

> **No login/access control.** There's no sign-in page — anyone who has your site URL can
> view and edit all the data (guests, budget, etc.), since the Supabase anon key is public in
> this repo's client-side code. Fine for a low-stakes personal project shared with your
> partner; don't share the URL if you'd rather keep it private, and don't put anything
> sensitive (like full guest addresses or payment details) into the data.

## 2. Connect the site to your project

1. In Supabase, go to **Project Settings -> API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open [`js/config.js`](js/config.js) and paste them in:
   ```js
   export const SUPABASE_URL = 'https://xxxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...';
   ```

## 3. Run it locally

No build step is required. From the project root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## 4. Deploy to GitHub Pages

1. Push this repo to GitHub (it needs to be a **public** repo for free GitHub Pages hosting).
2. In the GitHub repo, go to **Settings -> Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", branch `main`,
   folder `/ (root)`, then save.
4. After a minute, your site is live at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

- `index.html` / `js/dashboard.js` — countdown, wedding settings, summary stats.
- `venues.html` / `js/venues.js` — venue comparison & decision tracker.
- `checklist.html` / `js/checklist.js` — task checklist/timeline.
- `budget.html` / `js/budget.js` — budget tracker.
- `guests.html` / `js/guests.js` — guest list & RSVP tracking.
- `vendors.html` / `js/vendors.js` — vendor tracker.
- `js/config.js`, `js/supabaseClient.js`, `js/nav.js` — shared Supabase setup + shared nav bar.
- `supabase/schema.sql` — database schema + security policies.

## Notes

- There's no login — see the access control warning above.
- Photos are linked by URL (no file upload) to keep things simple.
- Checklist due dates don't send reminders (no email/notification service is configured).
