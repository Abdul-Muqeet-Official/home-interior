CREATE TABLE IF NOT EXISTS public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read access on published services" ON public.services
    FOR SELECT TO public USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
