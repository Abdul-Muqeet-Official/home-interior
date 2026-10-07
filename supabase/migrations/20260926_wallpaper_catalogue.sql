-- Add wallpaper catalogue metadata to the existing category/media architecture.
-- Additive and idempotent; no product, project, review, or category rows are changed.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS source_filename text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS source_hash text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS page_count integer;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS source_pdf_path text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS page_number integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS checksum text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_categories_wallpaper_country ON public.categories(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_source_hash ON public.categories(source_hash) WHERE source_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_catalogue_page ON public.media(entity_type, entity_id, page_number, sort_order);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='media' AND policyname='public_read_published_media') THEN
    CREATE POLICY public_read_published_media ON public.media FOR SELECT USING (is_published = true);
  END IF;
END $$;
INSERT INTO storage.buckets (id,name,public) VALUES ('wallpaper-catalogue','wallpaper-catalogue',true) ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public_read_wallpaper_catalogue') THEN
    CREATE POLICY public_read_wallpaper_catalogue ON storage.objects FOR SELECT USING (bucket_id='wallpaper-catalogue');
  END IF;
END $$;
