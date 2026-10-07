/**
 * lib/supabase/catalogue-row.ts
 *
 * Translates friendly admin form payloads into the canonical catalogue columns.
 *
 * Keeping this in one place means create and update can never drift apart, and the
 * database always receives the real schema (price / currency / unit / specs /
 * image_path / gallery_paths / is_published) rather than the form's field names.
 */

const text = (value: unknown): string | null => {
  const value$ = typeof value === "string" ? value.trim() : "";
  return value$ ? value$ : null;
};

const numeric = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export interface ProductRowInsert {
  name: string;
  title: string;
  category: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number | null;
  original_price: number | null;
  currency: string | null;
  unit: string | null;
  price_label: string | null;
  specs: Record<string, unknown>;
  image_path: string | null;
  image_url: string | null;
  gallery_paths: string[];
  is_published: boolean;
  sort_order: number;
  updated_at?: string;
}

export function productToRow(body: Record<string, unknown>): ProductRowInsert {
  const images = Array.isArray(body.images) ? (body.images as unknown[]).filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
  ) : [];

  const rawSpecs: Record<string, unknown> =
    body.specifications && typeof body.specifications === "object"
      ? { ...(body.specifications as Record<string, unknown>) }
      : body.specs && typeof body.specs === "object"
      ? { ...(body.specs as Record<string, unknown>) }
      : {};

  if (body.code) rawSpecs.code = text(body.code);
  if (body.dimensions && typeof body.dimensions === "object") {
    rawSpecs.dimensions = body.dimensions;
  }
  if (body.stock_status || body.stockStatus) {
    rawSpecs.stock_status = body.stock_status ?? body.stockStatus;
  }
  if (body.availability || body.availability_status) {
    rawSpecs.availability = body.availability ?? body.availability_status;
  }

  const productName = String(body.name ?? body.title ?? "").trim();
  const categoryName = String(body.category ?? body.category_name ?? "Studio Materials").trim();

  return {
    name: productName,
    title: productName,
    category: categoryName,
    slug: String(body.slug ?? "").trim(),
    description: typeof body.description === "string" ? body.description : null,
    category_id: text(body.category_id),
    price: numeric(body.price),
    original_price: numeric(body.original_price),
    currency: text(body.currency) ?? "PKR",
    unit: text(body.unit),
    price_label: text(body.price_label),
    specs: rawSpecs,
    image_path: text(body.image_path) ?? text(body.image_url) ?? images[0] ?? "/media/materials/wallpaper.svg",
    image_url: text(body.image_url) ?? text(body.image_path) ?? images[0] ?? "/media/materials/wallpaper.svg",
    gallery_paths: images.length > 0 ? images : Array.isArray(body.gallery_paths) ? (body.gallery_paths as string[]) : [],
    is_published: body.published === true || body.is_published === true,
    sort_order: Number(body.sort_order) || 0,
    updated_at: new Date().toISOString(),
  };
}

export interface CategoryRowInsert {
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  eyebrow: string | null;
  heading: string | null;
  lede: string | null;
  edit_heading: string | null;
  edit_note: string | null;
  rail_aria: string | null;
  category_action: string | null;
  cover_image_alt: string | null;
  stats_json: Record<string, unknown>;
  updated_at?: string;
}

export function categoryToRow(body: Record<string, unknown>): CategoryRowInsert {
  const statsJson =
    body.specifications && typeof body.specifications === "object"
      ? (body.specifications as Record<string, unknown>)
      : {};

  return {
    name: String(body.name ?? "").trim(),
    slug: String(body.slug ?? "").trim(),
    description: typeof body.description === "string" ? body.description : null,
    image_path: text(body.cover_image) ?? text(body.image_path),
    sort_order: Number(body.sort_order) || 0,
    is_active: body.published === true || body.is_active === true,
    parent_id: text(body.parent_id) ?? null,
    eyebrow: text(body.eyebrow) ?? null,
    heading: text(body.heading) ?? null,
    lede: text(body.lede) ?? null,
    edit_heading: text(body.edit_heading) ?? null,
    edit_note: text(body.edit_note) ?? null,
    rail_aria: text(body.rail_aria) ?? null,
    category_action: text(body.category_action) ?? null,
    cover_image_alt: text(body.cover_image_alt) ?? null,
    stats_json: {
      photographs: Number(body.photographs) || 0,
      films: Number(body.films) || 0,
      source_frames: Number(body.source_frames) || 0,
      ...statsJson,
    },
    updated_at: new Date().toISOString(),
  };
}
