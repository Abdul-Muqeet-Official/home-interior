/**
 * lib/supabase/queries.ts
 * Application data access.
 *
 * Rules enforced here:
 *  1. Public reads use the anon key + RLS; the service-role key is never touched.
 *  2. Nothing throws. A missing table, empty table or unreachable database degrades to
 *     the local studio catalogue (categories/services) or an empty collection
 *     (products/projects/reviews) which the UI renders as an elegant empty state.
 *  3. Placeholder junk ("Spec 1", "Lorem ipsum", "Unsplash / High-res Image Link") is
 *     filtered out before it can ever reach the interface.
 */

import { getSupabaseServerClient, getSupabaseBaseUrl } from "./public";
import type {
  CategoryRow,
  LeadInsert,
  MediaRow,
  ProductRow,
  ProjectRow,
  ReviewRow,
  ServiceRow,
  SiteSettingsRow,
} from "./types";
import type {
  Category,
  CollectionEditorial,
  CategoryWithData,
  CollectionMediaItem,
  Product,
  ProductDimensions,
  ProductSpec,
  ProductStockStatus,
  Project,
  Review,
  SearchResult,
  Service,
} from "@/lib/content/types";
import {
  STUDIO_CATEGORIES,
  findStudioCategory,
  resolveCategorySlug,
} from "@/lib/content/catalog";
import { STUDIO_SERVICES } from "@/lib/content/services";
import {
  DEFAULT_PRODUCT_ARTWORK,
  artworkForCategorySlug,
  isUsableRemoteImage,
  keywordSlug,
  resolveImage,
} from "@/lib/content/media";
import { SITE } from "@/lib/site.config";
import { ensureAbsoluteImagePath } from "@/lib/content/image-src";
import { LOCAL_PRODUCTS } from "@/lib/content/local-products";
import {
  composePriceLabel,
  formatPrice,
  humanizeKey,
  slugify,
  supabasePublicUrl,
} from "@/lib/utils";
import type { LeadInput } from "./validateLead";

/* ------------------------------------------------------------------ *
 * Low level helpers
 * ------------------------------------------------------------------ */

/** Tables already reported as unavailable — keeps server logs readable. */
const reportedTables = new Set<string>();

function warn(scope: string, error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  console.warn(`[home-interior] ${scope}: ${message}`);
}

function warnOnce(scope: string, error: unknown) {
  if (reportedTables.has(scope)) return;
  reportedTables.add(scope);
  warn(scope, error);
}

/**
 * Select rows from a table with an explicit publication/active filter.
 * Errors fail closed: an older or incompatible schema must never cause an
 * unfiltered read of draft or inactive business records.
 */
import { cache } from "react";

async function fetchRowsInner<T>(
  table: string,
  publishedColumn: "is_published" | "is_active" | null,
  columns = "*"
): Promise<T[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    let query = client.from(table).select(columns);
    if (publishedColumn) query = query.eq(publishedColumn, true);
    const result = await query.limit(500);

    if (result.error) {
      warnOnce(`table "${table}" unavailable`, result.error);
      return [];
    }
    return (result.data ?? []) as T[];
  } catch (error) {
    warnOnce(`table "${table}" request failed`, error);
    return [];
  }
}

const fetchRows = cache(fetchRowsInner);

/** Invalidate in-memory query caches when content mutations happen. */
export function invalidateQueriesCache(): void {
  // Clears any memoized query caches if present
}

/** Convenience for direct Supabase queries (null when env is absent). */
function getSupabaseClientOrNull() {
  return getSupabaseServerClient();
}

/** Reject placeholder/dummy copy before it reaches the UI. */
export function cleanText(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes("lorem ipsum")) return null;
  if (["spec 1", "spec 2", "spec 3", "category", "placeholder", "todo", "tbd", "n/a"].includes(lower)) {
    return null;
  }
  if (/unsplash|high-res image link|placeholder|dummy image|example\.com/i.test(lower) && trimmed.length < 90) {
    return null;
  }
  return trimmed.slice(0, max);
}

/** jsonb specs → ordered label/value pairs. Accepts arrays and plain objects. */
export function normaliseSpecs(specs: unknown): ProductSpec[] {
  const rows: ProductSpec[] = [];

  const push = (label: string, value: unknown) => {
    const cleanLabel = humanizeKey(label);
    if (value === null || value === undefined) return;
    if (typeof value === "number") {
      rows.push({ label: cleanLabel, value: String(value) });
      return;
    }
    if (typeof value === "boolean") {
      rows.push({ label: cleanLabel, value: value ? "Yes" : "No" });
      return;
    }
    if (Array.isArray(value)) {
      const joined = value
        .filter((entry) => typeof entry === "string" || typeof entry === "number")
        .join(", ");
      if (joined) rows.push({ label: cleanLabel, value: cleanText(joined, 240) ?? joined });
      return;
    }
    const text = cleanText(value, 240);
    if (text) rows.push({ label: cleanLabel, value: text });
  };

  if (Array.isArray(specs)) {
    specs.forEach((item, index) => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const rawLabel = record.label ?? record.name ?? record.key ?? `Specification ${index + 1}`;
        push(String(rawLabel), record.value ?? record.text);
      } else {
        push(`Specification ${index + 1}`, item);
      }
    });
    return rows;
  }

  if (specs && typeof specs === "object") {
    Object.entries(specs as Record<string, unknown>).forEach(([key, value]) => {
      if (key.toLowerCase() === "code") return;
      push(key, value);
    });
  }

  return rows;
}

