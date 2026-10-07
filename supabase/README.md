# Supabase Backend Setup

This directory contains the Supabase database schema, migrations, seed data, and helper SQL functions.

## Files

- `migrations/20240919_init.sql` — Full schema: tables (`profiles`, `categories`, `products`, `projects`, `reviews`, `services`, `leads`, `site_settings`, `media`, `audit_logs`), indexes, `updated_at` triggers, RLS and policies. Idempotent — every DDL/policy statement is guarded, so it can be (re-)applied to a partially provisioned project without touching existing tables.
- `migrations/20240920_remote_completion.sql` — **Remote completion migration.** Creates the tables still missing on the remote project (profiles, categories, services, leads, site_settings, media, audit_logs), their RLS/policies, all four storage buckets and policies, and seeds factual business data only. Non-destructive: products/projects/reviews are never referenced.
- `functions/set_updated_at.sql` — Source of the `set_updated_at()` trigger function (inlined into the migrations; `\include` is a psql meta-command rejected by the dashboard SQL editor).
- `seed.sql` — Idempotent seed for `categories` (the 10 required material categories, copy identical to `lib/content/catalog.ts`).

## Current remote state (verified via REST API)

- **Exists:** `products`, `projects`, `reviews`
- **Missing:** `profiles`, `categories`, `services`, `leads`, `site_settings`, `media`, `audit_logs`
- Storage buckets: `products`, `projects`, `services`, `site-assets` (created by the completion migration if absent)

## Apply the completion migration (REQUIRED)

The Supabase CLI is **not installed** on this machine, the repository is **not linked** (no `config.toml`), and no access token is configured, so `supabase db push` cannot run from here. Choose one:

### Option A — Dashboard SQL Editor (no credentials needed)

1. Supabase Dashboard → your project → **SQL Editor** → **New query**.
2. Paste the full contents of `migrations/20240920_remote_completion.sql`.
3. **Run**. The script is fully idempotent — safe to run more than once.
4. Verify with the queries below.

### Option B — Supabase CLI (requires project credentials)

```bash
supabase login                      # or set SUPABASE_ACCESS_TOKEN
supabase link --project-ref <project-ref>
supabase db push                    # applies migrations in filename order
```

Never put the service-role key in `NEXT_PUBLIC_*` or in any browser code.

## Post-apply verification

Run in the SQL Editor:

```sql
-- every row must return 'ok'; a missing row means the table/RLS step failed
select 'categories' as t, count(*) > 0 as seeded from public.categories
union all select 'services', count(*) > 0 from public.services
union all select 'site_settings', count(*) > 0 from public.site_settings
union all select 'leads_table', count(*) >= 0 from public.leads;
```

And from the app (anon key only):

- `GET {SUPABASE_URL}/rest/v1/categories?select=id&limit=1` → `200`
- `GET {SUPABASE_URL}/rest/v1/services?select=id&limit=1` → `200`
- `GET {SUPABASE_URL}/rest/v1/site_settings?select=id&limit=1` → `200`
- `GET {SUPABASE_URL}/rest/v1/leads?select=id&limit=1` → `200` with `[]` (table exists; anon SELECT is blocked by RLS, so an empty array is the **correct** result)
- `POST /api/leads` with a valid payload → lead persisted; invalid payload → field errors

## Leads security model

- `anon`: **INSERT only** (`insert_leads`). No SELECT/UPDATE/DELETE policy exists for anon — RLS denies by default.
- `admin`/`editor` profile rows: SELECT + UPDATE via `select_leads_admin` / `update_leads_admin`.
- Service role is used only inside isolated server-side admin code (`lib/supabase/admin.ts`), never shipped to the browser.

## Storage buckets

- `products`, `projects`, `services`, `site-assets` — public **read** only (required by the site).
- Uploads (INSERT/UPDATE/DELETE) require an authenticated admin/editor profile row. Upload is never public.

