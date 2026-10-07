-- 20260925_review_email_privacy_hardening.sql
-- Public review query columns used by lib/supabase/queries.ts:
-- id, client_name, location, project_type, rating, testimonial,
-- is_verified, is_published, sort_order. email is intentionally not granted.
REVOKE SELECT
ON public.reviews
FROM PUBLIC, anon, authenticated;

-- Additive, idempotent and non-destructive. No review rows are changed.
-- Additive compatibility for the observed live schema: the services table and
-- reviews.is_verified column were absent from the PostgREST schema cache.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  image_path text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_is_published ON public.services(is_published);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services'
      AND policyname = 'select_published_services' AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY select_published_services
      ON public.services FOR SELECT TO anon, authenticated
      USING (is_published = true);
  END IF;
END $$;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS project_type text;

-- Remove table-level SELECT from all roles, then grant only public-safe fields.

REVOKE SELECT ON public.reviews FROM PUBLIC;
REVOKE SELECT ON public.reviews FROM anon, authenticated;
REVOKE SELECT (email) ON public.reviews FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id, client_name, location, project_type, rating,
  testimonial, is_verified, is_published, sort_order
) ON public.reviews TO anon, authenticated;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews'
      AND policyname = 'select_published_reviews' AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY select_published_reviews
      ON public.reviews FOR SELECT TO anon, authenticated
      USING (is_published = true);
  END IF;
END $$;

DO $$
DECLARE
  anon_email_select boolean;
  authenticated_email_select boolean;
BEGIN
  SELECT has_column_privilege('anon', 'public.reviews', 'email', 'SELECT')
    INTO anon_email_select;
  SELECT has_column_privilege('authenticated', 'public.reviews', 'email', 'SELECT')
    INTO authenticated_email_select;
  IF anon_email_select OR authenticated_email_select THEN
    RAISE EXCEPTION 'Review email remains selectable: anon=%, authenticated=%',
      anon_email_select, authenticated_email_select;
  END IF;
END $$;