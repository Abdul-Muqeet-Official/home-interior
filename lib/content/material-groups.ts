/**
 * lib/content/material-groups.ts
 *
 * Canonical materials taxonomy and category resolution.
 * Maps real database categories and collections to the 11 primary studio categories
 * with zero data leakage and strict hierarchical isolation.
 */

import type { Category } from "./types";

export interface MaterialGroup {
  /** Stable canonical key used in URL and filtering (?group=wallpaper). */
  key: string;
  /** Quiet-luxury editorial label shown on category pill. */
  label: string;
}

export interface CategoryClassification {
  groupKey: string;
  groupLabel: string;
  tags: string[];
}

export const PRIMARY_CATEGORIES: ReadonlyArray<{ key: string; label: string }> = [
  { key: "laminate-flooring", label: "Laminate Flooring" },
  { key: "spc-flooring", label: "SPC Flooring" },
  { key: "vinyl-flooring", label: "Vinyl Flooring" },
  { key: "pvc-wall-panels", label: "PVC Wall Panels" },
  { key: "wallpaper", label: "Wallpaper" },
  { key: "folding-doors", label: "Folding Doors" },
  { key: "false-ceiling", label: "False Ceiling" },
  { key: "window-blinds", label: "Window Blinds" },
  { key: "3d-wall-picture", label: "3D Wall Picture" },
  { key: "carpet-tile", label: "Carpet Tile" },
  { key: "artificial-grass", label: "Artificial Grass" },
] as const;

/** Canonical slugs set for fast O(1) checks */
export const PRIMARY_CATEGORY_KEYS = new Set<string>(
  PRIMARY_CATEGORIES.map((p) => p.key)
);

/** Split "Flooring · Plank" into its segments */
export function parseMeta(meta: string | null | undefined): { group: string; tags: string[] } {
  if (!meta) return { group: "", tags: [] };
  const segments = meta
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

  const [group = "", ...rest] = segments;
  return { group, tags: rest };
}

/**
 * Classify a category or collection row into its canonical primary group.
 * Matches by exact canonical key first, then normalized slug prefix.
 */
export function classifyCategory(
  category: { slug: string; name?: string; meta?: string | null }
): CategoryClassification {
  const { tags } = parseMeta(category.meta);
  const normalizedSlug = category.slug.toLowerCase().trim();

  // 1. Direct key match
  const directMatch = PRIMARY_CATEGORIES.find((p) => p.key === normalizedSlug);
  if (directMatch) {
    return {
      groupKey: directMatch.key,
      groupLabel: directMatch.label,
      tags,
    };
  }

  // 2. Prefix match (e.g. laminate-flooring-3-strip... -> laminate-flooring)
  // Sort longest key first to prevent prefix shadowing
  const prefixMatch = [...PRIMARY_CATEGORIES]
    .sort((a, b) => b.key.length - a.key.length)
    .find((p) => normalizedSlug.startsWith(p.key));

  if (prefixMatch) {
    return {
      groupKey: prefixMatch.key,
      groupLabel: prefixMatch.label,
      tags,
    };
  }

  // 3. Fallback to slug itself (never arbitrary categories[0])
  return {
    groupKey: normalizedSlug,
    groupLabel: category.name || normalizedSlug,
    tags,
  };
}

/**
 * Build the primary groups array in canonical studio order.
 */
export function buildGroups(categories?: Category[]): MaterialGroup[] {
  const groups: MaterialGroup[] = PRIMARY_CATEGORIES.map(({ key, label }) => ({
    key,
    label,
  }));

  if (categories) {
    const knownKeys = new Set(groups.map((g) => g.key));
    for (const cat of categories) {
      if (!cat.parentId && !knownKeys.has(cat.slug)) {
        groups.push({ key: cat.slug, label: cat.name });
        knownKeys.add(cat.slug);
      }
    }
  }

  return groups;
}

/**
 * Build tag list scoped by category, avoiding cross-category contamination.
 */
export function buildTags(categories: Category[]): string[] {
  const counts = new Map<string, number>();
  for (const category of categories) {
    for (const tag of classifyCategory(category).tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map((entry) => entry[0]);
}