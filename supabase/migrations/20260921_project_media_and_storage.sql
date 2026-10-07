-- Additive project video gallery support and production media bucket aliases.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS video_paths jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-media', 'project-media', true),
  ('product-media', 'product-media', true),
  ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.projects.video_paths IS 'Ordered public project video paths or URLs.';