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

## 2. Configure the site

Edit **`js/lpm-config.js`**:

- Set `supabaseUrl` to your Project URL.
- Set `supabaseAnonKey` to the **anon** key (safe in the browser with the policies above).

## 3. Netlify environment variables

In **Netlify → Site → Environment variables**, add:

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | Same as Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (Settings → API — keep secret, never put in `lpm-config.js`) |
| `LPM_ADMIN_PASSWORD` | Your admin password (replace the old hardcoded one) |

Redeploy after saving variables.

## 4. Install dependencies (for functions)

From the repo root:

```bash
npm install
```

Netlify will run `npm install` on build if `package.json` exists.

## 5. Admin login

- With **remote** configured: password is checked against **`LPM_ADMIN_PASSWORD`** on the server (set in Netlify).
- With **empty** `supabaseUrl`: the site still uses **localStorage** and the password in `js/admin-app.js` (`LOCAL_ADMIN_PASSWORD`).

## Security notes

- The **anon** key is public; RLS blocks reading private messages from the internet.
- Only the **Netlify function** uses the **service role** key, and it requires your admin password on every request.
- Change **`LPM_ADMIN_PASSWORD`** to a strong secret and remove any old password from git history if you committed it.