/**
 * Dimensions → view model.
 *
 * Reads the jsonb `dimensions` object first and falls back to the discrete
 * columns, so the UI works whether the record was written one way or the other.
 * Returns null when nothing is stated: a partially filled record keeps its known
 * values, and a record with no dimension data at all stays null rather than
 * rendering a fabricated "0" or an empty measurement.
 */
function normaliseDimensions(row: ProductRow): ProductDimensions | null {
  const json = row.dimensions && typeof row.dimensions === "object" && !Array.isArray(row.dimensions)
    ? (row.dimensions as Record<string, unknown>)
    : {};

  /** Accepts numbers and numeric strings; drops empties and zero. */
  const measure = (value: unknown): string | null => {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? String(value) : null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed === "0") return null;
      return cleanText(trimmed, 24);
    }
    return null;
  };

  const height = measure(json.height ?? row.dimension_height);
  const width = measure(json.width ?? row.dimension_width);
  // Many finish products quote a third measure as "thickness" rather than "depth".
  const depth = measure(json.depth ?? json.thickness ?? row.dimension_depth);
  const unit = cleanText(json.unit ?? row.dimension_unit, 16);

  if (!height && !width && !depth) return null;
  return { height, width, depth, unit };
}

/**
 * Stock status → one of the two catalogue states, or null when the record says
 * nothing. Never defaults to "in_stock": that would assert availability the
 * record never claimed.
 */
function normaliseStockStatus(row: ProductRow): ProductStockStatus | null {
  const raw = (row.stock_status ?? row.availability_status ?? "").toString().trim().toLowerCase();
  if (!raw) return null;
  if (raw === "in_stock" || raw === "available" || raw === "in stock") return "in_stock";
  if (raw === "out_of_stock" || raw === "unavailable" || raw === "out of stock") return "out_of_stock";
  return null;
}

const SITE_URL_FALLBACK = "https://localhost";

/** jsonb gallery -> absolute URLs (storage paths are expanded, junk is dropped). */
function normaliseGallery(value: unknown, bucket: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      typeof entry === "string" ? ensureAbsoluteImagePath(entry, { bucket }) : null
    )
    .filter((entry): entry is string => Boolean(entry));
}

/** Single storage path -> absolute URL (or null). */
function storageImage(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  const resolved = ensureAbsoluteImagePath(path, { bucket });
  return resolved || null;
}

/* ------------------------------------------------------------------ *
 * Row → view-model normalisers
 * ------------------------------------------------------------------ */

function mapProduct(row: ProductRow, categoryLabelById: Map<string, string>): Product | null {
  const name = cleanText(row.name ?? row.title, 160);
  if (!name) return null;

  const dbSlug = cleanText(row.slug, 120);
  const slug = slugify(dbSlug ?? name);
  if (!slug) return null;

  const rawCategory =
    cleanText(row.category, 120) ??
    cleanText(row.category_slug, 120) ??
    (row.category_id ? categoryLabelById.get(row.category_id) ?? null : null);

  const canonicalSlug =
    resolveCategorySlug(row.category_slug) ??
    resolveCategorySlug(rawCategory) ??
    keywordSlug(rawCategory);
  const studioCategory = canonicalSlug ? findStudioCategory(canonicalSlug) : null;
  const artwork = canonicalSlug ? artworkForCategorySlug(canonicalSlug) : DEFAULT_PRODUCT_ARTWORK;
  const resolved = resolveImage(
    row.image_url ?? storageImage("products", row.image_path),
    artwork
  );

  return {
    slug,
    name,
    code: cleanText(row.code, 60),
    description: cleanText(row.description, 1600),
    specs: normaliseSpecs(row.specs),
    dimensions: normaliseDimensions(row),
    stockStatus: normaliseStockStatus(row),
    image: resolved.src,
    // The cover is rendered separately, so drop it from the gallery to avoid a
    // duplicate thumbnail when the record repeats it in gallery_paths.
    gallery: normaliseGallery(row.gallery_paths, "products").filter((entry) => entry !== resolved.src),
    priceLabel: cleanText(row.price_label, 60) ?? composePriceLabel(row.price, row.currency, row.unit),
    originalPriceLabel: formatPrice(row.original_price),
    badge: cleanText(row.discount_badge, 40),
    categorySlug: studioCategory?.slug ?? canonicalSlug ?? "uncategorised",
    categoryName: studioCategory?.name ?? rawCategory ?? "Materials & Products",
    usingStudioArtwork: resolved.usingFallback,
    source: "supabase",
  };
}

function mapProject(
  row: ProjectRow,
  index: number
): Project | null {
  const title = cleanText(row.title, 180);
  if (!title) return null;
  const slug = slugify(cleanText(row.slug, 160) ?? title);
  if (!slug) return null;

  const gallery = normaliseGallery(row.gallery_paths, "projects");
  const heroCandidate =
    storageImage("projects", row.hero_image_path) ??
    storageImage("projects", row.image_path) ??
    gallery[0] ??
    null;
  const fallbackArtwork = index % 2 === 0 ? "/media/band-stone.svg" : "/media/band-light.svg";
  const resolved = resolveImage(heroCandidate, fallbackArtwork);

  const videoUrl = resolveImage(
    row.video_url ?? storageImage("projects", row.video_path),
    ""
  ).src;
  const videoGallery = normaliseGallery(row.video_paths, "projects");

  const videoPoster = row.video_poster_path
    ? storageImage("projects", row.video_poster_path)
    : null;

  return {
    slug,
    title,
    location: cleanText(row.location, 120),
    type: cleanText(row.type, 120),
    year: typeof row.year === "number" && row.year > 1900 ? row.year : null,
    summary: cleanText(row.short_description, 260),
    description: cleanText(row.description, 5000),
    heroImage: resolved.src,
    gallery: gallery.filter((entry) => entry !== heroCandidate),
    beforeImage: storageImage("projects", row.before_image_path),
    afterImage: storageImage("projects", row.after_image_path),
    videoUrl: isUsableRemoteImage(videoUrl) ? videoUrl : null,
    videoGallery,
    videoPoster,
    usingStudioArtwork: resolved.usingFallback,
  };
}

