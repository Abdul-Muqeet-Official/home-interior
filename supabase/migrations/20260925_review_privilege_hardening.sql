-- 20260925_review_privilege_hardening.sql
-- Additive/idempotent correction for public.reviews.
-- Run manually in the Supabase SQL editor; this file is not an execution record.

REVOKE SELECT ON public.reviews FROM PUBLIC;
REVOKE SELECT ON public.reviews FROM anon;
REVOKE SELECT ON public.reviews FROM authenticated;
REVOKE SELECT (email) ON public.reviews FROM PUBLIC;
REVOKE SELECT (email) ON public.reviews FROM anon;
REVOKE SELECT (email) ON public.reviews FROM authenticated;

-- The public application mapper needs only these non-sensitive fields.
GRANT SELECT (
  id, client_name, location, project_type, rating, testimonial,
  is_published, sort_order
) ON public.reviews TO anon;
GRANT SELECT (
  id, client_name, location, project_type, rating, testimonial,
  is_published, sort_order
) ON public.reviews TO authenticated;

-- Publication filtering remains a row-level security requirement.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews'
      AND policyname = 'select_published_reviews'
  ) THEN
    CREATE POLICY select_published_reviews
      ON public.reviews FOR SELECT
      USING (is_published = true);
  END IF;
END $$;

-- No seed or data mutation is performed by this migration.
