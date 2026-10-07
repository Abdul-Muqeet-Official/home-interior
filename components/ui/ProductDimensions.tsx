/**
 * components/ui/ProductDimensions.tsx
 * Physical dimensions of a product, rendered only when the record states them.
 * Renders nothing for null, so no product ever shows an empty or invented size.
 */

import { dimensionLines } from "@/lib/content/product-presentation";
import type { ProductDimensions as Dimensions } from "@/lib/content/types";

/** Definition-list block used on the product detail page. */
export function ProductDimensionsTable({ dimensions }: { dimensions: Dimensions | null }) {
  const lines = dimensionLines(dimensions);
  if (lines.length === 0) return null;

  return (
    <dl className="border-t border-line">
      {lines.map((line) => (
        <div key={line.label} className="grid grid-cols-1 gap-2 border-b border-line py-4 sm:grid-cols-3">
          <dt className="text-[11px] uppercase tracking-[0.22em] text-muted">{line.label}</dt>
          <dd className="text-sm text-charcoal sm:col-span-2">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Compact one-line form used on catalogue cards. */
export function ProductDimensionsInline({ dimensions }: { dimensions: Dimensions | null }) {
  const lines = dimensionLines(dimensions);
  if (lines.length === 0) return null;

  return (
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
      {lines.map((line) => `${line.label} ${line.value}`).join(" · ")}
    </p>
  );
}