/**
 * lib/content/product-presentation.ts
 *
 * Presentation helpers for product dimensions and availability.
 *
 * Centralised so the card, the detail page and the gallery can never disagree
 * about how a measurement or a stock state is worded. Every function is total:
 * it accepts the nullable view-model fields and returns render-ready text, so no
 * component has to guard with `?.` or `|| "Available"`.
 *
 * The governing rule throughout: a value the catalogue never stated is NOT
 * invented. Absent data returns null and the caller keeps its existing wording.
 */

import type { ProductDimensions, ProductStockStatus } from "./types";

/** One resolved dimension line, e.g. { label: "Width", value: "1200 mm" }. */
export interface DimensionLine {
  label: "Height" | "Width" | "Depth" | "Thickness";
  value: string;
}

/**
 * Suffix a bare measurement with its unit, e.g. "1200" + "mm" -> "1200 mm".
 * A value that already carries the unit is left alone.
 */
function withUnit(value: string, unit: string | null): string {
  if (!unit) return value;
  return `${value} ${unit}`;
}

/**
 * Build the dimension lines a record actually states.
 *
 * Order is fixed so the layout is stable between records. Returns an empty array
 * when nothing is stated — the caller then omits the dimensions block entirely.
 */
export function dimensionLines(dimensions: ProductDimensions | null): DimensionLine[] {
  if (!dimensions) return [];
  const lines: DimensionLine[] = [];

  // A finished panel or blind quotes its third measure as thickness.
  const thirdLabel: DimensionLine["label"] = "Depth";

  if (dimensions.height) {
    lines.push({ label: "Height", value: withUnit(dimensions.height, dimensions.unit) });
  }
  if (dimensions.width) {
    lines.push({ label: "Width", value: withUnit(dimensions.width, dimensions.unit) });
  }
  if (dimensions.depth) {
    lines.push({ label: thirdLabel, value: withUnit(dimensions.depth, dimensions.unit) });
  }
  return lines;
}

/**
 * Compact one-line summary for a product card, e.g. "H 2400 x W 1200 mm".
 * Returns null when no dimension is stated, so the card simply omits it.
 */
export function dimensionSummary(dimensions: ProductDimensions | null): string | null {
  const lines = dimensionLines(dimensions);
  if (lines.length === 0) return null;
  return lines.map((line) => `${line.label.charAt(0)} ${line.value}`).join(" x ");
}

/** Copy and styling for a stock badge, or null when the record states no status. */
export interface StockBadge {
  label: "Available" | "Out of Stock";
  /** Green when available, muted graphite when out of stock. */
  className: string;
  /** Distinguishes the states for assistive tech, not by colour alone. */
  srSuffix: string;
}

const IN_STOCK: StockBadge = {
  label: "Available",
  className: "border-emerald/40 bg-emerald/10 text-emerald",
  srSuffix: " — in stock",
};

const OUT_OF_STOCK: StockBadge = {
  label: "Out of Stock",
  className: "border-line-strong bg-canvas text-muted",
  srSuffix: " — out of stock",
};

/**
 * Badge data for a product's availability.
 *
 * Returns null for a null status so the UI falls back to the studio's existing
 * "confirmed at consultation" line. It deliberately does NOT default to
 * "Available": an unstated status must never render as a positive claim.
 */
export function stockBadge(status: ProductStockStatus | null): StockBadge | null {
  if (status === "in_stock") return IN_STOCK;
  if (status === "out_of_stock") return OUT_OF_STOCK;
  return null;
}