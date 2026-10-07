-- Add optional project type storage for admin review and project metadata.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS project_type text;