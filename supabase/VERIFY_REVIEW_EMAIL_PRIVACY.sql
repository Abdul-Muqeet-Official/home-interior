-- 20260925_verify_review_email_privacy.sql
-- Read-only verification. Run AFTER the review privilege migration.
-- Expected: anon_can_select_email=false, authenticated_can_select_email=false.
SELECT
  has_column_privilege('anon', 'public.reviews', 'email', 'SELECT') AS anon_can_select_email,
  has_column_privilege('authenticated', 'public.reviews', 'email', 'SELECT') AS authenticated_can_select_email,
  has_column_privilege('anon', 'public.reviews', 'testimonial', 'SELECT') AS anon_can_select_testimonial,
  has_column_privilege('anon', 'public.reviews', 'is_published', 'SELECT') AS anon_can_select_publication_flag;

-- RLS and the published-row gate must both exist.
SELECT c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'reviews';

SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'reviews'
ORDER BY policyname;

-- Run in the Supabase SQL editor after applying the review privilege patch.
-- Read-only and safe to run repeatedly.

SELECT
  has_column_privilege('anon', 'public.reviews', 'email', 'SELECT')
    AS anon_can_select_email,
  has_column_privilege('authenticated', 'public.reviews', 'email', 'SELECT')
    AS authenticated_can_select_email,
  has_table_privilege('anon', 'public.reviews', 'SELECT')
    AS anon_can_select_table,
  has_table_privilege('authenticated', 'public.reviews', 'SELECT')
    AS authenticated_can_select_table,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.reviews'::regclass)
    AS rls_enabled;

SELECT p.policyname, p.permissive, p.roles,
       pg_get_expr(p.qual, p.polrelid) AS using_expression
FROM pg_policy p
WHERE p.polrelid = 'public.reviews'::regclass
ORDER BY p.policyname;

-- Safe public projection. This query deliberately does not request email.
SELECT id, client_name, location, project_type, rating,
       testimonial, is_verified, sort_order
FROM public.reviews
WHERE is_published = true
ORDER BY sort_order, created_at DESC
LIMIT 10;
