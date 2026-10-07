/**
 * components/ui/StockBadge.tsx
 * Availability badge for products and collections.
 *
 * Renders nothing when the record states no status, so an unstated value is never
 * displayed as "Available". Colour is never the only signal: the label itself
 * says "Available" or "Out of Stock".
 */

import { stockBadge } from "@/lib/content/product-presentation";
import type { ProductStockStatus } from "@/lib/content/types";
import { cx } from "@/lib/utils";

export default function StockBadge({
  status,
  className,
}: {
  status: ProductStockStatus | null;
  className?: string;
}) {
  const badge = stockBadge(status);
  if (!badge) return null;

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]",
        badge.className,
        className
      )}
    >
      {badge.label}
    </span>
  );
}