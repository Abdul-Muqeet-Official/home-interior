/**
 * lib/utils.ts
 * Small shared helpers used by the content layer and the UI.
 */

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** Deterministic URL-safe slug. Used when a database row has no slug column. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "finish_type" | "finishType" → "Finish type" */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** 195000 → "PKR 195,000". Returns null for missing/invalid values. */
export function formatPrice(value: number | string | null | undefined): string | null {
  const numeric =
    typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : value ?? null;
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) return null;
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return `PKR ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric)}`;
}

/**
 * Catalogue price label composed from a product's structured pricing fields only.
 *
 *   450 + "PKR" + "sq ft"  ->  "PKR 450 / SQ FT"
 *   450 + null   + null    ->  "PKR 450"
 *   null / 0               ->  null   (the UI then shows PRICE ON CONSULTATION)
 *
 * Nothing is invented: a missing amount yields null rather than a number, a missing
 * unit adds no suffix, and "PKR" is only the fallback for a record that states no
 * currency - the studio's own billing currency.
 */
export function composePriceLabel(
  price: number | string | null | undefined,
  currency: string | null | undefined,
  unit: string | null | undefined
): string | null {
  const amount =
    typeof price === "string" ? Number(price.replace(/[^0-9.-]/g, "")) : price ?? null;
  if (amount === null || amount === undefined) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  const code = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  const measure = typeof unit === "string" ? unit.trim() : "";
  const label = `${code || "PKR"} ${formatted}`;
  return measure ? `${label} / ${measure.toUpperCase()}` : label;
}

export function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function whatsappFor(
  message: string,
  whatsappUrl: string
): string {
  return `${whatsappUrl}?text=${encodeURIComponent(message)}`;
}

/**
 * Join a Supabase Storage bucket + path into a public URL.
 *
 * A value that is already absolute is returned untouched. Anything else is
 * treated as a storage object path (leading slashes are stripped), never as a
 * site-relative path - a bare "materials/x.jpg" only exists in Storage, so
 * prefixing it with "/" would 404.
 */
export function supabasePublicUrl(
  baseUrl: string | null | undefined,
  bucket: string,
  path: string | null | undefined,
  fallbackBaseUrl: string
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = (baseUrl || fallbackBaseUrl).replace(/\/+$/, "");
  if (!base || !/^https?:\/\//i.test(base)) return null;

  const cleaned = path.replace(/^\/+/, "");
  if (!cleaned) return null;

  return `${base}/storage/v1/object/public/${bucket}/${cleaned}`;
}
