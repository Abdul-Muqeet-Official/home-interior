/**
 * components/ui/ProductGrid.tsx
 * Responsive catalogue grid. Renders an elegant empty state when a collection has
 * no published products yet — never a blank area and never placeholder text.
 */

import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";
import type { Product } from "@/lib/content/types";
import { cx } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  columns?: 3 | 4;
  emptyTitle?: string;
  emptyBody?: string;
  className?: string;
}

export default function ProductGrid({
  products,
  columns = 4,
  emptyTitle,
  emptyBody,
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        eyebrow="Collection"
        title={emptyTitle ?? "Collection in preparation"}
        body={
          emptyBody ??
          "This collection is being catalogued. Contact the studio for the current range of samples, technical data and availability."
        }
        actions={[
          { label: "Request consultation", href: "/consultation" },
          { label: "Browse materials", href: "/materials", variant: "outline" },
        ]}
        className={className}
      />
    );
  }

  return (
    <div
      className={cx(
        "grid gap-x-6 gap-y-12 sm:grid-cols-2",
        columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