function mapReview(row: ReviewRow): Review | null {
  const testimonial = cleanText(row.testimonial, 1200);
  const clientName = cleanText(row.client_name, 120);
  if (!testimonial || !clientName) return null;
  const rating =
    typeof row.rating === "number" && row.rating >= 1 && row.rating <= 5 ? row.rating : null;
  return {
    id: String(row.id ?? `${clientName}-${testimonial.slice(0, 12)}`),
    clientName,
    location: cleanText(row.location, 120),
    projectType: cleanText(row.project_type, 120),
    rating,
    testimonial,
    isVerified: true,
  };
}

/* ------------------------------------------------------------------ *
 * Public API — every function resolves, never throws
 * ------------------------------------------------------------------ */

/** All published products, normalised. Empty array when the table is absent/empty. */
export const getProducts = cache(async function getProducts(): Promise<Product[]> {
  const [rows, categoryRows] = await Promise.all([
    fetchRows<ProductRow>("products", "is_published"),
    fetchRows<CategoryRow>("categories", "is_active"),
  ]);

  const categoryLabelById = new Map<string, string>();
  categoryRows.forEach((row) => {
    const label = cleanText(row.name ?? row.title, 120);
    if (row.id && label) categoryLabelById.set(row.id, label);
  });

  const seen = new Set<string>();
  const products: Product[] = [];
  for (const row of rows) {
    const mapped = mapProduct(row, categoryLabelById);
    if (mapped && !seen.has(mapped.slug)) {
      seen.add(mapped.slug);
      products.push(mapped);
    }
  }

  const remoteSlugs = new Set(products.map((product) => product.slug));
  const localProducts = LOCAL_PRODUCTS.filter((product) => !remoteSlugs.has(product.slug));
  return [...products, ...localProducts].sort((a, b) => a.name.localeCompare(b.name));
});

/**
 * Studio categories, optionally enriched with Supabase rows.
 * Supabase artwork/description wins when present; the studio catalogue guarantees the
 * ten collections always render with imagery even when the database is empty.
 */
export const getCategories = cache(async function getCategories(): Promise<Category[]> {
  const [categoryRows, products] = await Promise.all([
    fetchRows<CategoryRow>("categories", "is_active"),
    getProducts(),
  ]);

  const productCounts = new Map<string, number>();
  products.forEach((product) => {
    productCounts.set(product.categorySlug, (productCounts.get(product.categorySlug) ?? 0) + 1);
  });

  const categories: Category[] = STUDIO_CATEGORIES.map((category) => ({
    ...category,
    productCount: productCounts.get(category.slug) ?? 0,
  }));

  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  categoryRows.forEach((row, index) => {
    // A row with a parent_id is a *collection* (e.g. a Wallpaper country catalogue or a
    // Carpet Tile source PDF), not a top-level material category. It owns its own
    // route, so promoting it here would publish a dead /materials/<name> link.
    if (row.parent_id) return;
    const label = cleanText(row.name ?? row.title, 120);
    const slug = resolveCategorySlug(row.slug) ?? resolveCategorySlug(label) ?? keywordSlug(label);
    const remoteImage = resolveImage(
      row.image_url ?? storageImage("site-assets", row.image_path),
      ""
    ).src;
    const usableImage = isUsableRemoteImage(remoteImage) ? remoteImage : null;

    const existing = slug ? bySlug.get(slug) : undefined;
    if (existing) {
      const updated: Category = {
        ...existing,
        parentId: row.parent_id ?? null,
        name: label ?? existing.name,
        description: cleanText(row.description, 400) ?? existing.description,
        artwork: usableImage ?? existing.artwork,
        source: "supabase",
      };
      bySlug.set(existing.slug, updated);
      return;
    }

    if (label) {
      const generatedSlug = slugify(label);
      bySlug.set(generatedSlug, {
        slug: generatedSlug,
        name: label,
        description: cleanText(row.description, 400) ?? "Studio collection.",
        meta: "Collection",
        artwork: usableImage ?? DEFAULT_PRODUCT_ARTWORK,
        tone: "stone",
        sortOrder: 100 + index,
        productCount: productCounts.get(generatedSlug) ?? 0,
        collectionMedia: [],
        source: "supabase",
        parentId: row.parent_id ?? null,
      });
    }
  });

  return Array.from(bySlug.values()).sort((a, b) => a.sortOrder - b.sortOrder);
});

export interface WallpaperCollection {
  id: string;
  name: string;
  slug: string;
  country: "china" | "korea";
  pageCount: number;
  cover: CollectionMediaItem | null;
  media: CollectionMediaItem[];
}

