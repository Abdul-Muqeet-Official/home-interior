-- supabase/functions/set_updated_at.sql
-- Function to automatically update the `updated_at` timestamp on row modifications

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

