-- 20260925_verify_review_privileges.sql
-- Read-only verification. Run after the hardening migration.
-- Expected: anon_can_select_email = false; authenticated_can_select_email = false.

SELECT
  has_column_privilege('anon', 'public.reviews', 'email', 'SELECT') AS anon_can_select_email,
  has_column_privilege('authenticated', 'public.reviews', 'email', 'SELECT') AS authenticated_can_select_email,
  has_column_privilege('anon', 'public.reviews', 'testimonial', 'SELECT') AS anon_can_select_testimonial,
  has_column_privilege('authenticated', 'public.reviews', 'testimonial', 'SELECT') AS authenticated_can_select_testimonial;

SELECT c.relrowsecurity AS reviews_rls_enabled,
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='select_published_reviews') AS published_review_policy_exists
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='reviews';

-- Public read check: only published rows and no email column.
SELECT id, client_name, location, project_type, rating, testimonial,
       is_verified, is_published, sort_order
FROM public.reviews
WHERE is_published = true
ORDER BY sort_order NULLS LAST, created_at DESC
LIMIT 6;
