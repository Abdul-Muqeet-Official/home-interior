-- 20260924_review_public_privileges.sql
-- Additive, idempotent privilege correction for public.reviews.
-- Run with transaction wrapping enabled. No data is inserted, updated or deleted.

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Remove table-level and inherited privileges so email is not reachable.
REVOKE SELECT ON public.reviews FROM PUBLIC, anon, authenticated;
REVOKE SELECT (email) ON public.reviews FROM PUBLIC, anon, authenticated;

-- Exact non-sensitive projection used by lib/supabase/queries.ts.
-- Correct the complete grant set, including client-facing mapper fields.
REVOKE SELECT
ON public.reviews
FROM PUBLIC, anon, authenticated;

REVOKE SELECT (email)
ON public.reviews
FROM PUBLIC, anon, authenticated;

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
)
ON public.reviews
TO anon, authenticated;

-- Publication gate. Existing policy semantics are not replaced.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'select_published_reviews'
  ) THEN
    CREATE POLICY select_published_reviews
      ON public.reviews
      FOR SELECT
      USING (is_published = true);
  END IF;
END $$;

COMMENT ON COLUMN public.reviews.email IS
  'Private contact data. Never expose to anon or authenticated roles; public review reads use an explicit safe column projection.';