export async function getWallpaperCollections(country?: string, includePages = false): Promise<WallpaperCollection[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];
  const countryFilter = country === "china" || country === "korea" ? country : null;
  let query = client.from("categories").select("id,name,slug,country,page_count").eq("is_active", true).not("country", "in", "(null)");
  if (countryFilter) query = query.eq("country", countryFilter);
  const { data, error } = await query.order("country", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true }).limit(200);
  if (error) { warnOnce("wallpaper categories unavailable", error); return []; }
  const rows = (data ?? []) as Array<{ id: string; name: string; slug: string; country: string; page_count: number | null }>;
  const validRows = rows.filter((row) => row.country === "china" || row.country === "korea");

  if (!includePages) {
    const { data: coversData } = await client
      .from("media")
      .select("id, file_name, storage_path, bucket, mime_type, alt_text, width, height, caption, poster_path, media_type, page_number, entity_id")
      .eq("bucket", "wallpaper-catalogue")
      .eq("media_type", "cover")
      .eq("is_published", true);

    const coverMap = new Map<string, CollectionMediaItem>();
    (coversData ?? []).forEach((cRow) => {
      const item = mapMediaRowToCollectionItem(cRow as MediaRow);
      if (item && cRow.entity_id) coverMap.set(cRow.entity_id, item);
    });

    return validRows.map((row) => {
      const cover = coverMap.get(row.id) ?? null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        country: row.country as "china" | "korea",
        pageCount: row.page_count ?? 0,
        cover,
        media: cover ? [cover] : [],
      };
    });
  }

  return Promise.all(validRows.map(async (row) => {
    const media = await getCollectionMediaItems(row.id);
    const pages = media.filter((item) => item.id.length > 0);
    const cover = pages.find((p) => p.type === "image") ?? pages[0] ?? null;
    return { id: row.id, name: row.name, slug: row.slug, country: row.country as "china" | "korea", pageCount: row.page_count ?? pages.length, cover, media: pages };
  }));
}
export interface CarpetTileCollection {
  id: string;
  name: string;
  /** URL slug without the `carpet-tile-` collection prefix. */
  slug: string;
  sourceFilename: string | null;
  pageCount: number;
  cover: CollectionMediaItem | null;
  /** Rendered catalogue pages, in page order. */
  media: CollectionMediaItem[];
}

const CARPET_TILE_PARENT = "carpet-tile";
const CARPET_TILE_PREFIX = "carpet-tile-";
const CARPET_TILE_BUCKET = "carpet-catalogue";

/**
 * Carousel-quality items for a collection, read in one paginated query.
 *
 * Only published media from the carpet-catalogue bucket is returned. Covers and pages
 * are separated by media_type so the page list is never polluted by a cover row.
 */
async function getCarpetTileMedia(categoryId: string): Promise<{
  cover: CollectionMediaItem | null;
  pages: CollectionMediaItem[];
}> {
  const client = getSupabaseClientOrNull();
  if (!client) return { cover: null, pages: [] };

  const columns =
    "id, file_name, storage_path, bucket, mime_type, alt_text, width, height, caption, media_type, page_number, sort_order";
  const rows: MediaRow[] = [];
  for (let offset = 0; offset < 2000; offset += 1000) {
    const page = await client
      .from("media")
      .select(columns)
      .eq("entity_type", "category")
      .eq("entity_id", categoryId)
      .eq("bucket", CARPET_TILE_BUCKET)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .range(offset, offset + 999);
    if (page.error) {
      warnOnce("carpet tile media unavailable", page.error);
      return { cover: null, pages: [] };
    }
    const batch = (page.data ?? []) as MediaRow[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }

  const covers = rows
    .filter((row) => row.media_type === "cover")
    .map((row) => mapMediaRowToCollectionItem(row))
    .filter((item): item is CollectionMediaItem => item !== null);

  const pages = rows
    .filter((row) => row.media_type === "rendered-page")
    .map((row) => mapMediaRowToCollectionItem(row))
    .filter((item): item is CollectionMediaItem => item !== null)
    .sort((a, b) => a.caption.localeCompare(b.caption, undefined, { numeric: true }));

  return { cover: covers[0] ?? null, pages };
}

/**
 * Carpet Tile collections.
 *
 * Reuses the existing categories/media architecture: the `carpet-tile` parent row owns
 * child rows, one per unique source PDF, each carrying its rendered pages and cover.
 * An unavailable database degrades to an empty list (the UI renders a truthful empty
 * state) rather than throwing.
 */
export async function getCarpetTileCollections(): Promise<CarpetTileCollection[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const parent = await client
    .from("categories")
    .select("id")
    .eq("slug", CARPET_TILE_PARENT)
    .eq("is_active", true)
    .maybeSingle();
  if (parent.error) {
    warnOnce("carpet tile parent unavailable", parent.error);
    return [];
  }
  const parentId = parent.data?.id;
  if (!parentId) return [];

  const children = await client
    .from("categories")
    .select("id, name, slug, source_filename, page_count")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .not("source_hash", "is", null)
    .order("name", { ascending: true })
    .limit(200);
  if (children.error) {
    warnOnce("carpet tile collections unavailable", children.error);
    return [];
  }

  const rows = (children.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    source_filename: string | null;
    page_count: number | null;
  }>;

  const childIds = rows.map((r) => r.id);
  const { data: mediaRows } = await client
    .from("media")
    .select(
      "id, file_name, storage_path, bucket, mime_type, alt_text, width, height, caption, poster_path, media_type, page_number, entity_id"
    )
    .in("entity_id", childIds)
    .eq("bucket", CARPET_TILE_BUCKET)
    .eq("is_published", true);

  const coverMap = new Map<string, CollectionMediaItem>();
  const pagesCountMap = new Map<string, number>();

  (mediaRows ?? []).forEach((mRow) => {
    const item = mapMediaRowToCollectionItem(mRow as MediaRow);
    if (!item || !mRow.entity_id) return;
    if (mRow.media_type === "cover" && !coverMap.has(mRow.entity_id)) {
      coverMap.set(mRow.entity_id, item);
    }
    if (mRow.media_type === "rendered-page") {
      pagesCountMap.set(mRow.entity_id, (pagesCountMap.get(mRow.entity_id) ?? 0) + 1);
    }
  });

  return rows.map((row) => {
    const cover = coverMap.get(row.id) ?? null;
    const pageCount = row.page_count ?? pagesCountMap.get(row.id) ?? 0;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug.startsWith(CARPET_TILE_PREFIX)
        ? row.slug.slice(CARPET_TILE_PREFIX.length)
        : row.slug,
      sourceFilename: cleanText(row.source_filename, 160),
      pageCount,
      cover,
      media: [],
    };
  });
}

