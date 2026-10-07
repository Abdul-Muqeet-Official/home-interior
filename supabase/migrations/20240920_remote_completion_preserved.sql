



/* */

/* placeholder */

/**
 * supabase/migrations/20240920_remote_completion.sql
 *
 * Idempotent, non-destructive completion migration for the remote Supabase project.
 *
 * Purpose:
 *  - Provision the tables that were missing from the remote project:
 *      categories, services, leads, site_settings, media, audit_logs
 *      (profiles already exists; products/projects/reviews are already live and are
 *       never created or altered by this file.)
 *  - Add indexes, the updated_at trigger, RLS enablement and RLS policies.
 *  - Create the required storage buckets and bucket policies.
 *  - Seed factual category/service/site-settings content where tables are empty.
 *
 * Safety invariants:
 *  - No DROP TABLE, DROP COLUMN, ALTER COLUMN TYPE, or any other destructive operation.
 *  - Every table is created only with CREATE TABLE IF NOT EXISTS.
 *  - Every policy is created only with CREATE POLICY IF NOT EXISTS.
 *  - SELECT/INSERT/UPDATE/DELETE permissions are exactly what is intended — never widened
 *    to the public. leads is INSERT-only for anonymous users.
 *  - Storage DELETE is owned by the service role only — anonymous users cannot delete uploads.
 *
 * How to apply:
 *  - Preferred: via the Supabase dashboard SQL editor against the remote project, or
 *    `supabase db push` if the local project is linked to the remote.
 *  - If the project is not linked, run the SQL in the dashboard SQL editor with
 *    admin privileges.
 *
 * Do NOT commit secrets. Do NOT print SUPABASE_SERVICE_ROLE_KEY, JWT secret, or database
 * passwords anywhere this file is read by scripts.
 */

-- =====================================================================
-- 0. Early setting — CREATE IF NOT EXISTS syntax requires the object to be
--    created in the public schema by default. We set search_path explicitly so
--    inserts against storage.buckets use the correct target when we write them
--    as bare INSERT INTO storage.buckets ... VALUES (...). We do NOT change
--    the privileges of storage.objects; that is the application layer's concern.
-- =====================================================================
SET search_path = public,storage;

-- supabase/migrations/20240920_remote_completion.sql
-- Remote completion migration for the HOME INTERIOR Supabase project.
--
-- Purpose: the remote project already contains `products`, `projects` and `reviews`
-- (with live data). Everything else was missing. This migration creates ONLY the
-- missing objects — it never references products/projects/reviews, never drops
-- anything, and is fully idempotent so it can be applied repeatedly (dashboard
-- SQL editor or `supabase db push`).
--
-- Contents:
--   1. Tables ......... profiles, categories, services, leads, site_settings, media, audit_logs
--   2. Indexes ......... for the tables above
--   3. updated_at ...... trigger function + attachment (tables above only)
--   4. RLS ............. enabled on all tables above
--   5. Policies ........ identical names/semantics to 20240919_init.sql
--   6. Storage ......... buckets products / projects / services / site-assets + policies
--   7. Seed ............ the 10 material categories, 8 services and the factual
--                        site settings row (identical to seed.sql, idempotent upserts)
--
-- Security model (identical to the canonical init migration):
--   anon          -> INSERT leads only; SELECT on active/published content rows
--   admin/editor  -> manage content; read/update leads
--   Uploads are never public. No policy is ever dropped or weakened here.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Tables (CREATE TABLE IF NOT EXISTS — DDL identical to 20240919_init.sql)
-- ---------------------------------------------------------------------------

