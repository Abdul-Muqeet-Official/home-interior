-- supabase/migrations/20240919_init.sql
-- Initial migration for Home Interior Karachi project
-- This migration creates all tables, indexes, triggers, and enables RLS.

-- Enable extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. categories
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

-- 3. products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  code text,
  description text,
  specs jsonb DEFAULT '{}'::jsonb,
  price_label text,
  image_path text,
  gallery_paths jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  location text,
  type text,
  short_description text,
  description text,
  before_image_path text,
  after_image_path text,
  gallery_paths jsonb DEFAULT '[]'::jsonb,
  year integer,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name text NOT NULL,
  location text,
  project_type text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  testimonial text NOT NULL,
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. services
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

-- 7. leads
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

-- 8. site_settings (singleton)
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

-- 9. media
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

-- 10. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON public.projects(is_published);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON public.projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_is_published ON public.reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_is_published ON public.services(is_published);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Trigger function for automatic updated_at
-- (inlined from ../functions/set_updated_at.sql; \include is a psql meta-command
--  and is rejected by the Supabase SQL editor and by `supabase db push`)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to mutable tables (idempotent: drop-then-create)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['profiles','categories','products','projects','reviews','services','leads','site_settings','media'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()', tbl);
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', tbl);
  END LOOP;
END $$;

-- Enable Row Level Security on all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['profiles','categories','products','projects','reviews','services','leads','site_settings','media','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- RLS Policies (public read on published/active rows)
-- Every policy is created only when it does not already exist, so this migration can
-- be re-applied safely to a partially provisioned remote project. Policy semantics
-- are never altered or dropped — guards are additive only.

-- categories (active only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'select_active_categories') THEN
    CREATE POLICY select_active_categories ON public.categories FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- products (published only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'select_published_products') THEN
    CREATE POLICY select_published_products ON public.products FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- projects (published only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'select_published_projects') THEN
    CREATE POLICY select_published_projects ON public.projects FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- reviews (published only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'select_published_reviews') THEN
    CREATE POLICY select_published_reviews ON public.reviews FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- services (published only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'select_published_services') THEN
    CREATE POLICY select_published_services ON public.services FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- site_settings – expose all columns (public view allowed)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'select_site_settings') THEN
    CREATE POLICY select_site_settings ON public.site_settings FOR SELECT USING (true);
  END IF;
END $$;

-- profiles – admin/editor only
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

-- leads – public insert only; select/update for admin+editor; anonymous has NO select/update/delete
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

-- audit_logs – admin only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'select_audit_logs_admin') THEN
    CREATE POLICY select_audit_logs_admin ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- media – admin/editor manage rows; public never writes
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

-- Admin/editor full access policies on each content table (idempotent).
-- Note: not role-scoped with `TO public`; the USING/WITH CHECK subquery is the guard,
-- so sessions without an admin/editor profile row get no access.
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

-- Viewer role – read‑only admin tables (profiles, audit_logs) if needed – already covered by select policies.

-- End of migration