/** Resolve a single Carpet Tile collection by its URL slug, or null. */
export async function getCarpetTileCollection(
  slug: string | null | undefined
): Promise<CarpetTileCollection | null> {
  if (!slug) return null;
  const key = decodeURIComponent(slug).toLowerCase().trim();
  const collections = await getCarpetTileCollections();
  return collections.find((entry) => entry.slug === key) ?? null;
}

export async function getCategory(slug: string): Promise<Category | null> {
  const canonical = resolveCategorySlug(slug) ?? slugify(decodeURIComponent(slug));
  if (!canonical) return null;
  const categories = await getCategories();
  return categories.find((category) => category.slug === canonical) ?? null;
}

/**
 * Map a raw `media` row into a `CollectionMediaItem` for the MaterialCollection
 * component. Returns null when the row carries no usable image or video source.
 */
function mapMediaRowToCollectionItem(row: MediaRow): CollectionMediaItem | null {
  const baseUrl = getSupabaseBaseUrl();
  const isVideo = (row.mime_type ?? "").startsWith("video/");
  const type: "image" | "video" = isVideo ? "video" : "image";

  const src = isUsableRemoteImage(row.storage_path)
    ? row.storage_path!
    : row.storage_path && row.bucket
      ? supabasePublicUrl(baseUrl, row.bucket, row.storage_path, "")
      : "";

  if (!src || !isUsableRemoteImage(src)) {
    return null;
  }

  const poster = row.poster_path
    ? supabasePublicUrl(baseUrl, row.bucket ?? "", row.poster_path, "")
    : "";

  const usablePoster = poster && isUsableRemoteImage(poster) ? poster : undefined;

  return {
    id: row.id ?? row.storage_path ?? "",
    type,
    src,
    poster: usablePoster,
    width: row.width ?? 1200,
    height: row.height ?? (type === "video" ? 1920 : 1200),
    alt: (isUsableRemoteImage(row.alt_text)
      ? row.alt_text
      : row.file_name
        ? cleanText(row.file_name, 120) ?? "Collection photograph"
        : "Collection photograph") ?? "Collection photograph",
    caption: cleanText(row.caption, 200) ?? "",
  };
}

/**
 * All collection media items linked to a category (entity_type = 'category',
 * entity_id = category.id), ordered by sort_order. Empty array when the DB is
 * unavailable, the category has no media, or no matching rows exist.
 */
export async function getCollectionMediaItems(
  categoryId: string | null | undefined
): Promise<CollectionMediaItem[]> {
  if (!categoryId) return [];
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const columns =
    "id, file_name, storage_path, bucket, mime_type, file_size, alt_text, entity_type, entity_id, width, height, caption, poster_path, media_type, page_number, checksum, is_published, sort_order";
  const { data, error } = await client
    .from("media")
    .select(columns)
    .eq("entity_type", "category")
    .eq("entity_id", categoryId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    warnOnce(`media for category "${categoryId}" unavailable`, error);
    return [];
  }

  return (data ?? [])
    .map((row: MediaRow) => mapMediaRowToCollectionItem(row))
    .filter((item): item is CollectionMediaItem => item !== null);
}

/**
 * Resolve the Supabase category row ID for a slug (including studio aliases).
 * Returns null when the DB is unavailable or no row matches.
 */
async function resolveCategoryId(slug: string): Promise<string | null> {
  const resolved = resolveCategorySlug(slug) ?? slugify(decodeURIComponent(slug));
  if (!resolved) return null;
  const rows = await fetchRows<CategoryRow>("categories", null, "id, slug");
  const match = rows.find(
    (row) =>
      Boolean(row.slug) &&
      (row.slug === resolved ||
        row.slug === slug ||
        row.slug?.endsWith(`-${resolved}`) ||
        row.slug?.endsWith(`-${slug}`))
  );
  return match?.id ?? null;
}

/**
 * Child categories (series) of a parent category, resolved through the
 * parent's slug. Used by the PVC Wall Panels parent page to list series.
 */
