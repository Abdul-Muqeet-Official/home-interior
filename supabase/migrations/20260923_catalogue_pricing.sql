-- supabase/migrations/20260923_catalogue_pricing.sql
--
-- Structured catalogue pricing + one canonical "False Ceiling" category.
--
-- Principles: additive and idempotent only. Every statement is guarded
-- (CREATE/ALTER ... IF NOT EXISTS, information_schema checks, CREATE POLICY ...
-- via IF NOT EXISTS). No DROP TABLE/COLUMN, no column type changes, no data loss.
--
-- What it does:
--   1. Ensures the tables the catalogue depends on exist (profiles, categories,
--      products, media) so admin category and media management has somewhere to write.
--   2. Brings `products` to the canonical catalogue shape whether it is missing,
--      already canonical, or an older legacy shape (title/category/price/image_url).
--   3. Adds the smallest structured pricing model - price, currency, unit - so an
--      operator can edit a rate in admin and the site renders "PKR 450 / SQ FT"
--      from data. A product with no price still renders PRICE ON CONSULTATION.
--   4. Folds the two competing ceiling categories (gypsum-ceilings,
--      gypsum-false-ceiling) into a single canonical row: false-ceiling / "False Ceiling".
--   5. Enables row level security with the same public-read / admin-write policies
--      the rest of this project's migrations already use, so the catalogue is never
--      anonymously writable and no service-role key is needed by the browser.

-- ---------------------------------------------------------------------------
-- 0. Extensions and prerequisite tables (no-ops when already live)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- Canonical products shape, including the structured pricing columns.
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  code text,
  description text,
  specs jsonb DEFAULT '{}'::jsonb,
  price numeric,
  currency text,
  unit text,
  price_label text,
  original_price numeric,
  discount_badge text,
  image_path text,
  gallery_paths jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- ---------------------------------------------------------------------------
-- 1. Bring an existing `products` table to the canonical catalogue shape
-- ---------------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_label text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_badge text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_paths jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Structured pricing (the smallest model the admin UI needs).
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text;

-- `is_published` needs care. On an already-canonical table this block does nothing,
-- so its `false` default and any deliberate drafts are preserved. On a legacy table
-- the column is created with DEFAULT true because every legacy row was publicly
-- readable before this migration - upgrading must not silently unpublish the live
-- catalogue, and later runs never re-publish an operator's draft.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_published boolean DEFAULT true;
  END IF;
END $$;

-- Backfill from legacy columns, but only where those columns actually exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'title') THEN
    UPDATE public.products
       SET name = title
     WHERE (name IS NULL OR btrim(name) = '') AND title IS NOT NULL AND btrim(title) <> '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url') THEN
    UPDATE public.products
       SET image_path = image_url
     WHERE image_path IS NULL
       AND image_url IS NOT NULL
       AND image_url ~* '^https?://';   -- placeholder junk is deliberately not carried over
  END IF;

  -- Resolve a legacy free-text category label to the matching category row.
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category') THEN
    UPDATE public.products p
       SET category_id = c.id
      FROM public.categories c
     WHERE p.category_id IS NULL
       AND p.category IS NOT NULL
       AND lower(btrim(p.category)) IN (lower(c.name), lower(c.slug));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products (is_published);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ---------------------------------------------------------------------------
-- 2. One canonical False Ceiling category (fold competing slugs into one)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Preferred public display name on whichever ceiling row already exists.
  UPDATE public.categories
     SET name = 'False Ceiling', updated_at = now()
   WHERE slug IN ('gypsum-ceilings', 'gypsum-false-ceiling')
     AND name = 'Gypsum Ceilings';

  -- If a canonical row and a legacy row both exist, move products across first so
  -- nothing is orphaned, then retire the duplicate legacy row entirely.
  IF EXISTS (SELECT 1 FROM public.categories WHERE slug = 'false-ceiling') THEN
    UPDATE public.products p
       SET category_id = canon.id, updated_at = now()
      FROM public.categories canon
      JOIN public.categories legacy
        ON legacy.slug IN ('gypsum-ceilings', 'gypsum-false-ceiling')
     WHERE canon.slug = 'false-ceiling'
       AND p.category_id = legacy.id
       AND legacy.id <> canon.id;

    DELETE FROM public.categories
     WHERE slug IN ('gypsum-ceilings', 'gypsum-false-ceiling');
  ELSE
    -- Only a legacy row exists: rename it in place.
    UPDATE public.categories
       SET slug = 'false-ceiling', updated_at = now()
     WHERE slug IN ('gypsum-ceilings', 'gypsum-false-ceiling');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. updated_at trigger (same pattern as 20240919_init.sql)
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
  FOR tbl IN ARRAY ['categories','products','media'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', tbl);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Row level security: public read of published/active rows, admin write.
--    Anonymous clients get no INSERT/UPDATE/DELETE on the catalogue.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['profiles','categories','products','media'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'select_active_categories') THEN
    CREATE POLICY select_active_categories ON public.categories FOR SELECT USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'select_published_products') THEN
    CREATE POLICY select_published_products ON public.products FOR SELECT USING (is_published = true);
  END IF;
END $$;

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

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN ARRAY ['categories','products'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'admin_all_' || tbl
    ) THEN
      EXECUTE format('CREATE POLICY admin_all_%I ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''editor''))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''editor'')))', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Media management: ordering + featured flag
--    The Media Library needs reorder and "set featured" to be real, persisted
--    operations rather than client-only state. Additive, idempotent, no drops.
-- ---------------------------------------------------------------------------
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_media_sort_order ON public.media (sort_order);
CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 6. One canonical False Ceiling category row (safe to run on an empty database)
--    Guarded so an operator's later rename to "Gypsum Ceilings" is never undone.
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, sort_order, is_active)
VALUES (
  'False Ceiling',
  'false-ceiling',
  'Suspended gypsum ceiling systems - trays, cove lighting, coffer and lattice details - specified for residential interiors.',
  7,
  true
)
ON CONFLICT (slug) DO NOTHING;
