/**
 * lib/content/types.ts
 * View-model types used by every page component. These are the *normalised*
 * shapes the UI consumes — Supabase rows (and local fallback content) are
 * mapped into them so components never deal with schema variations.
 */

export interface Category {
  slug: string;
  name: string;
  /** One-line editorial description. */
  description: string;
  /** Short factual metadata line, e.g. "Flooring · Waterproof". */
  meta: string;
  /** Local editorial artwork (always available). */
  artwork: string;
  /** Accent tone used for artwork placeholders. */
  tone: "stone" | "champagne" | "graphite" | "sage" | "clay";
  sortOrder: number;
  /** Number of published products in this category, when known. */
  productCount: number;
  /**
   * Reference / collection media for this category. Kept separate from products so
   * real studio photography can enrich a collection without implying that every
   * photograph is a sellable product record.
   */
  collectionMedia: CollectionMediaItem[];
  /** "supabase" when the row came from the database, "studio-catalogue" otherwise. */
  source: "supabase" | "studio-catalogue";
  /** Nullable FK to the parent category, enabling series under a parent collection. */
  parentId: string | null;
}

/**
 * Editorial copy + statistics for a collection, populated from the Supabase
 * categories columns when the admin or seed script has set them. When null,
 * pages fall back to the code-defined lookup tables.
 */
export interface CollectionEditorial {
  eyebrow: string | null;
  heading: string | null;
  lede: string | null;
  editHeading: string | null;
  editNote: string | null;
  railAria: string | null;
  categoryAction: string | null;
  coverImageAlt: string | null;
  stats: { photographs: number; films: number; sourceFrames: number } | null;
}

/** Joined result from the data layer: category + its media + editorial copy. */
export interface CategoryWithData {
  category: Category;
  media: CollectionMediaItem[];
  editorial: CollectionEditorial | null;
}

/**
 * A single piece of category-level reference media. Structurally identical to the
 * False Ceiling item shape so collection media can be swapped without view-model churn.
 */
export interface CollectionMediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

/**
 * Physical dimensions of a product. Every field is optional because most
 * catalogue records supply only some of them (e.g. flooring has a length and
 * width but no depth). `unit` applies to all three and is never invented — it
 * is null until the record states it.
 */
export interface ProductDimensions {
  /** Vertical measure, e.g. a panel or blind height. */
  height: string | null;
  /** Horizontal measure. */
  width: string | null;
  /** Third measure: thickness, depth or projection. */
  depth: string | null;
  length?: string | null;
  thickness?: string | null;
  /** Shared unit for the values above, e.g. "mm", "cm", "in". */
  unit: string | null;
}

/**
 * Stock state of a product. "in_stock" and "out_of_stock" are the two states the
 * catalogue records; `null` means the record states nothing, in which case the UI
 * shows the existing "confirmed at consultation" wording rather than inventing a
 * status.
 */
export type ProductStockStatus = "in_stock" | "out_of_stock";

export interface Product {
  id?: string;
  slug: string;
  name: string;
  code: string | null;
  description: string | null;
  /** Display-ready specs derived from the `specs` jsonb column only. */
  specs: ProductSpec[];
  /** Physical dimensions, or null when the record carries none. */
  dimensions: ProductDimensions | null;
  /** Availability, or null when the record states no stock status. */
  stockStatus: ProductStockStatus | null;
  /** Resolved image URL (Supabase Storage) or local editorial artwork. */
  image: string;
  /**
   * Extra gallery images, when the record provides them. Always excludes the
   * cover `image`, so it can be rendered directly as additional pictures.
   */
  gallery: string[];
  price?: number | null;
  originalPrice?: number | null;
  priceLabel: string | null;
  originalPriceLabel: string | null;
  badge: string | null;
  categorySlug: string;
  categoryName: string;
  tags?: string[];
  /** True when the record had no usable image and studio artwork is shown. */
  usingStudioArtwork: boolean;
  source: "supabase" | "studio-catalogue";
}

export interface Project {
  slug: string;
  title: string;
  location: string | null;
  type: string | null;
  year: number | null;
  summary: string | null;
  description: string | null;
  heroImage: string;
  gallery: string[];
  beforeImage: string | null;
  afterImage: string | null;
  videoUrl: string | null;
  videoGallery: string[];
  videoPoster: string | null;
  usingStudioArtwork: boolean;
}

export interface Review {
  id: string;
  clientName: string;
  location: string | null;
  projectType: string | null;
  rating: number | null;
  testimonial: string;
  isVerified: boolean;
  isDemo?: boolean;
}

export interface Service {
  slug: string;
  title: string;
  description: string;
  meta: string;
}

export interface SearchResult {
  group: "Materials" | "Collections" | "Products" | "Our Work" | "Services";
  title: string;
  subtitle: string | null;
  href: string;
}