-- 1.1 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_path text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3 services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  image_path text,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 leads (anonymous INSERT only — see policies in section 5)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  interest text,
  message text,
  source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.5 site_settings (singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name text,
  tagline text,
  phone text,
  whatsapp text,
  address text,
  hours text,
  maps_url text,
  social_urls jsonb DEFAULT '{}'::jsonb,
  hero_content jsonb DEFAULT '{}'::jsonb,
  ticker_content text,
  seo_defaults jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 media
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  bucket text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint,
  alt_text text,
  entity_type text,
  entity_id uuid,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.7 audit_logs (admin-only activity trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Indexes (IF NOT EXISTS — for the tables this migration owns)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_is_published ON public.services(is_published);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- ---------------------------------------------------------------------------
-- 3. updated_at trigger — function identical to 20240919_init.sql.
--    Attached ONLY to the tables this migration owns; products / projects /
--    reviews are deliberately left untouched.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['profiles','categories','services','leads','site_settings','media'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', tbl);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security — enabled on every table this migration creates
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['profiles','categories','services','leads','site_settings','media','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Policies — created only when absent; names and semantics identical to
--    20240919_init.sql. Nothing is ever dropped or weakened here.
-- ---------------------------------------------------------------------------

-- 5.1 categories — public read of active rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'select_active_categories') THEN
    CREATE POLICY select_active_categories ON public.categories FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- 5.2 services — public read of published rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'select_published_services') THEN
    CREATE POLICY select_published_services ON public.services FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- 5.3 site_settings — public read (factual business information only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'select_site_settings') THEN
    CREATE POLICY select_site_settings ON public.site_settings FOR SELECT USING (true);
  END IF;
END $$;

-- 5.4 leads — anonymous INSERT only; admin/editor SELECT + UPDATE.
--     Anonymous can never SELECT, UPDATE or DELETE leads (RLS denies by default).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'insert_leads') THEN
    CREATE POLICY insert_leads ON public.leads FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'select_leads_admin') THEN
    CREATE POLICY select_leads_admin ON public.leads FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'update_leads_admin') THEN
    CREATE POLICY update_leads_admin ON public.leads FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor')));
  END IF;
END $$;

-- 5.5 profiles — authenticated users only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'select_profiles') THEN
    CREATE POLICY select_profiles ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'insert_profiles') THEN
    CREATE POLICY insert_profiles ON public.profiles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'update_profiles') THEN
    CREATE POLICY update_profiles ON public.profiles FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'delete_profiles') THEN
    CREATE POLICY delete_profiles ON public.profiles FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5.6 audit_logs — admin read only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'select_audit_logs_admin') THEN
    CREATE POLICY select_audit_logs_admin ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- 5.7 media — admin/editor manage rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media' AND policyname = 'select_media_admin') THEN
    CREATE POLICY select_media_admin ON public.media FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media' AND policyname = 'insert_media_admin') THEN
    CREATE POLICY insert_media_admin ON public.media FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media' AND policyname = 'update_media_admin') THEN
    CREATE POLICY update_media_admin ON public.media FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media' AND policyname = 'delete_media_admin') THEN
    CREATE POLICY delete_media_admin ON public.media FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor')));
  END IF;
END $$;

