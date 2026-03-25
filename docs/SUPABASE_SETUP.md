# Supabase + Netlify (reviews & contact from any device)

Follow these steps once. After that, contact messages and reviews are stored in **Supabase** and show in **Admin** from any browser.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. In **SQL Editor**, run:

```sql
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  service text default '',
  msg text not null,
  submitted timestamptz default now(),
  read boolean default false,
  replied boolean default false,
  reply_draft text default ''
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stars int not null check (stars >= 1 and stars <= 5),
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted timestamptz default now()
);

alter table contact_messages enable row level security;
alter table reviews enable row level security;

-- Public: submit contact (no read access)
create policy "public insert contact_messages"
  on contact_messages for insert to anon, authenticated
  with check (true);

-- Public: submit review as pending only
create policy "public insert reviews pending"
  on reviews for insert to anon, authenticated
  with check (status = 'pending');

-- Public: read approved reviews only (home page)
create policy "public read approved reviews"
  on reviews for select to anon, authenticated
  using (status = 'approved');
```

3. **Project Settings → API**: copy **Project URL** and **anon public** key.

## 2. Netlify environment variables (required for “any device”)

In **Netlify → Site → Environment variables**, add:

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | Project URL (same as in Supabase **Settings → API**) |
| `SUPABASE_ANON_KEY` | **anon public** key (safe for the browser with RLS above — **not** the service_role key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (server only; used by `lpm-admin` — never expose in the client) |
| `LPM_ADMIN_PASSWORD` | Strong secret for Admin login |

On each deploy, **`npm run build`** runs **`scripts/inject-lpm-config.mjs`**, which writes **`js/lpm-config.js`** with `SUPABASE_URL` and `SUPABASE_ANON_KEY` baked in. You do **not** need to commit real keys to git.

Optional:

| Variable | Value |
|----------|--------|
| `LPM_ADMIN_FUNCTION_URL` | Default `/.netlify/functions/lpm-admin` — override if you change the function path |
| `LPM_GMAIL_HINT` | Email string shown in Admin next to Gmail compose |

Redeploy after saving variables.

### Local development with Supabase

From the repo root (PowerShell example):

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ..."
npm run build
```

Then open the site over **http(s)** (e.g. a static server), not `file://`.

### Local-only (no Supabase)

Do not set those env vars; keep the committed empty `js/lpm-config.js` or run `npm run build` with no env — Admin stays on **localStorage** for that browser only.

## 3. Manual config (without Netlify inject)

You can instead edit **`js/lpm-config.js`** by hand and set `supabaseUrl` + `supabaseAnonKey` (still use the **anon** key only). Prefer env injection on Netlify so keys are not committed.

## 4. Install dependencies (for functions)

From the repo root:

```bash
npm install
```

Netlify runs **`npm install && npm run build`** (see `netlify.toml`).

## 5. Admin login

- With **remote** configured: password is checked against **`LPM_ADMIN_PASSWORD`** on the server (set in Netlify).
- With **empty** `supabaseUrl`: the site still uses **localStorage** and the password in `js/admin-app.js` (`LOCAL_ADMIN_PASSWORD`).

## Security notes

- The **anon** key is public; RLS blocks reading private messages from the internet.
- Only the **Netlify function** uses the **service role** key, and it requires your admin password on every request.
- Change **`LPM_ADMIN_PASSWORD`** to a strong secret and remove any old password from git history if you committed it.
