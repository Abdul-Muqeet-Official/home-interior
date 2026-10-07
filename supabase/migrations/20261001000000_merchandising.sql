-- Add merchandising and extended pricing
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'IN STOCK';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hot_item boolean DEFAULT false;

-- Add dimensions
ALTER TABLE products ADD COLUMN IF NOT EXISTS length numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS thickness numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimension_unit text;