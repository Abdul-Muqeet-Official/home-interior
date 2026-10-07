import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductDiscovery from "@/components/ui/ProductDiscovery";
import { getCategories, getProducts } from "@/lib/supabase/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse the complete HOME INTERIOR product catalogue.",
  alternates: { canonical: "/products" },
};

async function ProductDiscoveryStream() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return <ProductDiscovery categories={categories} products={products} />;
}

export default function ProductsPage() {
  return (
    <main id="main">
      <div className="container-wide pt-10 pb-4 mt-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All Products" }]} />
      </div>
      <section className="container-wide pb-20">
        <h1 className="display-3 text-charcoal mb-10">All Products</h1>
        <Suspense
          fallback={
            <div className="space-y-8 animate-pulse">
              <div className="h-12 w-full max-w-md bg-stone/10 rounded-editorial" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-80 bg-stone/5 rounded-editorial" />
                ))}
              </div>
            </div>
          }
        >
          <ProductDiscoveryStream />
        </Suspense>
      </section>
    </main>
  );
}
