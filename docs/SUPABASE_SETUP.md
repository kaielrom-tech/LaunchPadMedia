# Supabase + Cloudflare Pages (reviews & contact from any device)

Follow these steps once. After that, reviews and contact messages are stored in **Supabase** and Admin works from any browser.

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

create policy "public insert contact_messages"
  on contact_messages for insert to anon, authenticated
  with check (true);

create policy "public insert reviews pending"
  on reviews for insert to anon, authenticated
  with check (status = 'pending');

create policy "public read approved reviews"
  on reviews for select to anon, authenticated
  using (status = 'approved');
```

If you previously enabled **auto-publish** (`public insert reviews approved`), switch back with:

```sql
drop policy if exists "public insert reviews approved" on reviews;

create policy "public insert reviews pending"
  on reviews for insert to anon, authenticated
  with check (status = 'pending');
```

3. **Project Settings → API**: copy **Project URL** and **anon public** key.

## 2. Cloudflare Pages project

- Connect this repo and set **Build command**: `npm install && npm run build`
- **Build output directory**: `.` (repo root)
- Commit includes **`functions/api/`** (Pages Functions) and **`wrangler.toml`** (`nodejs_compat` for `@supabase/supabase-js`).

If the dashboard offers **Compatibility flags**, enable **Node.js compatibility** (matches `wrangler.toml`).

### Environment variables (Production + Preview)

**Workers & Pages → your project → Settings → Variables and secrets** (or Environment variables):

| Variable | Notes |
|----------|--------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | **anon public** key (browser-safe with RLS above) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** — server only, never in client JS |
| `LPM_ADMIN_PASSWORD` | Strong secret for Admin login |

Optional:

| Variable | Default |
|----------|---------|
| `LPM_ADMIN_FUNCTION_URL` | `/api/lpm-admin` |
| `LPM_GMAIL_HINT` | Shown in Admin next to Gmail compose |

Save and **redeploy**.

### How the browser gets Supabase settings

1. **Build**: `npm run build` runs `scripts/inject-lpm-config.mjs` and can bake URL + anon key into **`js/lpm-config.js`** if those vars exist at **build time**.
2. **Runtime**: **`js/lpm-runtime-config.js`** calls **`GET /api/lpm-public-config`**, which reads the same vars in the **Function** environment. Use this if you only set secrets for Workers (not the build).

Admin API: **`POST /api/lpm-admin`** (same password + ops as before).

### Smoke test

After deploy, open:

- `https://YOUR_DOMAIN/api/lpm-public-config` — should return JSON with `supabaseUrl` and `supabaseAnonKey` set.

## 3. Local development

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ..."
npm run build
```

Serve the folder over **http(s)** (not `file://`). For Functions locally:

```bash
npx wrangler pages dev . --compatibility-flags=nodejs_compat
```

## 4. Manual `lpm-config.js` (no CI inject)

You may set `supabaseUrl` and `supabaseAnonKey` by hand in **`js/lpm-config.js`** (anon key only). Prefer env + inject or `/api/lpm-public-config` so keys are not committed.

## 5. Admin login

- **Cloud mode**: password is **`LPM_ADMIN_PASSWORD`** (Cloudflare env).
- **Local-only** (empty Supabase URL in config): password is **`LOCAL_ADMIN_PASSWORD`** in `js/admin-app.js` (default `launchpad2026`).

## Security

- The **anon** key is public; RLS must block reading private messages.
- Only **`/api/lpm-admin`** uses the **service role**, and it requires **LPM_ADMIN_PASSWORD** on every request.
