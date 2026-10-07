-- HOME INTERIOR review privacy verification (READ ONLY)
-- Run after 20260924_review_public_privileges.sql.
SELECT
  has_column_privilege('anon','public.reviews','email','SELECT') AS anon_can_select_email,
  has_column_privilege('authenticated','public.reviews','email','SELECT') AS authenticated_can_select_email,
  has_table_privilege('anon','public.reviews','SELECT') AS anon_can_select_table,
  has_table_privilege('authenticated','public.reviews','SELECT') AS authenticated_can_select_table,
  has_column_privilege('anon','public.reviews','testimonial','SELECT') AS anon_can_read_testimonials,
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.reviews'::regclass) AS review_rls_enabled;

-- Expected: all mutation checks are false.
SELECT
  has_table_privilege('anon','public.reviews','INSERT') AS anon_can_insert,
  has_table_privilege('anon','public.reviews','UPDATE') AS anon_can_update,
  has_table_privilege('anon','public.reviews','DELETE') AS anon_can_delete;
