-- 20260925_verify_review_privacy.sql
-- Read-only. Run after 20260925_review_privacy_hardening.sql.
-- Required: anon_can_select_email=false and authenticated_can_select_email=false.
-- No INSERT/UPDATE/DELETE/DROP/TRUNCATE statements are included.

SELECT
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'reviews';

SELECT
  has_column_privilege('anon', 'public.reviews', 'email', 'SELECT') AS anon_can_select_email,
  has_column_privilege('authenticated', 'public.reviews', 'email', 'SELECT') AS authenticated_can_select_email,
  has_table_privilege('anon', 'public.reviews', 'SELECT') AS anon_has_table_select,
  has_table_privilege('authenticated', 'public.reviews', 'SELECT') AS authenticated_has_table_select;

SELECT
  has_column_privilege('anon', 'public.reviews', 'id', 'SELECT') AS anon_can_select_id,
  has_column_privilege('anon', 'public.reviews', 'client_name', 'SELECT') AS anon_can_select_client_name,
  has_column_privilege('anon', 'public.reviews', 'testimonial', 'SELECT') AS anon_can_select_testimonial,
  has_column_privilege('authenticated', 'public.reviews', 'id', 'SELECT') AS authenticated_can_select_id,
  has_column_privilege('authenticated', 'public.reviews', 'client_name', 'SELECT') AS authenticated_can_select_client_name,
  has_column_privilege('authenticated', 'public.reviews', 'testimonial', 'SELECT') AS authenticated_can_select_testimonial;

SELECT policyname, permissive, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reviews'
ORDER BY policyname;

-- Run as the anon role to verify only published, granted fields are readable.
SET LOCAL ROLE anon;
SELECT id, client_name, location, project_type, rating, testimonial,
       is_verified, is_published, sort_order
FROM public.reviews
WHERE is_published = true
ORDER BY sort_order NULLS LAST, created_at DESC
LIMIT 10;
RESET LOCAL ROLE;