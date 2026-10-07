-- 20260925_review_privacy_hardening.sql
-- Additive, idempotent review privilege hardening. No data is changed.
-- Run after 20260924_review_public_privileges.sql and before any seeding.

-- Ensure inherited/default table privileges cannot expose the complete row,
-- including the private moderation email.
REVOKE ALL PRIVILEGES ON TABLE public.reviews FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.reviews FROM anon, authenticated;
REVOKE SELECT (email) ON TABLE public.reviews FROM PUBLIC, anon, authenticated;

-- The public app requests exactly these non-sensitive columns. Keeping
-- project_type and is_verified is required by the public Review mapper.
GRANT SELECT (
  id,
  client_name,
  location,
  project_type,
  rating,
  testimonial,
  is_verified,
  is_published,
  sort_order
) ON TABLE public.reviews TO anon, authenticated;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

-- A RESTRICTIVE policy is ANDed with existing permissive SELECT policies.
-- If multiple permissive policies are added later, this still requires
-- published-only visibility for anon/authenticated public reads.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'public_reviews_published_only'
  ) THEN
    CREATE POLICY public_reviews_published_only
      ON public.reviews
      AS RESTRICTIVE
      FOR SELECT
      TO anon, authenticated
      USING (is_published = true);
  END IF;
END $$;