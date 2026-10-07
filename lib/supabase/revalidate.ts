/**
 * lib/supabase/revalidate.ts
 *
 * Admin mutations must be visible on the public site immediately, without a
 * rebuild. Public catalogue routes are statically generated with `revalidate`,
 * so their cached output has to be explicitly invalidated after a write.
 *
 * Only public, cacheable paths are revalidated here. Admin/private data is never
 * added to this list, so it cannot become publicly cached.
 */

import { revalidatePath } from "next/cache";
import { invalidateQueriesCache } from "./queries";

/** Anything a category/collection edit can change. */
export function revalidateCatalogue(slug?: string | null): void {
  invalidateQueriesCache();
  revalidatePath("/");
  revalidatePath("/materials");
  revalidatePath("/our-work");
  revalidatePath("/products");

  if (slug) {
    revalidatePath(`/materials/${slug}`);
    // One level of children (collection pages) and two levels (wallpaper country).
    revalidatePath(`/materials/${slug}/[collection]`, "page");
    revalidatePath(`/materials/${slug}/[country]`, "page");
    revalidatePath(`/materials/${slug}/[country]/[collection]`, "page");
  }

  // Search reads live catalogue rows on every request, so nothing is cached
  // there; revalidating the homepage rail above is what actually matters.
}

export function revalidateProduct(slug?: string | null): void {
  invalidateQueriesCache();
  revalidateCatalogue();
  if (slug) revalidatePath(`/products/${slug}`);
}

export function revalidateReviews(): void {
  invalidateQueriesCache();
  revalidatePath("/");
  revalidatePath("/reviews");
}

export function revalidateWork(slug?: string | null): void {
  invalidateQueriesCache();
  revalidateCatalogue();
  if (slug) revalidatePath(`/our-work/${slug}`);
}
