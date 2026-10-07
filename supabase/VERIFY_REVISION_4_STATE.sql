-- VERIFY_REVISION_4_STATE.sql
-- READ-ONLY verification. SELECT statements only.

-- A. Physical table existence.
SELECT n.nspname AS schema_name, c.relname AS table_name, c.relkind
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE c.relname IN ('categories','media','products','reviews','projects','profiles','buckets','objects')
  AND n.nspname IN ('public','storage') ORDER BY n.nspname,c.relname;

SELECT table_schema,table_name FROM information_schema.tables
WHERE table_schema IN ('public','storage')
  AND table_name IN ('categories','media','products','reviews','projects','profiles','buckets','objects')
ORDER BY table_schema,table_name;

-- B. Products columns.
SELECT column_name,ordinal_position,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='products' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products'
  AND column_name IN ('category_id','name','slug','currency','unit','price_label','gallery_paths','is_published','sort_order','image_path','updated_at') ORDER BY column_name;

-- C. Reviews columns.
SELECT column_name,ordinal_position,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' ORDER BY ordinal_position;

-- D. Projects columns.
SELECT column_name,ordinal_position,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' ORDER BY ordinal_position;

-- E. Categories columns.
SELECT column_name,ordinal_position,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' ORDER BY ordinal_position;

-- F. Media columns.

-- G. Indexes and is_featured references.
SELECT schemaname,tablename,indexname,indexdef FROM pg_catalog.pg_indexes
WHERE indexname IN ('products_slug_unique_non_null','products_category_id_idx','categories_parent_id_idx','categories_parent_active_idx','media_entity_idx','media_sort_order_idx','reviews_published_sort_idx','media_featured_idx')
ORDER BY schemaname,tablename,indexname;
SELECT schemaname,tablename,indexname,indexdef FROM pg_catalog.pg_indexes
WHERE indexdef ILIKE '%is_featured%' ORDER BY schemaname,tablename,indexname;

-- H. Constraints.
SELECT n.nspname AS schema_name,c.relname AS table_name,con.conname,con.contype,pg_get_constraintdef(con.oid) AS definition
FROM pg_catalog.pg_constraint con JOIN pg_catalog.pg_class c ON c.oid=con.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('categories','media','products','reviews','projects') AND con.conname='categories_not_self_parent';

-- I. Triggers.
SELECT n.nspname AS schema_name,c.relname AS table_name,t.tgname,pg_get_triggerdef(t.oid) AS definition
FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname='public' AND c.relname IN ('categories','media','products','projects','reviews') AND t.tgname='set_updated_at' ORDER BY c.relname;

-- J. RLS state.
SELECT n.nspname AS schema_name,c.relname AS table_name,c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS rls_forced
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('categories','media','products','projects','reviews') ORDER BY c.relname;

-- K. Policies.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_catalog.pg_policies
WHERE (schemaname='public' AND tablename IN ('categories','media','products','projects','reviews')) OR (schemaname='storage' AND tablename='objects') ORDER BY schemaname,tablename,policyname;
SELECT schemaname,tablename,policyname,cmd FROM pg_catalog.pg_policies WHERE policyname IN ('select_active_categories','select_published_products','select_published_projects','select_published_reviews','public_read_site_assets_media','admin_all_categories','admin_all_products','admin_all_media','admin_all_projects','admin_all_reviews','public_read_site_assets','admin_insert_site_assets','admin_update_site_assets','admin_delete_site_assets') ORDER BY schemaname,tablename,policyname;

-- L. Direct Storage buckets.
SELECT id,name,public,created_at,updated_at FROM storage.buckets ORDER BY name;
SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE name='site-assets') AS site_assets_exists;

-- O. Actual storage.buckets schema.
SELECT column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns
WHERE table_schema='storage' AND table_name='buckets' ORDER BY ordinal_position;
SELECT tc.constraint_name,tc.constraint_type,kcu.column_name,tc.table_schema,tc.table_name
FROM information_schema.table_constraints tc LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema
WHERE tc.table_schema='storage' AND tc.table_name='buckets' ORDER BY tc.constraint_name,kcu.ordinal_position;

-- M. Product preservation.
SELECT count(*) AS products_row_count FROM public.products;
SELECT id,title,category,price,original_price,discount_badge,image_url,description,specs,created_at FROM public.products ORDER BY created_at LIMIT 10;

-- Explicit Revision 4 column presence matrix.
WITH requested(table_name, column_name) AS (
  VALUES
    ('products','category_id'),('products','name'),('products','slug'),('products','currency'),
    ('products','unit'),('products','price_label'),('products','gallery_paths'),('products','is_published'),
    ('products','sort_order'),('products','image_path'),('products','updated_at'),
    ('reviews','project_type'),('reviews','email'),('reviews','is_published'),('reviews','sort_order'),
    ('projects','video_paths'),('categories','parent_id'),('categories','eyebrow'),('categories','heading'),
    ('categories','lede'),('categories','edit_heading'),('categories','edit_note'),('categories','rail_aria'),
    ('categories','category_action'),('categories','cover_image_alt'),('categories','stats_json'),
    ('media','sort_order'),('media','width'),('media','height'),('media','caption'),('media','poster_path')
)
SELECT r.table_name, r.column_name,
       EXISTS (SELECT 1 FROM information_schema.columns c
               WHERE c.table_schema='public' AND c.table_name=r.table_name AND c.column_name=r.column_name) AS present
FROM requested r ORDER BY r.table_name,r.column_name;

-- Final metadata-derived classification. This reads catalogs only.
WITH objects AS (
  SELECT
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name IN ('category_id','name','slug','currency','unit','price_label','gallery_paths','is_published','sort_order','image_path','updated_at')) AS product_columns,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name IN ('project_type','email','is_published','sort_order','created_at','updated_at')) AS review_columns,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name IN ('video_paths','updated_at')) AS project_columns,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name IN ('parent_id','eyebrow','heading','lede','edit_heading','edit_note','rail_aria','category_action','cover_image_alt','stats_json')) AS category_columns,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='media' AND column_name IN ('sort_order','width','height','caption','poster_path')) AS media_columns,
    (SELECT count(*) FROM pg_indexes WHERE indexname IN ('products_slug_unique_non_null','products_category_id_idx','categories_parent_id_idx','categories_parent_active_idx','media_entity_idx','media_sort_order_idx','reviews_published_sort_idx')) AS revision4_indexes,
    (SELECT count(*) FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND con.conname='categories_not_self_parent') AS self_parent_constraint,
    (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname='public' AND t.tgname='set_updated_at') AS updated_triggers,
    (SELECT count(*) FROM storage.buckets) AS bucket_count,
    (SELECT count(*) FROM storage.buckets WHERE name='site-assets') AS site_assets_count
)
SELECT
  CASE
    WHEN product_columns=11 AND review_columns=6 AND project_columns=2 AND category_columns=10 AND media_columns=5 AND revision4_indexes=7 AND self_parent_constraint=1 AND site_assets_count=0 THEN 'C = most/all Revision 4 schema changes present but storage bucket creation failed'
    WHEN product_columns+review_columns+project_columns+category_columns+media_columns+revision4_indexes+self_parent_constraint+updated_triggers=0 AND bucket_count=0 THEN 'A = no Revision 4 schema changes present'
    WHEN product_columns+review_columns+project_columns+category_columns+media_columns+revision4_indexes+self_parent_constraint+updated_triggers>0 THEN 'B = some Revision 4 schema changes present'
    ELSE 'D = another state'
  END AS revision4_state,
  *
FROM objects;

SELECT column_name,ordinal_position,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='media' ORDER BY ordinal_position;
