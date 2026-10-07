import { ProductForm } from "@/components/admin/ProductForm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCategories() {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, parent_id")
    .order("sort_order", { ascending: true });
  
  if (error) throw error;
  return data || [];
}

async function getProduct(id: string) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    getCategories(),
    getProduct(id),
  ]);

  if (!product) {
    notFound();
  }

  const rawSpecs = (product.specs && typeof product.specs === "object" ? product.specs : {}) as Record<string, unknown>;

  /** Canonical row -> the friendly field names ProductForm expects. */
  const initialData = {
    name: product.name ?? product.title ?? "",
    slug: product.slug ?? "",
    code: product.code ?? rawSpecs.code ?? "",
    description: product.description ?? "",
    category_id: product.category_id ?? "",
    price: product.price === null || product.price === undefined ? "" : String(product.price),
    original_price: product.original_price === null || product.original_price === undefined ? "" : String(product.original_price),
    currency: product.currency ?? "PKR",
    unit: product.unit ?? "",
    price_label: product.price_label ?? "",
    specifications: rawSpecs,
    dimensions: (rawSpecs.dimensions as Record<string, string>) ?? { length: "", width: "", height: "", depth: "", unit: "mm" },
    stock_status: (typeof rawSpecs.stock_status === "string" ? rawSpecs.stock_status : typeof rawSpecs.availability === "string" ? rawSpecs.availability : "in_stock"),
    tags: Array.isArray(rawSpecs.tags) ? rawSpecs.tags : [],
    video_url: rawSpecs.video_url ?? "",
    video_poster: rawSpecs.video_poster ?? "",
    images: Array.isArray(product.gallery_paths) && product.gallery_paths.length > 0
      ? (product.gallery_paths as string[])
      : product.image_url
      ? [product.image_url]
      : product.image_path
      ? [product.image_path]
      : [],
    published: product.is_published === true,
    sort_order: product.sort_order ?? 0,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Edit Product</h1>
          <p className="mt-2 text-muted">Update product details, pricing and visibility.</p>
        </div>
      </div>

      <ProductForm initialData={initialData} categories={categories} isEditing />
    </div>
  );
}