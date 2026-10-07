-- supabase/migrations/20261002000000_admin_cms_foundation.sql
--
-- Admin CMS foundation. Verified against the LIVE database on 2026-10-02:
--   exists : categories, products, projects, reviews, media, profiles
--   MISSING: services, site_settings, settings, audit_logs, leads
--   MISSING products columns: compare_at_price, availability_status,
--             is_best_seller, is_hot_item, length, width, height,
--             thickness, dimension_unit, is_featured, is_active, sku
--   MISSING media column: is_featured
--   MISSING categories columns: seo_title, is_published, og_image
--
-- Every statement is additive and idempotent (IF NOT EXISTS throughout): no DROP
-- TABLE, no DROP COLUMN, no column type change, no data deletion. Safe to re-run.
--
-- Why this exists: the admin UI and its API routes already reference these tables
-- and columns, but they were never applied to the live project, so those routes
-- fail at runtime. This brings the database up to the shape the code expects.

-- ---------------------------------------------------------------------------
-- 1. Content tables the admin writes to but which do not exist yet
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  image_path text,
  icon_path text,
  seo_title text,
  seo_description text,
  og_image text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Single source of truth for brand / contact / SEO. One singleton row, id = '1'.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT '1',
  brand_name text,
  descriptor text,
  logo_path text,
  logo_light_path text,
  favicon_path text,
  og_image_path text,
  phone text,
  whatsapp text,
  email text,
  address_line text,
  hours text,
  maps_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  youtube_url text,
  linkedin_url text,
  seo_title text,
  seo_description text,
  announcement text,
  footer_copyright text,
  consultation_heading text,
  consultation_text text,
  consultation_cta_label text,
  consultation_cta_href text,
  hero_slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = '1')
);

-- The admin settings route targets a table literally named "settings".
CREATE TABLE IF NOT EXISTS public.settings (
  id text PRIMARY KEY DEFAULT '1',
  site_name text,
  site_description text,
  phone text,
  whatsapp text,
  email text,
  address text,
  instagram text,
  facebook text,
  linkedin text,
  seo_title text,
  seo_description text,
  seo_image text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity, entity_id);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  interest text,
  message text,
  source text NOT NULL DEFAULT 'website',
  is_handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Product merchandising, pricing and dimensions
--    (20261001000000_merchandising.sql was authored but never applied.)
-- ---------------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'IN STOCK';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_price boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_hot_item boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thickness numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_unit text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS finish text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pattern text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS series text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS og_image text;
-- Short/long descriptions both map onto the existing `description` column.

-- ---------------------------------------------------------------------------
-- 3. Category publishing + SEO
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS series text;

-- ---------------------------------------------------------------------------
-- 4. Our Work projects, including video, poster and caption
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_path text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_poster_path text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_caption text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gallery_paths jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS year integer;

-- Backfill slugs from existing titles so no project loses its URL.
UPDATE public.projects SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Review moderation
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 6. Media: featured/primary flags + library indexes
-- ---------------------------------------------------------------------------
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_media_sort_order ON public.media (sort_order);
CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_mime ON public.media (mime_type);

-- ---------------------------------------------------------------------------
-- 7. Catalogue query indexes (admin list + search performance)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products (sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products (is_published);

-- ---------------------------------------------------------------------------
-- 8. updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','products','projects','reviews','media','services']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name=t AND column_name='updated_at') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 9. RLS
--    Site settings are intentionally world-readable: the public Header/Footer
--    read phone, WhatsApp and address through the anon client. audit_logs and
--    leads are service-role ONLY and deliberately get no anon/authenticated
--    policy, so they fail closed.
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_site_settings_public ON public.site_settings;
CREATE POLICY select_site_settings_public ON public.site_settings
  FOR SELECT USING (true);

-- audit_logs / leads: no policy = no anon or authenticated access.

-- ---------------------------------------------------------------------------
-- 10. Seed the singleton settings row from the canonical business data.
--     Values are the verified ones already used by lib/site.config.ts.
-- ---------------------------------------------------------------------------
INSERT INTO public.site_settings (
  id, brand_name, descriptor, phone, whatsapp, address_line,
  seo_title, seo_description, footer_copyright, consultation_cta_href
) VALUES (
  '1',
  'HOME INTERIOR',
  'KARACHI — BESPOKE LIVING STUDIO',
  '03232655111',
  '03032566212',
  'Building 45C, Shop 1, Lane 11, Near Kababjees, Badar Commercial, DHA Phase 5, Karachi',
  'HOME INTERIOR — Bespoke Interior Design Studio in Karachi',
  'HOME INTERIOR is a Karachi-based bespoke interior design studio offering refined residential interiors, architectural finishes, materials and turnkey design services.',
  '© HOME INTERIOR — Karachi',
  '/consultation'
)
ON CONFLICT (id) DO NOTHING;