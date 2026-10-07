/**
 * lib/supabase/media-row.ts
 *
 * Canonical `public.media` row -> the shape the admin Media Library renders.
 * Shared by the media collection route and its item route. Route handlers may
 * only export HTTP verbs, so this mapper lives outside app/api.
 */

import { getSupabaseBaseUrl } from "@/lib/supabase/public";
import { ensureAbsoluteImagePath } from "@/lib/content/image-src";

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
  /** Render metadata for collection media items (width / height / caption / poster). */
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  poster_path?: string | null;
  created_at?: string | null;
}

/** Public URL for a stored object, or "" when the bucket/path are unknown. */
export function mediaPublicUrl(bucket: string | null | undefined, path: string | null | undefined) {
  if (!bucket || !path) return "";
  // Centralised sanitiser: a bare storage path expands to a real public URL, and
  // an unusable value yields "" rather than a broken relative path.
  return ensureAbsoluteImagePath(path, { bucket, baseUrl: getSupabaseBaseUrl() ?? undefined, fallback: "" });
}

export function toMediaView(row: MediaRow) {
  const path = row.storage_path ?? "";
  return {
    id: row.id ?? path,
    url: mediaPublicUrl(row.bucket, row.storage_path),
    name: row.file_name ?? path,
    type: (row.mime_type ?? "").startsWith("video/") ? ("video" as const) : ("image" as const),
    alt: row.alt_text ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    size: row.file_size ?? null,
    bucket: row.bucket ?? null,
    storage_path: row.storage_path ?? null,
    alt_text: row.alt_text ?? null,
    caption: row.caption ?? null,
    poster: row.poster_path ? mediaPublicUrl(row.bucket ?? row.bucket, row.poster_path) : null,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id ?? null,
    product_id: row.entity_type === "product" ? row.entity_id : null,
    project_id: row.entity_type === "project" ? row.entity_id : null,
    created_at: row.created_at ?? null,
  };
}

/** Column/schema errors get a migration hint; everything else is reported verbatim. */
export function mediaDbErrorHint(message: string) {
  return /column|does not exist|schema cache/i.test(message)
     ? " Run supabase/migrations/20260923_catalogue_pricing.sql and 20260924_catalogue_hierarchy.sql first."
    : "";
}
