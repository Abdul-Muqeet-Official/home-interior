import { CategoryForm } from "@/components/admin/CategoryForm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CategoryRow } from "@/lib/supabase/types";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCategory(id: string): Promise<CategoryRow | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, description, image_path, sort_order, is_active, parent_id, eyebrow, heading, lede, edit_heading, edit_note, rail_aria, category_action, cover_image_alt, stats_json, source_filename, source_hash, page_count, country")
    .eq("id", id)
    .single();

  if (error) throw error;
  return (data ?? null) as CategoryRow | null;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  const statsJson = category.stats_json as
    | { photographs?: number; films?: number; source_frames?: number }
    | null
    | undefined;

  const initialData = {
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description ?? "",
    cover_image: category.image_path ?? "",
    cover_image_alt: category.cover_image_alt ?? "",
    sort_order: String(category.sort_order ?? 0),
    published: category.is_active === true,
    parent_id: category.parent_id ?? null,
    eyebrow: category.eyebrow ?? "",
    heading: category.heading ?? "",
    lede: category.lede ?? "",
    edit_heading: category.edit_heading ?? "",
    edit_note: category.edit_note ?? "",
    rail_aria: category.rail_aria ?? "",
    category_action: category.category_action ?? "",
    photographs: (statsJson?.photographs ?? 0).toString(),
    films: (statsJson?.films ?? 0).toString(),
    source_frames: (statsJson?.source_frames ?? 0).toString(),
  };

  // Provenance for an ingested catalogue collection (e.g. Carpet Tile, Wallpaper).
  // These are derived from the source library and are shown read-only.
  const hasSource = Boolean(category.source_filename || category.source_hash);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Edit Category</h1>
          <p className="mt-2 text-muted">Update collection details.</p>
        </div>
      </div>

      {hasSource && (
        <section
          aria-label="Source catalogue provenance"
          className="border border-line bg-surface/50 p-5"
        >
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted">
            Source catalogue
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-wrap gap-x-3">
              <dt className="min-w-32 text-muted">Source file</dt>
              <dd className="min-w-0 break-all font-medium text-charcoal">
                {category.source_filename ?? "—"}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="min-w-32 text-muted">Page count</dt>
              <dd className="text-charcoal">{category.page_count ?? "—"}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="min-w-32 text-muted">Group</dt>
              <dd className="text-charcoal">{category.country ?? "—"}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="min-w-32 text-muted">SHA-256</dt>
              <dd className="min-w-0 break-all font-mono text-xs text-charcoal">
                {category.source_hash ?? "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Identity, page count and storage paths are derived from the source file and
            are not editable by hand.
          </p>
        </section>
      )}

      <CategoryForm initialData={initialData} isEditing />
    </div>
  );
}
