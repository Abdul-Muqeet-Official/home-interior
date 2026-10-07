-- Exact post-activation verification. Run after 20260924_review_public_privileges.sql.
-- Expected: rls_enabled=true, publication_policy=true, both email privileges=false,
-- all three safe public review columns=true.
SELECT
  c.relrowsecurity AS rls_enabled,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews'
      AND policyname = 'select_published_reviews'
      AND cmd = 'SELECT'
  ) AS publication_policy,
  has_column_privilege('anon', 'public.reviews', 'email', 'SELECT') AS anon_can_select_email,
  has_column_privilege('authenticated', 'public.reviews', 'email', 'SELECT') AS authenticated_can_select_email,
  has_column_privilege('anon', 'public.reviews', 'client_name', 'SELECT') AS anon_can_select_client_name,
  has_column_privilege('anon', 'public.reviews', 'project_type', 'SELECT') AS anon_can_select_project_type,
  has_column_privilege('anon', 'public.reviews', 'is_verified', 'SELECT') AS anon_can_select_is_verified;