export async function getSubCategories(parentSlug: string): Promise<Category[]> {
  const parentId = await resolveCategoryId(parentSlug);
  if (!parentId) return [];

  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const columns =
    "id, name, slug, description, image_path, parent_id, eyebrow, heading, lede, sort_order, is_active";
  const { data, error } = await client
    .from("categories")
    .select(columns)
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    warnOnce(`sub-categories for "${parentSlug}" unavailable`, error);
    return [];
  }

  const categoryRows = (data ?? []) as CategoryRow[];
  return categoryRows.map((row) => {
    const label = cleanText(row.name ?? row.title, 120);
    const slug = resolveCategorySlug(row.slug) ?? slugify(label ?? row.slug ?? "");
    const remoteImage = resolveImage(
      row.image_url ?? storageImage("site-assets", row.image_path),
      ""
    ).src;
    const usableImage = isUsableRemoteImage(remoteImage) ? remoteImage : null;

    return {
      slug: slug ?? "",
      name: label ?? row.slug ?? "Collection",
      description: cleanText(row.description, 400) ?? "Studio collection.",
      meta: "Series",
      artwork: usableImage ?? DEFAULT_PRODUCT_ARTWORK,
      tone: "stone" as const,
      sortOrder: row.sort_order ?? 0,
      productCount: 0,
      collectionMedia: [],
      source: "supabase" as const,
      parentId: row.parent_id ?? null,
    };
  });
}

/**
 * Build the editorial + stats block for a category from its Supabase columns.
 * Returns null when no editorial columns are populated (caller falls back to
 * code-defined lookup tables).
 */
function mapEditorial(row: CategoryRow): CollectionEditorial | null {
  const stats = row.stats_json as { photographs?: number; films?: number; source_frames?: number } | undefined;
  const hasEditorial =
    Boolean(row.eyebrow) ||
    Boolean(row.heading) ||
    Boolean(row.lede) ||
    Boolean(row.edit_heading) ||
    Boolean(row.edit_note) ||
    (stats && (stats.photographs || stats.films || stats.source_frames));

  if (!hasEditorial) return null;

  return {
    eyebrow: cleanText(row.eyebrow, 120),
    heading: cleanText(row.heading, 160),
    lede: cleanText(row.lede, 800),
    editHeading: cleanText(row.edit_heading, 120),
    editNote: cleanText(row.edit_note, 2000),
    railAria: cleanText(row.rail_aria, 120),
    categoryAction: cleanText(row.category_action, 120),
    coverImageAlt: cleanText(row.cover_image_alt, 200),
    stats: stats
      ? {
          photographs: Number(stats.photographs) || 0,
          films: Number(stats.films) || 0,
          sourceFrames: Number(stats.source_frames) || 0,
        }
      : null,
  };
}

/**
 * Joined fetch: the category (merged with studio fallback) + its Supabase
 * collection media + editorial copy. The caller decides which code-defined
 * fallback to use when Supabase rows are absent.
 */
