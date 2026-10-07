/**
 * components/ui/ProductCard.tsx
 * Catalogue product card: image, name, code, descriptor, price label and link.
 * Only database-backed fields are rendered — nothing is invented.
 */

import Link from "next/link";
import MediaFrame from "./MediaFrame";
import StockBadge from "./StockBadge";
import { ProductDimensionsInline } from "./ProductDimensions";
import type { Product } from "@/lib/content/types";
import { EMPTY_STATES } from "@/lib/content/editorial";
import { truncate } from "@/lib/utils";

function descriptor(product: Product): string | null {
  if (product.description) return truncate(product.description, 124);
  const spec = product.specs[0];
  if (spec) return `${spec.label}: ${spec.value}`;
  return null;
}

export default function ProductCard({ product }: { product: Product }) {
  const descriptorText = descriptor(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex min-w-0 h-full flex-col focus-visible:outline-none"
      aria-label={`${product.name} — view product`}
    >
      <div className="relative">
        <MediaFrame
          src={product.image}
          alt={`${product.name}${product.code ? ` (${product.code})` : ""}`}
          ratio="4 / 3"
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 44vw, 340px"
          className="rounded-card border border-line"
          imageClassName="transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.05]"
          fallbackSrc="/media/texture-plaster.svg"
          note={product.usingStudioArtwork ? "Studio material study" : null}
        />
        <StockBadge
          status={product.stockStatus}
          className="absolute right-4 top-4 backdrop-blur-sm"
        />
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow">
          {product.categoryName}
          {product.code ? <span className="text-champagne"> · {product.code}</span> : null}
        </p>
        <h3 className="mt-2 text-xl leading-snug text-charcoal">{product.name}</h3>

        {descriptorText && <p className="mt-2 line-clamp-1 text-xs leading-relaxed text-muted">{descriptorText}</p>}

        <div className="mt-3">
          <ProductDimensionsInline dimensions={product.dimensions} />
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          {product.priceLabel ? (
            <>
              <span className="text-sm font-medium text-charcoal">{product.priceLabel}</span>
              {product.originalPriceLabel && (
                <span className="text-xs text-muted line-through">
                  {product.originalPriceLabel}
                </span>
              )}
              {product.badge && (
                <span className="rounded-full border border-champagne px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-deep">
                  {product.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs uppercase tracking-[0.14em] text-muted">
              {EMPTY_STATES.pricing.priceOnConsultation}
            </span>
          )}
        </div>

        <span className="link-editorial mt-auto pt-5">
          View product
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
