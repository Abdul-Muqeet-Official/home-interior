"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { SITE } from "@/lib/site.config";
import type { Product } from "@/lib/content/types";

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stockStatus === "out_of_stock";

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const dimensionsStr = product.dimensions
      ? `${product.dimensions.length || ""}x${product.dimensions.width || ""} ${product.dimensions.unit || ""}`.trim()
      : null;

    addItem(
      {
        productId: product.id || product.slug,
        slug: product.slug,
        name: product.name,
        category: product.categoryName,
        image: product.image,
        price: product.price ?? null,
        originalPrice: product.originalPrice ?? null,
        priceLabel: product.priceLabel,
        stockStatus: product.stockStatus,
        dimensions: dimensionsStr,
      },
      quantity
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappHref = SITE.whatsappUrlWithText(
    `Hello ${SITE.name}, I would like to enquire about ${product.name}${
      product.code ? ` (${product.code})` : ""
    }.`
  );

  return (
    <div className="mt-8 space-y-4">
      {!isOutOfStock ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between border border-line rounded-lg px-3 py-2 bg-surface min-w-[130px]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="text-muted hover:text-charcoal px-2 py-1 text-sm font-semibold disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              &minus;
            </button>
            <span className="text-sm font-medium text-charcoal">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="text-muted hover:text-charcoal px-2 py-1 text-sm font-semibold"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="btn btn-solid flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-[0.22em]"
          >
            {added ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>ADDED TO CART</span>
              </>
            ) : (
              <span>ADD TO CART</span>
            )}
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-red-700">
            Out of Stock
          </p>
          <p className="mt-1 text-xs text-red-600/80">
            This item is currently out of stock. You may still enquire via WhatsApp for incoming shipments.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 btn w-full bg-line text-muted cursor-not-allowed py-3 text-xs uppercase tracking-[0.2em]"
          >
            ADD TO CART DISABLED
          </button>
        </div>
      )}

      {/* Secondary CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline flex-1 text-center py-3 text-xs uppercase tracking-[0.2em]"
        >
          ENQUIRE VIA WHATSAPP
        </a>

        <a
          href="/consultation"
          className="btn btn-outline flex-1 text-center py-3 text-xs uppercase tracking-[0.2em]"
        >
          BOOK CONSULTATION
        </a>
      </div>
    </div>
  );
}
