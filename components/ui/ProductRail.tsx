import ProductCard from "./ProductCard";
import Rail from "./Rail";
import type { Product } from "@/lib/content/types";

export default function ProductRail({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="border-y border-line py-8">
        <p className="eyebrow">Featured Products</p>
        <p className="mt-3 text-sm text-muted">Published product imagery will appear here as the catalogue is released.</p>
      </div>
    );
  }

  return (
    <Rail
      ariaLabel="Featured products"
      itemClassName="product-showroom-item"
      autoplayMs={3500}
    >
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </Rail>
  );
}

