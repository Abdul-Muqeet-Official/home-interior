-- Add the private review contact field without changing existing review records.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.reviews.email IS 'Private customer email; never selected by public queries.';

REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;
