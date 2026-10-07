import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">New Category</h1>
          <p className="mt-2 text-muted">Create a new studio collection.</p>
        </div>
      </div>

      <CategoryForm />
    </div>
  );
}