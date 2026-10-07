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

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  return (
    <main id="main">
      <div className="container-wide pt-10 pb-4 mt-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All Products" }]} />
      </div>
      <section className="container-wide pb-20">
        <h1 className="display-3 text-charcoal mb-10">All Products</h1>
        <ProductDiscovery categories={categories} products={products} />
      </section>
    </main>
  );
}
