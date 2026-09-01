# Wedding Planner

A simple wedding planning site: venue comparison, checklist/timeline, budget tracker,
guest list & RSVP, and vendor tracker. Plain HTML/CSS/JS (no build step), hosted on
GitHub Pages, with data synced across devices via [Supabase](https://supabase.com).

## 1. Create a Supabase project

1. Sign up at https://supabase.com and create a new project (free tier).
2. Go to the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and run it. This creates all tables and locks them down with Row Level Security so only
   signed-in users can read/write data.
3. Go to **Authentication -> Providers** and make sure **Email** is enabled.
4. Go to **Authentication -> Settings** and turn **off** "Allow new users to sign up" (or
   equivalent "Enable sign ups" toggle) so no one else can create an account.
5. Go to **Authentication -> Users** and manually add two users (you and your partner) with
   emails and passwords of your choice.

## 2. Connect the site to your project

1. In Supabase, go to **Project Settings -> API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open [`js/config.js`](js/config.js) and paste them in:
   ```js
   export const SUPABASE_URL = 'https://xxxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...';
   ```
   The anon key is meant to be public (it's used from the browser); real access control comes
   from Supabase Auth + the Row Level Security policies in `schema.sql`, not from hiding this key.

## 3. Run it locally

No build step is required. From the project root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 and log in with one of the accounts you created.

## 4. Deploy to GitHub Pages

1. Push this repo to GitHub (it needs to be a **public** repo for free GitHub Pages hosting).
2. In the GitHub repo, go to **Settings -> Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", branch `main`,
   folder `/ (root)`, then save.
4. After a minute, your site is live at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

- `index.html` / `js/dashboard.js` — countdown, wedding settings, summary stats.
- `login.html` — sign in / sign out.
- `venues.html` / `js/venues.js` — venue comparison & decision tracker.
- `checklist.html` / `js/checklist.js` — task checklist/timeline.
- `budget.html` / `js/budget.js` — budget tracker.
- `guests.html` / `js/guests.js` — guest list & RSVP tracking.
- `vendors.html` / `js/vendors.js` — vendor tracker.
- `js/config.js`, `js/supabaseClient.js`, `js/auth.js` — shared Supabase setup, session guard,
  shared nav bar.
- `supabase/schema.sql` — database schema + security policies.

## Notes

- Only the two accounts you create manually can log in — there's no public sign-up.
- Photos are linked by URL (no file upload) to keep things simple.
- Checklist due dates don't send reminders (no email/notification service is configured).