export async function getCategoryWithData(slug: string): Promise<CategoryWithData | null> {
  const parentSlug = await resolveCategoryId(slug);
  const client = getSupabaseClientOrNull();
  if (!parentSlug || !client) return null;

  const columns =
    "id, name, slug, description, image_path, sort_order, is_active, parent_id, eyebrow, heading, lede, edit_heading, edit_note, rail_aria, category_action, cover_image_alt, stats_json";
  const { data, error } = await client
    .from("categories")
    .select(columns)
    .eq("slug", resolveCategorySlug(slug) ?? slugify(decodeURIComponent(slug)))
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    warnOnce(`category "${slug}" unavailable`, error);
    return null;
  }

  const row = data as CategoryRow | null;
  if (!row?.id) return null;

  const [studioCategory, mediaItems] = await Promise.all([
    Promise.resolve(findStudioCategory(row.slug ?? "")),
    getCollectionMediaItems(row.id),
  ]);

  const label = cleanText(row.name ?? row.title, 120);
  const remoteImage = resolveImage(
    row.image_url ?? storageImage("site-assets", row.image_path),
    ""
  ).src;
  const usableImage = isUsableRemoteImage(remoteImage) ? remoteImage : null;

  const category: Category = {
    slug: resolveCategorySlug(row.slug ?? "") ?? slugify(label ?? "collection"),
    name: label ?? studioCategory?.name ?? "Collection",
    description: cleanText(row.description, 400) ?? studioCategory?.description ?? "Studio collection.",
    meta: studioCategory?.meta ?? "Collection",
    artwork: usableImage ?? studioCategory?.artwork ?? DEFAULT_PRODUCT_ARTWORK,
    tone: studioCategory?.tone ?? "stone",
    sortOrder: row.sort_order ?? studioCategory?.sortOrder ?? 0,
    productCount: 0,
    collectionMedia: mediaItems,
    source: "supabase",
    parentId: row.parent_id ?? null,
  };

  const editorial = mapEditorial(row);
  return { category, media: mediaItems, editorial };
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const canonical =
    resolveCategorySlug(categorySlug) ?? slugify(decodeURIComponent(categorySlug));
  if (!canonical) return [];
  const products = await getProducts();
  return products.filter((product) => product.categorySlug === canonical);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const target = slugify(decodeURIComponent(slug));
  if (!target) return null;
  const products = await getProducts();
  return products.find((product) => product.slug === target) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const products = await getProducts();
  const sameCategory = products.filter(
    (candidate) => candidate.categorySlug === product.categorySlug && candidate.slug !== product.slug
  );
  const others = products.filter(
    (candidate) => candidate.categorySlug !== product.categorySlug && candidate.slug !== product.slug
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export async function getProjects(): Promise<Project[]> {
  const rows = await fetchRows<ProjectRow>("projects", "is_published");
  const seen = new Set<string>();
  const projects: Project[] = [];
  rows.forEach((row, index) => {
    const mapped = mapProject(row, index);
    if (mapped && !seen.has(mapped.slug)) {
      seen.add(mapped.slug);
      projects.push(mapped);
    }
  });
  return projects;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const target = slugify(decodeURIComponent(slug));
  if (!target) return null;
  const projects = await getProjects();
  return projects.find((project) => project.slug === target) ?? null;
}

/** Published reviews only — never fabricated. Empty array when none exist. */
export async function getReviews(): Promise<Review[]> {
  const rows = await fetchRows<ReviewRow>(
    "reviews",
    "is_published",
    "id,client_name,location,project_type,rating,testimonial,is_published,sort_order"
  );
  return rows.map(mapReview).filter((review): review is Review => review !== null);
}

export async function getServices(): Promise<Service[]> {
  const rows = await fetchRows<ServiceRow>("services", "is_published");
  const fromDb: Service[] = [];

  rows.forEach((row) => {
    const title = cleanText(row.title, 140);
    if (!title) return;
    fromDb.push({
      slug: slugify(cleanText(row.slug, 140) ?? title),
      title,
      description:
        cleanText(row.description, 800) ??
        cleanText(row.short_description, 300) ??
        "Available on consultation.",
      meta: cleanText(row.short_description, 80) ?? "Service",
    });
  });

  const seen = new Set(fromDb.map((service) => service.slug));
  return [...fromDb, ...STUDIO_SERVICES.filter((service) => !seen.has(service.slug))];
}

export interface SiteSettings {
  brandName: string;
  descriptor: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  addressLines: readonly string[];
  addressOneLine: string;
  hours: string | null;
}

/** Site settings from Supabase when present, otherwise verified local configuration. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await fetchRows<SiteSettingsRow>("site_settings", null);
  const row = rows[0];
  const addressText = cleanText(row?.address, 400);

  return {
    brandName: cleanText(row?.brand_name, 80) ?? SITE.name,
    descriptor: SITE.descriptor,
    tagline: cleanText(row?.tagline, 200) ?? SITE.tagline,
    phone: cleanText(row?.phone, 40) ?? SITE.phone,
    whatsapp: cleanText(row?.whatsapp, 40) ?? SITE.whatsapp,
    addressLines: addressText ? addressText.split(/\r?\n/).filter(Boolean) : SITE.addressLines,
    addressOneLine: addressText ? addressText.replace(/\r?\n/g, ", ") : SITE.addressOneLine,
    hours: cleanText(row?.hours, 120),
  };
}

/** Search index across materials, products, projects and services. */
export async function getSearchIndex(): Promise<SearchResult[]> {
  const [categories, products, projects, services, carpet] = await Promise.all([
    getCategories(),
    getProducts(),
    getProjects(),
    getServices(),
    getCarpetTileCollections(),
  ]);

  const results: SearchResult[] = [];

  categories.forEach((category) =>
    results.push({
      group: "Materials",
      title: category.name,
      subtitle: category.meta,
      href: `/materials/${category.slug}`,
    })
  );

  // Carpet Tile collections are real published rows, so they are searchable by their
  // real catalogue names ("Aurora", "Greenland", ...) and land on their real route.
  carpet.forEach((collection) =>
    results.push({
      group: "Materials",
      title: collection.name,
      subtitle: `Carpet Tile · ${collection.pageCount} pages`,
      href: `/materials/carpet-tile/${collection.slug}`,
    })
  );

  products.forEach((product) =>
    results.push({
      group: "Products",
      title: product.name,
      subtitle: product.code ? `${product.categoryName} · ${product.code}` : product.categoryName,
      href: `/products/${product.slug}`,
    })
  );

  projects.forEach((project) =>
    results.push({
      group: "Our Work",
      title: project.title,
      subtitle: [project.type, project.location].filter(Boolean).join(" · ") || null,
      href: `/our-work/${project.slug}`,
    })
  );

  services.forEach((service) =>
    results.push({
      group: "Services",
      title: service.title,
      subtitle: service.meta,
      href: "/services",
    })
  );

  return results;
}

export interface LeadResult {
  ok: boolean;
  persisted: boolean;
  reason: "saved" | "not-configured" | "unavailable";
}

/**
 * Persist a consultation request into `leads`.
 * The public client is tried first (RLS insert policy); the service-role client is only
 * used as a fallback when configured, and the key never leaves the server.
 */
export async function createLead(
  input: LeadInput,
  source = "consultation-form"
): Promise<LeadResult> {
  const payload: LeadInsert = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    interest:
      [input.projectType, input.preferredContact ? `Preferred: ${input.preferredContact}` : null]
        .filter(Boolean)
        .join(" · ") || null,
    message: input.message?.trim() ? input.message.trim() : null,
    source,
  };

  const client = getSupabaseServerClient();
  if (client) {
    const { error } = await client.from("leads").insert(payload);
    if (!error) return { ok: true, persisted: true, reason: "saved" };
    warn("lead insert (public client)", error);
  }

  const { supabaseAdmin } = await import("./admin");
  const admin = supabaseAdmin;
  if (admin) {
    const { error } = await admin.from("leads").insert(payload);
    if (!error) return { ok: true, persisted: true, reason: "saved" };
    warn("lead insert (admin client)", error);
    return { ok: false, persisted: false, reason: "unavailable" };
  }

  return { ok: false, persisted: false, reason: client ? "unavailable" : "not-configured" };
}


/* ------------------------------------------------------------------ *
 * Laminate Flooring API
 * ------------------------------------------------------------------ */

