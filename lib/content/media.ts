import type { CollectionMediaItem } from "./types";
/**
 * lib/content/media.ts
 * Editorial artwork system.
 *
 * The studio catalogue artwork in /public/media is hand-authored SVG kept inside
 * this repository, so every image on the site resolves locally — no third-party
 * CDN can break the layout and no broken-image icons can ever appear.
 *
 * Supabase Storage URLs are used instead whenever a record actually provides one.
 */

import { PHOTO_MAP } from "./photo-map";

/** Local verified photography first, hand-authored SVG artwork as the safe fallback. */
function photo(slot: string, fallback: string): string {
  return PHOTO_MAP[slot] ?? fallback;
}

export const ARTWORK = {
  hero: [
    photo("hero-01", "/media/hero-01.svg"),
    photo("hero-02", "/media/hero-02.svg"),
    photo("hero-03", "/media/hero-03.svg"),
  ],
  philosophyBand: "/media/band-light.svg",
  consultationBand: "/media/band-stone.svg",
  emptyState: "/media/texture-plaster.svg",
} as const;

/** Category slug → studio artwork. Keys match the studio catalogue slugs. */
export const CATEGORY_ARTWORK: Record<string, string> = {
  "laminate-flooring": "/media/materials/laminate-flooring.svg",
  "spc-flooring": "/media/products/spc-flooring/sample-01.jpeg",
  "vinyl-flooring": "/media/products/vinyl-flooring/sample-01.jpeg",
  "pvc-wall-panels": "/media/materials/pvc-wall-panel.svg",
  wallpaper: "/media/materials/wallpaper.svg",
  "folding-doors": "/media/folding-doors/fd-17.jpeg",
  /** Real False Ceiling photography from the studio source archive (see lib/content/false-ceiling). */
  "false-ceiling": "/media/false-ceiling/09-coffered-lattice.webp",
  "window-blinds": "/media/roller-blinds/roller-01.webp",
  "3d-wall-picture": "/media/materials/3d-wall-picture.svg",
  "artificial-grass": "/media/artificial-grass/cover.jpeg",
  /**
   * Carpet Tile has no hand-authored studio SVG. The category artwork is resolved from
   * the real imported catalogue (the first published cover) via artworkForCategorySlug
   * consumers; this entry is a last-resort texture so nothing can ever render broken.
   */
  "carpet-tile": "/media/materials/carpet-tile.svg",
};

/** Named editorial photography slots (philosophy / work / services / og). */
export const EDITORIAL_PHOTO = {
  philosophy: photo("philosophy", "/media/band-light.svg"),
  workFeatured: photo("work-featured", "/media/hero-01.svg"),
  work02: photo("work-02", "/media/hero-02.svg"),
  work03: photo("work-03", "/media/hero-03.svg"),
  services: photo("services", "/media/texture-plaster.svg"),
  og: photo("og", "/media/og.svg"),
} as const;

export const DEFAULT_PRODUCT_ARTWORK = "/media/texture-plaster.svg";

/** Loose slug matching so DB category labels ("SPC Flooring") find artwork. */
export function keywordSlug(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.toLowerCase();
  if (value.includes("laminate")) return "laminate-flooring";
  if (value.includes("spc")) return "spc-flooring";
  if (value.includes("vinyl")) return "vinyl-flooring";
  if (value.includes("pvc") || value.includes("panel")) return "pvc-wall-panels";
  if (value.includes("wallpaper")) return "wallpaper";
  if (value.includes("folding") || value.includes("door")) return "folding-doors";
  if (value.includes("gypsum") || value.includes("ceiling") || value.includes("false ceiling")) {
    return "false-ceiling";
  }
  if (value.includes("blind")) return "window-blinds";
  if (value.includes("3d") || value.includes("art") || value.includes("picture"))
    return "3d-wall-picture";
  if (value.includes("grass") || value.includes("turf")) return "artificial-grass";
  if (value.includes("carpet")) return "carpet-tile";
  return null;
}

export function artworkForCategorySlug(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_PRODUCT_ARTWORK;
  return CATEGORY_ARTWORK[slug] ?? DEFAULT_PRODUCT_ARTWORK;
}

export function artworkForCategoryLabel(label: string | null | undefined): string {
  return artworkForCategorySlug(keywordSlug(label));
}

/** True only for absolute http(s) URLs. Everything else is rejected. */
export function isUsableRemoteImage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Resolve the best available image for a record.
 * Returns a remote URL when the record supplies a valid one, otherwise studio artwork.
 */
export function resolveImage(
  candidate: string | null | undefined,
  fallbackArtwork: string = DEFAULT_PRODUCT_ARTWORK
): { src: string; isRemote: boolean; usingFallback: boolean } {
  if (isUsableRemoteImage(candidate)) {
    return { src: candidate.trim(), isRemote: true, usingFallback: false };
  }
  return { src: fallbackArtwork, isRemote: false, usingFallback: true };
}


/** 
 * Enforce a deterministic fallback chain for collection covers:
 * 1. Explicit cover media row
 * 2. First catalogue page media row
 * 3. Global category artwork fallback
 */
export function resolveCollectionCover(
  covers: CollectionMediaItem[],
  pages: CollectionMediaItem[],
  categorySlug: string
): CollectionMediaItem | null {
  if (covers.length > 0 && covers[0]) return covers[0];
  if (pages.length > 0 && pages[0]) return pages[0];
  
  const fallbackArtwork = artworkForCategorySlug(categorySlug);
  
  // Return a dummy CollectionMediaItem to satisfy the type
  return {
    id: "fallback-" + categorySlug,
    src: fallbackArtwork,
    type: "image",
    caption: categorySlug + " collection",
    alt: categorySlug + " collection cover",
    width: 800,
    height: 1000
  };
}

