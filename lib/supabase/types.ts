/**
 * lib/supabase/types.ts
 * Tolerant row types for the Supabase tables this site reads.
 *
 * Fields are optional where the deployed schema varies (for example a `products`
 * table that stores `title`/`category`/`price` instead of `name`/`category_id`),
 * so the data layer can normalise either shape without type assertions everywhere.
 */

export interface CategoryRow {
  id?: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  /** Nullable FK to categories.id — enables parent/child hierarchy (e.g. PVC Wall Panels → series). */
  parent_id?: string | null;
  /** Editorial copy, populated by the admin CategoryForm or a seed script. */
  eyebrow?: string | null;
  heading?: string | null;
  lede?: string | null;
  edit_heading?: string | null;
  edit_note?: string | null;
  rail_aria?: string | null;
  category_action?: string | null;
  cover_image_alt?: string | null;
  country?: string | null;
  source_filename?: string | null;
  source_hash?: string | null;
  page_count?: number | null;
  source_pdf_path?: string | null;
  /** { photographs: number, films: number, source_frames: number } */
  stats_json?: Record<string, unknown> | null;
}

export interface ProductRow {
  id?: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  code?: string | null;
  description?: string | null;
  specs?: unknown;
  /** Physical dimensions. Accepted as a jsonb object or as discrete columns. */
  dimensions?: unknown;
  dimension_height?: number | string | null;
  dimension_width?: number | string | null;
  dimension_depth?: number | string | null;
  dimension_unit?: string | null;
  /** Availability state. */
  stock_status?: string | null;
  availability_status?: string | null;
  price_label?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  /** Structured pricing — compose the display label, never hardcode it. */
  currency?: string | null;
  unit?: string | null;
  discount_badge?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  gallery_paths?: unknown;
  category?: string | null;
  category_id?: string | null;
  category_slug?: string | null;
  is_published?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
}

export interface ProjectRow {
  id?: string;
  title?: string | null;
  slug?: string | null;
  location?: string | null;
  category?: string | null;
  type?: string | null;
  short_description?: string | null;
  description?: string | null;
  before_image?: string | null;
  after_image?: string | null;
  before_image_path?: string | null;
  after_image_path?: string | null;
  gallery_paths?: unknown;
  image_path?: string | null;
  hero_image_path?: string | null;
  video_path?: string | null;
  video_url?: string | null;
  video_paths?: unknown;
  video_poster_path?: string | null;
  year?: number | null;
  is_featured?: boolean | null;
  is_published?: boolean | null;
  sort_order?: number | null;
}

export interface ReviewRow {
  id?: string;
  client_name?: string | null;
  location?: string | null;
  project_type?: string | null;
  rating?: number | null;
  testimonial?: string | null;
  is_verified?: boolean | null;
  is_published?: boolean | null;
  sort_order?: number | null;
  email?: string | null;
  is_demo?: boolean | null;
}

export interface ServiceRow {
  id?: string;
  title?: string | null;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  image_path?: string | null;
  is_published?: boolean | null;
  sort_order?: number | null;
}

export interface SiteSettingsRow {
  id?: string;
  brand_name?: string | null;
  tagline?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  hours?: string | null;
  maps_url?: string | null;
  social_urls?: Record<string, string> | null;
  ticker_content?: string | null;
}

export interface LeadInsert {
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  message: string | null;
  source: string;
}

export interface MediaRow {
  id?: string;
  file_name?: string | null;
  storage_path?: string | null;
  bucket?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  alt_text?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  poster_path?: string | null;
  media_type?: string | null;
  page_number?: number | null;
  checksum?: string | null;
  is_published?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuditLogRow {
  id?: string;
  actor_id?: string | null;
  action: string;
  entity?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
}
