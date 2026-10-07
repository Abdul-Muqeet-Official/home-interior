import { ProductForm } from "@/components/admin/ProductForm";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getCategories() {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, parent_id")
    .order("sort_order", { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">New Product</h1>
          <p className="mt-2 text-muted">Add a new product to your catalogue.</p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}