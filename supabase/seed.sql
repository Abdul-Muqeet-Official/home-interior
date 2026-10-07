-- supabase/seed.sql
-- Canonical seed for HOME INTERIOR (Karachi).
--
-- Idempotent: safe to run repeatedly — upserts on slug, never duplicates rows.
-- Content parity: names/descriptions are reproduced verbatim from
-- lib/content/catalog.ts so the database serves exactly the copy the site
-- displays. No fabricated products, projects, reviews, awards or statistics.
-- image_path is intentionally left NULL: the frontend renders its own
-- slug-mapped artwork for categories, so no broken images can occur while
-- real photography is still being uploaded to storage.

INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Laminate Flooring',
   'laminate-flooring',
   'High-pressure laminate planks engineered for depth of grain, dimensional stability and everyday durability.',
   1, true),
  ('SPC Flooring',
   'spc-flooring',
   'Stone-polymer composite planks with a rigid core, waterproof performance and a quiet, solid underfoot feel.',
   2, true),
  ('Vinyl Flooring',
   'vinyl-flooring',
   'Resilient vinyl in wood and stone evolutions — warm underfoot, low maintenance and suited to high-traffic rooms.',
   3, true),
  ('PVC Wall Panels',
   'pvc-wall-panel',
   'Seamless decorative panels that clad, cover and finish interior walls with crisp shadow lines.',
   4, true),
  ('Wallpaper',
   'wallpaper',
   'Textured and patterned papers, from quiet linens and grasscloths to statement murals.',
   5, true),
  ('Folding Doors',
   'folding-door',
   'Space-efficient folding systems that open interiors to light, air and garden views.',
   6, true),
  ('False Ceiling',
   'false-ceiling',
   'Sculpted plasterboard ceilings with integrated cove lighting, shadow gaps and concealed services.',
   7, true),
  ('Window Blinds',
   'window-blinds',
   'Precision blinds in timber, woven and technical weaves for measured daylight control.',
   8, true),
  ('3D Wall Panels & Wall Art',
   '3d-wall-picture',
   'Sculptural relief panels and framed art that give feature walls a third dimension.',
   9, true),
  ('Artificial Grass',
   'artificial-grass',
   'Soft, weather-stable turf for terraces, courtyards, balconies and green interiors.',
   10, true)
ON CONFLICT (slug) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order,
      is_active   = EXCLUDED.is_active,
      updated_at  = now();

-- Studio services (verbatim from lib/content/services.ts)
INSERT INTO public.services (title, slug, short_description, description, is_published, sort_order) VALUES
  ('Interior Architecture',
   'interior-architecture',
   'Spatial planning',
   'Space planning, circulation and built form resolved before a single finish is chosen — walls, openings and volumes drawn to suit how a room is actually lived in.',
   true, 1),
  ('Residential Interior Design',
   'residential-interior-design',
   'Full residence',
   'Complete residential interiors: layouts, joinery, lighting, finishes and furnishing, developed as one coordinated scheme from entry hall to private rooms.',
   true, 2),
  ('Living Room Design',
   'living-room-design',
   'Principal reception',
   'Seating compositions, feature walls, concealed lighting and material layering that give the principal reception room presence without noise.',
   true, 3),
  ('Bedroom Interiors',
   'bedroom-interiors',
   'Private rooms',
   'Calm, tactile bedrooms: bedside joinery, wardrobes, layered lighting and acoustic softness for rest.',
   true, 4),
  ('Kitchen Renovation',
   'kitchen-renovation',
   'Kitchen & utility',
   'Ergonomic kitchen layouts with custom cabinetry, durable work surfaces and a considered lighting plan for both working and gathering.',
   true, 5),
  ('Gypsum Ceiling Design',
   'gypsum-ceiling-design',
   'Ceilings',
   'Designed ceilings that shape daylight and artificial light — coves, shadow gaps and concealed service routes.',
   true, 6),
  ('Wall & Surface Finishes',
   'wall-surface-finishes',
   'Finishes',
   'Panelling, wallpaper, textured plaster and stone-look surfaces installed with precise junction detailing.',
   true, 7),
  ('Turnkey Project Management',
   'turnkey-project-management',
   'Execution',
   'One point of coordination from drawing to handover — procurement, site supervision, quality checks and snagging.',
   true, 8)
ON CONFLICT (slug) DO UPDATE
  SET title             = EXCLUDED.title,
      short_description = EXCLUDED.short_description,
      description       = EXCLUDED.description,
      is_published      = EXCLUDED.is_published,
      sort_order        = EXCLUDED.sort_order,
      updated_at        = now();

-- Site settings — factual business information only (no invented socials/awards/stats).
-- Singleton row with a deterministic id so the upsert never duplicates.
INSERT INTO public.site_settings
  (id, brand_name, tagline, phone, whatsapp, address, social_urls, hero_content, ticker_content, seo_defaults)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'HOME INTERIOR',
   'KARACHI — BESPOKE LIVING STUDIO',
  '+92 300 1234567',
  '+92 303 2566212',
   'BUILDING 45C, SHOP 1,
LANE 11,
NEAR KABABJEES,
BADAR COMMERCIAL,
DHA PHASE 5,
KARACHI',
   '{}'::jsonb,
   '{}'::jsonb,
   'HOME INTERIOR — BESPOKE INTERIORS — MATERIALS — ARCHITECTURAL DETAIL — KARACHI — PRIVATE CONSULTATIONS — RESIDENTIAL DESIGN',
   '{"title":"HOME INTERIOR — Bespoke Interior Design Studio in Karachi","description":"HOME INTERIOR is a Karachi-based bespoke interior design studio offering refined residential interiors, architectural finishes, materials and turnkey design services."}'::jsonb)
ON CONFLICT (id) DO UPDATE
  SET brand_name     = EXCLUDED.brand_name,
      tagline        = EXCLUDED.tagline,
      phone          = EXCLUDED.phone,
      whatsapp       = EXCLUDED.whatsapp,
      address        = EXCLUDED.address,
      social_urls    = EXCLUDED.social_urls,
      hero_content   = EXCLUDED.hero_content,
      ticker_content = EXCLUDED.ticker_content,
      seo_defaults   = EXCLUDED.seo_defaults,
      updated_at     = now();


