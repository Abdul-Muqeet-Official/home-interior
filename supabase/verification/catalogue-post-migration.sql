-- Run after the reviewed additive catalogue migrations. This file is read-only verification SQL.
-- It intentionally contains no DDL or DML.

select 'categories' as relation, count(*) as public_rows from public.categories where is_active = true;
select 'products' as relation, count(*) as published_rows from public.products where is_published = true;
select 'projects' as relation, count(*) as published_rows from public.projects where is_published = true;
select 'reviews' as relation, count(*) as published_rows from public.reviews where is_published = true;
select 'media' as relation, count(*) as published_rows from public.media where is_published = true;
select 'wallpaper_collections' as relation, count(*) as rows from public.categories where country in ('china','korea');
select 'wallpaper_media' as relation, count(*) as rows from public.media where media_type = 'rendered-page';
select id, name, public from storage.buckets where id in ('site-assets','wallpaper-catalogue');
select schemaname, tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname in ('public','storage')
  and tablename in ('categories','media','reviews','objects')
order by schemaname, tablename, policyname;
select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename in ('categories','media') order by indexname;
select column_name, is_nullable, data_type from information_schema.columns where table_schema = 'public' and table_name in ('categories','media','products','projects','reviews') order by table_name, ordinal_position;
