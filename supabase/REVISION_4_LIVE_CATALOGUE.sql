-- REVISION 4: SAFE LIVE SUPABASE CATALOGUE SCHEMA PATCH
-- Project: oqfxtdcbpcjoxmnxbpte
-- Additive and idempotent. No seed data or business-data migration.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text NOT NULL, slug text NOT NULL UNIQUE,
  description text, image_path text, sort_order integer DEFAULT 0, is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), file_name text NOT NULL, storage_path text NOT NULL,
  bucket text NOT NULL, mime_type text NOT NULL, file_size bigint, alt_text text, entity_type text,
  entity_id uuid, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_label text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_paths jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS project_type text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_paths jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS eyebrow text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS heading text;

-- E. Remaining category fields and media fields.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS lede text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS edit_heading text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS edit_note text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS rail_aria text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS category_action text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS cover_image_alt text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS stats_json jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS poster_path text;

-- Indexes and guarded constraint; all referenced columns exist above.
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_non_null ON public.products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_parent_active_idx ON public.categories(parent_id,is_active);
CREATE INDEX IF NOT EXISTS media_entity_idx ON public.media(entity_type,entity_id);
CREATE INDEX IF NOT EXISTS media_sort_order_idx ON public.media(sort_order);
CREATE INDEX IF NOT EXISTS reviews_published_sort_idx ON public.reviews(is_published,sort_order);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.categories'::regclass AND conname='categories_not_self_parent') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_not_self_parent CHECK (parent_id IS DISTINCT FROM id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
DO $$ DECLARE v_table_name text; BEGIN
  FOREACH v_table_name IN ARRAY ARRAY['categories','media','products','projects','reviews'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_schema='public' AND information_schema.tables.table_name=v_table_name)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE information_schema.columns.table_schema='public' AND information_schema.columns.table_name=v_table_name AND information_schema.columns.column_name='updated_at')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=format('public.%I',v_table_name)::regclass AND tgname='set_updated_at' AND NOT tgisinternal) THEN
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',v_table_name);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Admin table policies are skipped unless profiles and profiles.role exist.
DO $$ DECLARE v_table_name text; BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_schema='public' AND information_schema.tables.table_name='profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE information_schema.columns.table_schema='public' AND information_schema.columns.table_name='profiles' AND information_schema.columns.column_name='role') THEN
    FOREACH v_table_name IN ARRAY ARRAY['categories','products','media','projects','reviews'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=v_table_name AND policyname='admin_all_'||v_table_name) THEN
        EXECUTE format('CREATE POLICY admin_all_%I ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN (''admin'',''editor''))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN (''admin'',''editor'')))',v_table_name,v_table_name);
      END IF;
    END LOOP;
  END IF;
END $$;

INSERT INTO storage.buckets (name,public) SELECT 'site-assets',true WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name='site-assets');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public_read_site_assets') THEN CREATE POLICY public_read_site_assets ON storage.objects FOR SELECT USING(bucket_id='site-assets'); END IF;
END $$;

-- Storage admin policies are skipped unless profiles and profiles.role exist.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_schema='public' AND information_schema.tables.table_name='profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE information_schema.columns.table_schema='public' AND information_schema.columns.table_name='profiles' AND information_schema.columns.column_name='role') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin_insert_site_assets') THEN CREATE POLICY admin_insert_site_assets ON storage.objects FOR INSERT WITH CHECK(bucket_id='site-assets' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin_update_site_assets') THEN CREATE POLICY admin_update_site_assets ON storage.objects FOR UPDATE USING(bucket_id='site-assets' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))) WITH CHECK(bucket_id='site-assets' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin_delete_site_assets') THEN CREATE POLICY admin_delete_site_assets ON storage.objects FOR DELETE USING(bucket_id='site-assets' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))); END IF;
  END IF;
END $$;

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='select_active_categories') THEN CREATE POLICY select_active_categories ON public.categories FOR SELECT USING(is_active=true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='select_published_products') THEN CREATE POLICY select_published_products ON public.products FOR SELECT USING(is_published=true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='select_published_projects') THEN CREATE POLICY select_published_projects ON public.projects FOR SELECT USING(is_published=true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='select_published_reviews') THEN CREATE POLICY select_published_reviews ON public.reviews FOR SELECT USING(is_published=true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='media' AND policyname='public_read_site_assets_media') THEN CREATE POLICY public_read_site_assets_media ON public.media FOR SELECT USING(bucket='site-assets'); END IF;
END $$;

