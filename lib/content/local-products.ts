import type { Product } from "./types";

/**
 * Local fallback catalogue.
 *
 * These records stand in for the database when it is unreachable. They are
 * deliberately EMPTY of commercial data:
 *
 *  - `dimensions` is null because no real measurement is on file for a sample.
 *    The UI then falls back to the specification table instead of showing a
 *    fabricated size.
 *  - `stockStatus` is null, which means "not stated". It must not be defaulted
 *    to "in_stock": that would advertise availability the studio never confirmed.
 *    The UI keeps its existing "confirmed at consultation" wording.
 *
 * Real values arrive from `mapProduct()` once the catalogue rows are reachable.
 */
function localSamples(categorySlug: string, categoryName: string, count: number): Product[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const slug = `${categorySlug}-sample-${number}`;
    const image = `/media/products/${categorySlug}/sample-${number}.jpeg`;
    return {
      slug,
      name: `${categoryName} Sample ${number}`,
      code: null,
      description: null,
      specs: [],
      dimensions: null,
      stockStatus: null,
      image,
      // `image` is the cover, and the gallery holds only the additional
      // pictures, so it starts empty rather than repeating the cover.
      gallery: [],
      priceLabel: null,
      originalPriceLabel: null,
      badge: null,
      categorySlug,
      categoryName,
      usingStudioArtwork: false,
      source: "studio-catalogue",
    };
  });
}

export const LOCAL_PRODUCTS: Product[] = [
  ...localSamples("vinyl-flooring", "Vinyl Flooring", 32),
  ...localSamples("spc-flooring", "SPC Flooring", 13),
];