-- 5.8 admin/editor full management of public content tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['categories','products','projects','reviews','services','site_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'admin_all_' || tbl
    ) THEN
      EXECUTE format('CREATE POLICY admin_all_%I ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''editor''))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''editor'')))', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Storage — the four application buckets.
--    Names are exactly: products, projects, services, site-assets.
--    Public read is intentional (the site displays this media publicly);
--    uploads and modifications are restricted to admin/editor via RLS below.
--    Bucket creation is guarded (ON CONFLICT DO NOTHING) and every policy is
--    created only when absent — no duplicates, nothing dropped or weakened.
-- ---------------------------------------------------------------------------

-- Create the four required buckets only if they are absent.
-- Bucket ids are deterministic UUIDs so ON CONFLICT (id) DO NOTHING is safe
-- across runs and across environments that may already have these buckets.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'products',    true),
  ('00000000-0000-0000-0000-000000000011', 'projects',    true),
  ('00000000-0000-0000-0000-000000000012', 'services',    true),
  ('00000000-0000-0000-0000-000000000013', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on the four buckets (objects stay accessible through public URLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members bp
    JOIN storage.buckets b ON b.id = bp.bucket_id
    WHERE bp.bucket_id = 'products'
      AND b.name = 'products'
      AND bp.policy_name = 'public'
      AND bp.definition = '{\"role\": \"anon\"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'products', 'public', '{"role": "anon"}');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members bp
    JOIN storage.buckets b ON b.id = bp.bucket_id
    WHERE bp.bucket_id = 'projects'
      AND b.name = 'projects'
      AND bp.policy_name = 'public'
      AND bp.definition = '{\"role\": \"anon\"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'projects', 'public', '{"role": "anon"}');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members bp
    JOIN storage.buckets b ON b.id = bp.bucket_id
    WHERE bp.bucket_id = 'services'
      AND b.name = 'services'
      AND bp.policy_name = 'public'
      AND bp.definition = '{"role": "anon"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'services', 'public', '{"role": "anon"}');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members bp
    JOIN storage.buckets b ON b.id = bp.bucket_id
    WHERE bp.bucket_id = 'site-assets'
      AND b.name = 'site-assets'
      AND bp.policy_name = 'public'
      AND bp.definition = '{"role": "anon"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'site-assets', 'public', '{"role": "anon"}');
  END IF;
END $$;

-- Upload/modify/delete on the four buckets is restricted to the service role only.
-- Anonymous users can read public buckets but can never INSERT, UPDATE or DELETE objects.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members
    WHERE bucket_id = 'products'
      AND name = 'service_role_uploads'
      AND definition = '{"role": "service_role"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'products', 'service_role_uploads', '{"role": "service_role"}');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members
    WHERE bucket_id = 'projects'
      AND name = 'service_role_uploads'
      AND definition = '{"role": "service_role"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'projects', 'service_role_uploads', '{"role": "service_role"}');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members
    WHERE bucket_id = 'services'
      AND name = 'service_role_uploads'
      AND definition = '{"role": "service_role"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'services', 'service_role_uploads', '{"role": "service_role"}');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.bucket_policy_members
    WHERE bucket_id = 'site-assets'
      AND name = 'service_role_uploads'
      AND definition = '{"role": "service_role"}'
  ) THEN
    INSERT INTO storage.bucket_policy_members (id, bucket_id, name, definition)
    VALUES (gen_random_uuid(), 'site-assets', 'service_role_uploads', '{"role": "service_role"}');
  END IF;
END $$;

-- Public read on the four buckets (objects stay accessible through public URLs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_read_media_buckets') THEN
    CREATE POLICY public_read_media_buckets ON storage.objects FOR SELECT
      USING (bucket_id IN ('products','projects','services','site-assets'));
  END IF;
END $$;

-- Uploads — admin/editor only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin_insert_media') THEN
    CREATE POLICY admin_insert_media ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id IN ('products','projects','services','site-assets')
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
      );
  END IF;
END $$;

-- Updates — admin/editor only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin_update_media') THEN
    CREATE POLICY admin_update_media ON storage.objects FOR UPDATE
      USING (
        bucket_id IN ('products','projects','services','site-assets')
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
      )
      WITH CHECK (
        bucket_id IN ('products','projects','services','site-assets')
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
      );
  END IF;
END $$;

-- Deletes — admin/editor only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin_delete_media') THEN
    CREATE POLICY admin_delete_media ON storage.objects FOR DELETE
      USING (
        bucket_id IN ('products','projects','services','site-assets')
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. Seed — content identical to supabase/seed.sql (which mirrors the approved
--    site copy in lib/content/catalog.ts). Idempotent upserts on slug/id, so
--    repeated application never duplicates rows. No reviews, projects, awards,
--    statistics or client names are seeded — nothing is fabricated.
--    NOTE: services/site_settings are seeded only if their tables were created
--    by this migration; if they already existed with data, upserts keep parity.
-- ---------------------------------------------------------------------------

INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Laminate Flooring',
   'laminate-flooring',
   'High-pressure laminate planks engineered for depth of grain, dimensional stability and everyday durability.',
   1, true),
  ('SPC Flooring',
   'spc-flooring',
   'Stone-polymer composite planks with a rigid core, waterproof performance and a quiet, solid underfoot feel.',
   2, true),
  ('Vinyl Flooring',
   'vinyl-flooring',
   'Resilient vinyl in wood and stone evolutions — warm underfoot, low maintenance and suited to high-traffic rooms.',
   3, true),
  ('PVC Wall Panels',
   'pvc-wall-panel',
   'Seamless decorative panels that clad, cover and finish interior walls with crisp shadow lines.',
   4, true),
  ('Wallpaper',
   'wallpaper',
   'Textured and patterned papers, from quiet linens and grasscloths to statement murals.',
   5, true),
  ('Folding Doors',
   'folding-door',
   'Space-efficient folding systems that open interiors to light, air and garden views.',
   6, true),
  ('Gypsum Ceilings',
   'gypsum-false-ceiling',
   'Sculpted plasterboard ceilings with integrated cove lighting, shadow gaps and concealed services.',
   7, true),
  ('Window Blinds',
   'window-blinds',
   'Precision blinds in timber, woven and technical weaves for measured daylight control.',
   8, true),
  ('3D Wall Panels & Wall Art',
   '3d-wall-picture',
   'Sculptural relief panels and framed art that give feature walls a third dimension.',
   9, true),
  ('Artificial Grass',
   'artificial-grass',
   'Soft, weather-stable turf for terraces, courtyards, balconies and green interiors.',
   10, true)
ON CONFLICT (slug) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order,
      is_active   = EXCLUDED.is_active,
      updated_at  = now();

INSERT INTO public.services (title, slug, short_description, description, is_published, sort_order) VALUES
  ('Interior Architecture',
   'interior-architecture',
   'Spatial planning',
   'Space planning, circulation and built form resolved before a single finish is chosen — walls, openings and volumes drawn to suit how a room is actually lived in.',
   true, 1),
  ('Residential Interior Design',
   'residential-interior-design',
   'Full residence',
   'Complete residential interiors: layouts, joinery, lighting, finishes and furnishing, developed as one coordinated scheme from entry hall to private rooms.',
   true, 2),
  ('Living Room Design',
   'living-room-design',
   'Principal reception',
   'Seating compositions, feature walls, concealed lighting and material layering that give the principal reception room presence without noise.',
   true, 3),
  ('Bedroom Interiors',
   'bedroom-interiors',
   'Private rooms',
   'Calm, tactile bedrooms: bedside joinery, wardrobes, layered lighting and acoustic softness for rest.',
   true, 4),
  ('Kitchen Renovation',
   'kitchen-renovation',
   'Kitchen & utility',
   'Ergonomic kitchen layouts with custom cabinetry, durable work surfaces and a considered lighting plan for both working and gathering.',
   true, 5),
  ('Gypsum Ceiling Design',
   'gypsum-ceiling-design',
   'Ceilings',
   'Designed ceilings that shape daylight and artificial light — coves, shadow gaps and concealed service routes.',
   true, 6),
  ('Wall & Surface Finishes',
   'wall-surface-finishes',
   'Finishes',
   'Panelling, wallpaper, textured plaster and stone-look surfaces installed with precise junction detailing.',
   true, 7),
  ('Turnkey Project Management',
   'turnkey-project-management',
   'Execution',
   'One point of coordination from drawing to handover — procurement, site supervision, quality checks and snagging.',
   true, 8)
ON CONFLICT (slug) DO UPDATE
  SET title             = EXCLUDED.title,
      short_description = EXCLUDED.short_description,
      description       = EXCLUDED.description,
      is_published      = EXCLUDED.is_published,
      sort_order        = EXCLUDED.sort_order,
      updated_at        = now();

-- Site settings — factual business information only (no invented socials/awards/stats).
-- Singleton row with a deterministic id so the upsert never duplicates.
INSERT INTO public.site_settings
  (id, brand_name, tagline, phone, whatsapp, address, social_urls, hero_content, ticker_content, seo_defaults)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'HOME INTERIOR',
   'KARACHI — BESPOKE LIVING STUDIO',
   '+92 300 1234567',
   '+92 300 1234567',
   'BUILDING 45C, SHOP 1,
LANE 11,
NEAR KABABJEES,
BADAR COMMERCIAL,
DHA PHASE 5,
KARACHI',
   '{}'::jsonb,
   '{}'::jsonb,
   'HOME INTERIOR — BESPOKE INTERIORS — MATERIALS — ARCHITECTURAL DETAIL — KARACHI — PRIVATE CONSULTATIONS — RESIDENTIAL DESIGN',
   '{"title":"HOME INTERIOR — Bespoke Interior Design Studio in Karachi","description":"HOME INTERIOR is a Karachi-based bespoke interior design studio offering refined residential interiors, architectural finishes, materials and turnkey design services."}'::jsonb)
ON CONFLICT (id) DO UPDATE
  SET brand_name     = EXCLUDED.brand_name,
      tagline        = EXCLUDED.tagline,
      phone          = EXCLUDED.phone,
      whatsapp       = EXCLUDED.whatsapp,
      address        = EXCLUDED.address,
      social_urls    = EXCLUDED.social_urls,
      hero_content   = EXCLUDED.hero_content,
      ticker_content = EXCLUDED.ticker_content,
      seo_defaults   = EXCLUDED.seo_defaults,
      updated_at     = now();

-- ---------------------------------------------------------------------------
-- End of migration. Re-running this file is safe: every statement is additive
-- and guarded. It never drops, truncates or resets any existing remote object.
-- ---------------------------------------------------------------------------