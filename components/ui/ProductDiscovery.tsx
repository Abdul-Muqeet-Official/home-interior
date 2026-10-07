"use client";

import { useState, useMemo } from "react";
import ProductGrid from "@/components/ui/ProductGrid";
import type { Product, Category } from "@/lib/content/types";
import { cx } from "@/lib/utils";

export default function ProductDiscovery({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) {
      result = result.filter((p) => p.categorySlug === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q))
      );
    }
    return result;
  }, [products, activeCategory, search]);

  const activeCategories = categories.filter((c) =>
    products.some((p) => p.categorySlug === c.slug)
  );

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:sticky lg:top-32 lg:w-64 lg:pr-8">
        <div className="flex flex-col gap-8">
          <div>
            <label htmlFor="search-products" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                id="search-products"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalogue..."
                className="w-full rounded-none border border-line bg-white py-3.5 pl-11 pr-4 text-sm text-charcoal outline-none transition-colors placeholder:text-muted focus:border-champagne focus:ring-1 focus:ring-champagne"
              />
            </div>
          </div>

          {activeCategories.length > 0 && (
            <div>
              <h3 className="eyebrow mb-4">Categories</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cx(
                      "text-left text-sm transition-colors",
                      activeCategory === null
                        ? "font-medium text-charcoal"
                        : "text-muted hover:text-charcoal"
                    )}
                  >
                    All Collections
                  </button>
                </li>
                {activeCategories.map((c) => (
                  <li key={c.slug}>
                    <button
                      onClick={() => setActiveCategory(c.slug)}
                      className={cx(
                        "text-left text-sm transition-colors",
                        activeCategory === c.slug
                          ? "font-medium text-charcoal"
                          : "text-muted hover:text-charcoal"
                      )}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory(null);
              }}
              className="btn btn-text mt-4"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <ProductGrid products={filtered} columns={3} />
        )}
      </div>
    </div>
  );
}
