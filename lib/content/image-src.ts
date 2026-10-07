/**
 * lib/content/image-src.ts
 *
 * The single, canonical sanitiser for any image/media `src` that originates
 * from the database, storage or operator input.
 *
 * Why this exists
 * ---------------
 * `next/image` throws at render time - not at load time - for a relative path
 * that has no leading slash:
 *
 *   Failed to parse src 'materials/folding-doors/.../f24bcbe4c69bec47.jpeg'
 *   on next/image, if using relative image it must start with a leading slash '/'
 *
 * Real rows in this project store exactly that shape (11 of 40 categories hold
 * a bare `site-assets` storage path), so any surface that renders a raw
 * `image_path` straight into an <Image> can crash an entire category page.
 *
 * Resolution order
 * ----------------
 *   1. absolute http(s)  -> used as-is
 *   2. protocol-relative //host/x -> upgraded to https
 *   3. root-relative /x  -> used as-is (already a valid site path)
 *   4. bare storage path  -> expanded to a full Supabase Storage public URL
 *   5. everything else    -> rejected, caller falls back to artwork
 *
 * Note on step 4: a bare storage path is NOT the same thing as a site-relative
 * path. Prefixing it with "/" would produce a URL that 404s on this site,
 * because the object only exists in Supabase Storage. It is therefore expanded
 * against the public project URL rather than naively slash-prefixed.
 */

/** Bucket used when a row gives a bare path but no bucket of its own. */
export const DEFAULT_MEDIA_BUCKET = "site-assets";

/** Schemes that must never be rendered, whatever the source. */
const UNSAFE_SCHEME = /^\s*(javascript|data|vbscript|file|blob):/i;

/** Only plain http/https are acceptable as absolute sources. */
const ABSOLUTE_HTTP = /^https?:\/\//i;

/**
 * Public Supabase project URL, safe in both server and client bundles.
 * Read directly from NEXT_PUBLIC_* so importing this module never pulls the
 * Supabase SDK into a client component.
 */
function publicSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url && ABSOLUTE_HTTP.test(url) ? url.replace(/\/+$/, "") : "";
}

export interface ImageSrcOptions {
  /** Storage bucket for a bare path. Defaults to {@link DEFAULT_MEDIA_BUCKET}. */
  bucket?: string | null;
  /** Project base URL override; primarily for tests. */
  baseUrl?: string | null;
  /** Returned when the value cannot be made safe. Empty string when omitted. */
  fallback?: string;
}

/** True when the value already satisfies next/image's absolute/relative rules. */
export function isSafeImageSrc(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (UNSAFE_SCHEME.test(trimmed)) return false;
  return ABSOLUTE_HTTP.test(trimmed) || trimmed.startsWith("/") && !trimmed.startsWith("//");
}

/**
 * Return a value that is always safe to hand to `next/image`, or the fallback.
 *
 * @example
 * ensureAbsoluteImagePath("materials/folding-doors/x.jpeg")
 * // "https://<project>.supabase.co/storage/v1/object/public/site-assets/materials/folding-doors/x.jpeg"
 * ensureAbsoluteImagePath("/media/photos/hero.jpg")  // unchanged
 * ensureAbsoluteImagePath("javascript:alert(1)")      // fallback
 */
export function ensureAbsoluteImagePath(
  value: unknown,
  options: ImageSrcOptions = {},
): string {
  const { bucket = DEFAULT_MEDIA_BUCKET, baseUrl, fallback = "" } = options;

  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  // Never render an executable or opaque scheme.
  if (UNSAFE_SCHEME.test(trimmed)) return fallback;

  // 1. Already an absolute http(s) URL.
  if (ABSOLUTE_HTTP.test(trimmed)) return trimmed;

  // 2. Protocol-relative -> force https so next/image has a full origin.
  //    "//host/x" has its slashes stripped by the replace, so exactly one is re-added.
  if (trimmed.startsWith("//")) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }

  // 3. Site-relative path: already valid.
  if (trimmed.startsWith("/")) return trimmed;

  // 4. Bare storage path -> expand against the public project URL.
  //    A leading "./" or a repeated slash is still a relative path.
  const base = (baseUrl ?? publicSupabaseUrl()).replace(/\/+$/, "");
  const cleanPath = trimmed.replace(/^\.\//, "").replace(/^\/+/, "");
  if (!base || !bucket || !cleanPath) return fallback;

  return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/** Build a Supabase Storage public URL, applying the same safety rules. */
export function storageImageSrc(
  bucket: string | null | undefined,
  path: string | null | undefined,
  options: Omit<ImageSrcOptions, "bucket"> = {},
): string {
  if (!path) return options.fallback ?? "";
  return ensureAbsoluteImagePath(path, { ...options, bucket: bucket ?? DEFAULT_MEDIA_BUCKET });
}