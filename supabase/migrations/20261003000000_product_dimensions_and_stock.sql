-- supabase/migrations/20261003000000_product_dimensions_and_stock.sql
--
-- Product dimensions, gallery images and stock status.
--
-- Additive and idempotent (IF NOT EXISTS throughout): no DROP TABLE, no DROP
-- COLUMN, no type change on an existing column, no data deletion, no UPDATE of
-- existing rows. Safe to re-run against a partially provisioned project.
--
-- Design notes
-- ------------
-- * Dimensions are stored BOTH as a jsonb `dimensions` object (the flexible
--   shape the UI reads first) and as discrete columns. The jsonb column is the
--   source of truth; the discrete columns exist so the catalogue can be filtered
--   and sorted in SQL without a JSON extraction.
-- * `stock_status` is a constrained text column rather than a boolean, because
--   the catalogue distinguishes exactly two states and both must be legible in
--   the database. NULL means "not stated" and must NOT be shown to visitors as
--   "available" - the UI keeps its existing "confirmed at consultation" wording.
-- * `gallery_paths` already exists on products and is already read by
--   normaliseGallery(); no new column is added for multiple pictures. The
--   existing `images` array requirement is satisfied by that column.

-- ---------------------------------------------------------------------------
-- 1. Dimensions
-- ---------------------------------------------------------------------------

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_height numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_width numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_depth numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimension_unit text;

COMMENT ON COLUMN public.products.dimensions IS
  'Physical dimensions as {height,width,depth,unit}. Null until the record states them.';
COMMENT ON COLUMN public.products.dimension_unit IS
  'Shared unit for the dimension values, e.g. mm, cm, in.';

-- ---------------------------------------------------------------------------
-- 2. Stock status
-- ---------------------------------------------------------------------------

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_status_check'
  ) THEN
    -- NULL is allowed on purpose: it encodes "not stated".
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_status_check
      CHECK (stock_status IS NULL OR stock_status IN ('in_stock', 'out_of_stock'));
  END IF;
END $$;

COMMENT ON COLUMN public.products.stock_status IS
  'in_stock | out_of_stock | NULL (not stated - do not display as available).';

-- ---------------------------------------------------------------------------
-- 3. Indexes (only useful once the columns are populated)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products (stock_status);
CREATE INDEX IF NOT EXISTS idx_products_dimensions ON public.products USING gin (dimensions jsonb_path_ops);