-- ACTIVATE_LIVE_CATALOGUE.sql
-- Manual Dashboard SQL for oqfxtdcbpcjoxmnxbpte. Additive and non-destructive.
-- Existing products, projects, and reviews are preserved. No reset/drop/truncate.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name text, role text NOT NULL CHECK (role IN ('admin','editor','viewer')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.categories (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text NOT NULL, slug text NOT NULL UNIQUE, description text, image_path text, sort_order integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.services (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), title text NOT NULL, slug text NOT NULL UNIQUE, short_description text, description text, image_path text, is_published boolean DEFAULT false, sort_order integer DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.leads (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text NOT NULL, phone text NOT NULL, email text, interest text, message text, source text, status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed','archived')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.site_settings (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), brand_name text, tagline text, phone text, whatsapp text, address text, hours text, maps_url text, social_urls jsonb DEFAULT '{}'::jsonb, ticker_content text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.media (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), file_name text NOT NULL, storage_path text NOT NULL, bucket text NOT NULL, mime_type text NOT NULL, file_size bigint, alt_text text, entity_type text, entity_id uuid, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.audit_logs (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), actor_id uuid REFERENCES public.profiles(id), action text NOT NULL, entity text, entity_id uuid, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_label text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_badge text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_paths jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.products SET name=title WHERE name IS NULL AND title IS NOT NULL;
UPDATE public.products SET image_path=image_url WHERE image_path IS NULL AND image_url IS NOT NULL;
UPDATE public.products SET price=price_label::numeric WHERE price IS NULL AND price_label IS NOT NULL AND price_label ~ '^[0-9]+(\.[0-9]+)?$';

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS eyebrow text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS heading text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS lede text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS edit_heading text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS edit_note text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS rail_aria text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS category_action text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS cover_image_alt text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS stats_json jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS poster_path text;

-- Legacy reviews compatibility; existing rows remain untouched.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS project_type text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_paths jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_active ON public.categories(parent_id,is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media(entity_type,entity_id);
CREATE INDEX IF NOT EXISTS idx_media_featured ON public.media(entity_type,entity_id,is_featured);
CREATE INDEX IF NOT EXISTS idx_media_sort_order ON public.media(sort_order);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.reviews(is_published,sort_order);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_slug_key') THEN ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE(slug); END IF; IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='categories_not_self_parent') THEN ALTER TABLE public.categories ADD CONSTRAINT categories_not_self_parent CHECK(parent_id IS DISTINCT FROM id); END IF; IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='media_storage_path_key') THEN ALTER TABLE public.media ADD CONSTRAINT media_storage_path_key UNIQUE(storage_path); END IF; END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['profiles','categories','services','leads','site_settings','media','products','projects','reviews'] LOOP IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',t); END IF; END LOOP; END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY; ALTER TABLE public.products ENABLE ROW LEVEL SECURITY; ALTER TABLE public.media ENABLE ROW LEVEL SECURITY; ALTER TABLE public.services ENABLE ROW LEVEL SECURITY; ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY; ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY; ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY; ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='select_active_categories') THEN CREATE POLICY select_active_categories ON public.categories FOR SELECT USING(is_active=true); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='select_published_products') THEN CREATE POLICY select_published_products ON public.products FOR SELECT USING(is_published=true); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='services' AND policyname='select_published_services') THEN CREATE POLICY select_published_services ON public.services FOR SELECT USING(is_published=true); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='select_published_projects') THEN CREATE POLICY select_published_projects ON public.projects FOR SELECT USING(is_published=true); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='select_published_reviews') THEN CREATE POLICY select_published_reviews ON public.reviews FOR SELECT USING(is_published=true); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_settings' AND policyname='select_site_settings') THEN CREATE POLICY select_site_settings ON public.site_settings FOR SELECT USING(true); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='insert_leads') THEN CREATE POLICY insert_leads ON public.leads FOR INSERT WITH CHECK(true); END IF;
END $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['categories','products','media','services','projects','reviews'] LOOP IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='admin_all_'||t) THEN EXECUTE format('CREATE POLICY admin_all_%I ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN (''admin'',''editor''))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN (''admin'',''editor'')))',t,t); END IF; END LOOP; END $$;

INSERT INTO storage.buckets (name,public) SELECT 'products',true WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name='products');
INSERT INTO storage.buckets (name,public) SELECT 'projects',true WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name='projects');
INSERT INTO storage.buckets (name,public) SELECT 'services',true WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name='services');
INSERT INTO storage.buckets (name,public) SELECT 'site-assets',true WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name='site-assets');
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public_read_catalogue_buckets') THEN CREATE POLICY public_read_catalogue_buckets ON storage.objects FOR SELECT USING(bucket_id IN ('products','projects','services','site-assets')); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin_insert_catalogue_media') THEN CREATE POLICY admin_insert_catalogue_media ON storage.objects FOR INSERT WITH CHECK(bucket_id IN ('products','projects','services','site-assets') AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin_update_catalogue_media') THEN CREATE POLICY admin_update_catalogue_media ON storage.objects FOR UPDATE USING(bucket_id IN ('products','projects','services','site-assets') AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))) WITH CHECK(bucket_id IN ('products','projects','services','site-assets') AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admin_delete_catalogue_media') THEN CREATE POLICY admin_delete_catalogue_media ON storage.objects FOR DELETE USING(bucket_id IN ('products','projects','services','site-assets') AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','editor'))); END IF;
END $$;

INSERT INTO public.categories (name,slug,description,sort_order,is_active) VALUES
 ('Laminate Flooring','laminate-flooring','High-pressure laminate planks engineered for depth of grain, dimensional stability and everyday durability.',1,true),
 ('SPC Flooring','spc-flooring','Stone-polymer composite planks with a rigid core, waterproof performance and a quiet, solid underfoot feel.',2,true),
 ('Vinyl Flooring','vinyl-flooring','Resilient vinyl in wood and stone evolutions — warm underfoot, low maintenance and suited to high-traffic rooms.',3,true),
 ('PVC Wall Panels','pvc-wall-panel','Seamless decorative panels that clad, cover and finish interior walls with crisp shadow lines.',4,true),
 ('Wallpaper','wallpaper','Textured and patterned papers, from quiet linens and grasscloths to statement murals.',5,true),
 ('Folding Doors','folding-door','Space-efficient folding systems that open interiors to light, air and garden views.',6,true),
 ('False Ceiling','false-ceiling','Suspended gypsum ceiling systems.',7,true),
 ('Artificial Grass','artificial-grass','Low-maintenance artificial grass surfaces for designed interiors and outdoor extensions.',8,true),
 ('Window Blinds','window-blinds','Window treatments balancing daylight, privacy and control.',9,true),
 ('3D Wall Picture','3d-wall-picture','Dimensional wall artwork and decorative wall features.',10,true) ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE VIEW public.v_category_hierarchy AS SELECT id,name,slug,description,image_path,parent_id,eyebrow,heading,lede,edit_heading,edit_note,rail_aria,category_action,cover_image_alt,stats_json,sort_order,is_active FROM public.categories WHERE is_active=true;
CREATE OR REPLACE VIEW public.v_category_series AS SELECT c.id,c.name,c.slug,c.description,c.image_path,c.parent_id,c.eyebrow,c.heading,c.lede,c.edit_heading,c.edit_note,c.rail_aria,c.category_action,c.cover_image_alt,c.stats_json,c.sort_order,c.is_active,p.name AS parent_name,p.slug AS parent_slug FROM public.categories c LEFT JOIN public.categories p ON p.id=c.parent_id WHERE c.is_active=true AND c.parent_id IS NOT NULL;