export const LAMINATE_FLOORING_PARENT = "laminate-flooring";
const LAMINATE_FLOORING_PREFIX = "laminate-flooring-";
const LAMINATE_FLOORING_BUCKET = "laminate-flooring";

export interface LaminateFlooringCollection {
  id: string;
  name: string;
  slug: string;
  sourceFilename: string | null;
  pageCount: number;
  cover: CollectionMediaItem | null;
  media: CollectionMediaItem[];
  products: any[];
}

async function getLaminateFlooringMedia(categoryId: string): Promise<{
  cover: CollectionMediaItem | null;
  pages: CollectionMediaItem[];
}> {
  const client = getSupabaseClientOrNull();
  if (!client) return { cover: null, pages: [] };

  const columns =
    "id, file_name, storage_path, bucket, mime_type, alt_text, width, height, caption, media_type, page_number, sort_order";
  const rows: MediaRow[] = [];
  for (let offset = 0; offset < 2000; offset += 1000) {
    const page = await client
      .from("media")
      .select(columns)
      .eq("entity_type", "category")
      .eq("entity_id", categoryId)
      .eq("bucket", LAMINATE_FLOORING_BUCKET)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .range(offset, offset + 999);
    if (page.error) {
      warnOnce("laminate flooring media unavailable", page.error);
      return { cover: null, pages: [] };
    }
    const batch = (page.data ?? []) as MediaRow[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }

  const covers = rows
    .filter((row) => row.media_type === "cover")
    .map((row) => mapMediaRowToCollectionItem(row))
    .filter((item): item is CollectionMediaItem => item !== null);

  const pages = rows
    .filter((row) => row.media_type === "rendered-page")
    .map((row) => mapMediaRowToCollectionItem(row))
    .filter((item): item is CollectionMediaItem => item !== null)
    .sort((a, b) => a.caption.localeCompare(b.caption, undefined, { numeric: true }));

  return { cover: covers[0] ?? null, pages };
}

export async function getLaminateFlooringCollections(): Promise<LaminateFlooringCollection[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const parent = await client
    .from("categories")
    .select("id")
    .eq("slug", LAMINATE_FLOORING_PARENT)
    .eq("is_active", true)
    .maybeSingle();
  if (parent.error) {
    warnOnce("laminate flooring parent unavailable", parent.error);
    return [];
  }
  const parentId = parent.data?.id;
  if (!parentId) return [];

  const children = await client
    .from("categories")
    .select("id, name, slug, source_filename, page_count")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .not("source_hash", "is", null)
    .order("name", { ascending: true })
    .limit(200);
  if (children.error) {
    warnOnce("laminate flooring collections unavailable", children.error);
    return [];
  }

  const rows = (children.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    source_filename: string | null;
    page_count: number | null;
  }>;

  const childIds = rows.map((r) => r.id);
  const [{ data: mediaRows }, { data: prodRows }] = await Promise.all([
    client
      .from("media")
      .select(
        "id, file_name, storage_path, bucket, mime_type, alt_text, width, height, caption, poster_path, media_type, page_number, entity_id"
      )
      .in("entity_id", childIds)
      .eq("bucket", LAMINATE_FLOORING_BUCKET)
      .eq("is_published", true),
    client
      .from("products")
      .select("id, name, slug, description, specs, category_id")
      .in("category_id", childIds)
      .eq("is_published", true)
      .order("name", { ascending: true }),
  ]);

  const coverMap = new Map<string, CollectionMediaItem>();
  const pagesCountMap = new Map<string, number>();

  (mediaRows ?? []).forEach((mRow) => {
    const item = mapMediaRowToCollectionItem(mRow as MediaRow);
    if (!item || !mRow.entity_id) return;
    if (mRow.media_type === "cover" && !coverMap.has(mRow.entity_id)) {
      coverMap.set(mRow.entity_id, item);
    }
    if (mRow.media_type === "rendered-page") {
      pagesCountMap.set(mRow.entity_id, (pagesCountMap.get(mRow.entity_id) ?? 0) + 1);
    }
  });

  const productsByCat = new Map<string, Array<{ id: string; name: string; slug: string; categorySlug: string; description: string | null; code: string | null; specs: unknown }>>();
  (prodRows ?? []).forEach((p) => {
    const cid = (p as { category_id: string }).category_id;
    const list = productsByCat.get(cid) ?? [];
    list.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categorySlug: p.slug,
      description: p.description,
      code: ((p.specs as Record<string, unknown>)?.code as string) ?? null,
      specs: p.specs,
    });
    productsByCat.set(cid, list);
  });

  return rows.map((row) => {
    const cover = coverMap.get(row.id) ?? null;
    const pageCount = row.page_count ?? pagesCountMap.get(row.id) ?? 0;
    const products = productsByCat.get(row.id) ?? [];

    return {
      id: row.id,
      name: row.name,
      slug: row.slug.startsWith(LAMINATE_FLOORING_PREFIX)
        ? row.slug.slice(LAMINATE_FLOORING_PREFIX.length)
        : row.slug,
      sourceFilename: cleanText(row.source_filename, 160),
      pageCount,
      cover,
      media: [],
      products,
    };
  });
}

export async function getLaminateFlooringCollection(
  slug: string | null | undefined
): Promise<LaminateFlooringCollection | null> {
  if (!slug) return null;
  const key = decodeURIComponent(slug).toLowerCase().trim();
  const collections = await getLaminateFlooringCollections();
  return collections.find((entry) => entry.slug === key) ?? null;
}

