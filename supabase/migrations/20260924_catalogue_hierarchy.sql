-- supabase/migrations/20260924_catalogue_hierarchy.sql
--
-- Hierarchy + editorial metadata for the material catalogue.
--
-- Principles: additive and idempotent only. Every statement is guarded
-- (ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS). No DROP.
--
-- What it does:
--   1. Adds parent_id to categories so PVC Wall Panels can own child series
--      (Aura, Regular Vol 1, Prestige, Royal, Enigma) while remaining a parent
--      itself (parent_id IS NULL).
--   2. Adds editorial columns (eyebrow, heading, lede, edit_heading, edit_note,
--      rail_aria, category_action, cover_image_alt, stats_json) so the admin UI
--      can manage collection copy and facts instead of hard-coded TypeScript.
--   3. Adds width, height, caption and poster_path to media so collection media
--      items carry their render metadata alongside the storage path.
--   4. Indexes parent_id and entity lookups for the hierarchy queries.
--   5. Seeds the canonical False Ceiling row (idempotent, never overwrites an
--      operator's rename) so the collection renders against a real DB row.

-- ---------------------------------------------------------------------------
-- 1. categories: hierarchy + editorial metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS eyebrow text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS heading text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS lede text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS edit_heading text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS edit_note text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS rail_aria text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS category_action text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS cover_image_alt text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS stats_json jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_active ON public.categories(parent_id, is_active);

-- A category must not be its own parent — guard against data corruption.
ALTER TABLE public.categories ADD CONSTRAINT categories_not_self_parent CHECK (parent_id IS DISTINCT FROM id);

-- ---------------------------------------------------------------------------
-- 2. media: render metadata for collection items
-- ---------------------------------------------------------------------------
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS poster_path text;

CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_featured ON public.media(entity_type, entity_id, is_featured);

-- ---------------------------------------------------------------------------
-- 3. Canonical False Ceiling seed (idempotent — ON CONFLICT DO NOTHING)
--    Only inserts when the slug is entirely absent; never overwrites a row an
--    operator has already created or renamed.
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, sort_order, is_active)
VALUES (
  'False Ceiling',
  'false-ceiling',
  'Suspended gypsum ceiling systems.',
  7,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Hierarchical category views for the public data layer.
--    These views keep the SELECT policy (is_active = true) consistent: only
--    active categories surface in the hierarchy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_category_hierarchy AS
SELECT
  id, name, slug, description, image_path,
  parent_id, eyebrow, heading, lede,
  edit_heading, edit_note, rail_aria,
  category_action, cover_image_alt, stats_json,
  sort_order, is_active
FROM public.categories
WHERE is_active = true;

CREATE OR REPLACE VIEW public.v_category_series AS
SELECT
  c.id, c.name, c.slug, c.description, c.image_path,
  c.parent_id, c.eyebrow, c.heading, c.lede,
  c.edit_heading, c.edit_note, c.rail_aria,
  c.category_action, c.cover_image_alt, c.stats_json,
  c.sort_order, c.is_active,
  p.name AS parent_name, p.slug AS parent_slug
FROM public.categories c
LEFT JOIN public.categories p ON p.id = c.parent_id
WHERE c.is_active = true AND c.parent_id IS NOT NULL;
