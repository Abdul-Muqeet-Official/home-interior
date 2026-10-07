"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Switch } from "@/components/admin/ui/Switch";
import { Thumb } from "@/components/admin/ui/Thumb";
import { cx } from "@/lib/utils";

interface ParentOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  cover_image_alt: string;
  sort_order: string;
  published: boolean;
  parent_id: string | null;
  eyebrow: string;
  heading: string;
  lede: string;
  edit_heading: string;
  edit_note: string;
  rail_aria: string;
  category_action: string;
  photographs: string;
  films: string;
  source_frames: string;
}

export function CategoryForm({ initialData }: { initialData?: Partial<CategoryFormData>; isEditing?: boolean }) {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.cover_image || null);
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    cover_image: initialData?.cover_image || "",
    cover_image_alt: initialData?.cover_image_alt || "",
    sort_order: initialData?.sort_order?.toString() || "0",
    published: initialData?.published || false,
    parent_id: initialData?.parent_id || null,
    eyebrow: initialData?.eyebrow || "",
    heading: initialData?.heading || "",
    lede: initialData?.lede || "",
    edit_heading: initialData?.edit_heading || "",
    edit_note: initialData?.edit_note || "",
    rail_aria: initialData?.rail_aria || "",
    category_action: initialData?.category_action || "",
    photographs: initialData?.photographs?.toString() || "0",
    films: initialData?.films?.toString() || "0",
    source_frames: initialData?.source_frames?.toString() || "0",
  });

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (data.categories) {
          setParentOptions(
            data.categories
              .filter((c: { parent_id: string | null; id: string }) => !c.parent_id && c.id !== params.id)
              .map((c: { id: string; name: string; slug: string }) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
              }))
          );
        }
      } catch {
        // Non-blocking — parent dropdown stays empty
      }
    };
    fetchParents();
  }, [params.id]);

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("bucket", "site-assets");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadForm,
      });
      const data = await res.json();
      if (data.media?.url) {
        const url = data.media.url;
        setFormData(prev => ({ ...prev, cover_image: url }));
        setPreviewImage(url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, cover_image: "" }));
    setPreviewImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        sort_order: parseInt(formData.sort_order) || 0,
        parent_id: formData.parent_id || null,
        photographs: parseInt(formData.photographs) || 0,
        films: parseInt(formData.films) || 0,
        source_frames: parseInt(formData.source_frames) || 0,
      };

      const url = isEditing ? `/api/admin/categories/${params.id}` : "/api/admin/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save category");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="rounded-card border border-red/20 bg-red/5 p-4 text-red text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Category Name *</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                placeholder="e.g., Aura Series"
              />
            </div>
            <div>
              <label htmlFor="slug" className="label">Slug *</label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
                placeholder="aura-series"
              />
            </div>
          </div>

          <div>
            <label htmlFor="parent_id" className="label">Parent Collection (optional)</label>
            <select
              id="parent_id"
              value={formData.parent_id ?? ""}
              onChange={(e) => handleChange("parent_id", e.target.value || null)}
              className={cx(
                "mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-charcoal"
              )}
            >
              <option value="">— None (top-level collection) —</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">
              Assign a parent collection to make this a child series (e.g. under PVC Wall Panels).
            </p>
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Describe this collection..."
            />
          </div>

          <div>
            <label htmlFor="cover_image" className="label">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              id="cover_image"
              onChange={handleImageUpload}
              className="input"
            />
            <p className="mt-1 text-sm text-muted">Recommended aspect ratio: 4:3. Max 50MB.</p>

            {previewImage && (
              <div className="mt-4 relative group aspect-video max-w-md rounded-lg overflow-hidden border border-line">
                <Thumb src={previewImage} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-red/90 text-white hover:bg-red"
                  aria-label="Remove cover image"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="cover_image_alt" className="label">Cover Image Alt Text</label>
            <Input
              id="cover_image_alt"
              value={formData.cover_image_alt}
              onChange={(e) => handleChange("cover_image_alt", e.target.value)}
              placeholder="Describe the cover photograph for accessibility"
            />
          </div>
        </CardContent>
      </Card>

      {/* Editorial Copy */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Editorial Copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="eyebrow" className="label">Eyebrow</label>
            <Input
              id="eyebrow"
              value={formData.eyebrow}
              onChange={(e) => handleChange("eyebrow", e.target.value)}
              placeholder="e.g. PVC WALL PANELS · AURA SERIES"
            />
          </div>

          <div>
            <label htmlFor="heading" className="label">Heading</label>
            <Input
              id="heading"
              value={formData.heading}
              onChange={(e) => handleChange("heading", e.target.value)}
              placeholder="e.g. Aura Series"
            />
          </div>

          <div>
            <label htmlFor="lede" className="label">Lede</label>
            <Textarea
              id="lede"
              value={formData.lede}
              onChange={(e) => handleChange("lede", e.target.value)}
              rows={3}
              placeholder="Opening paragraph for the collection page..."
            />
          </div>

          <div>
            <label htmlFor="edit_heading" className="label">Edit Heading</label>
            <Input
              id="edit_heading"
              value={formData.edit_heading}
              onChange={(e) => handleChange("edit_heading", e.target.value)}
              placeholder="e.g. The edit"
            />
          </div>

          <div>
            <label htmlFor="edit_note" className="label">Edit Note</label>
            <Textarea
              id="edit_note"
              value={formData.edit_note}
              onChange={(e) => handleChange("edit_note", e.target.value)}
              rows={3}
              placeholder="Editorial note about the source archive..."
            />
          </div>

          <div>
            <label htmlFor="rail_aria" className="label">Rail Aria Label</label>
            <Input
              id="rail_aria"
              value={formData.rail_aria}
              onChange={(e) => handleChange("rail_aria", e.target.value)}
              placeholder="Accessibility label for the media carousel"
            />
          </div>

          <div>
            <label htmlFor="category_action" className="label">Category Action Button Label</label>
            <Input
              id="category_action"
              value={formData.category_action}
              onChange={(e) => handleChange("category_action", e.target.value)}
              placeholder="e.g. View the Aura Series"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Collection Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="photographs" className="label">Photographs</label>
              <Input
                id="photographs"
                type="number"
                value={formData.photographs}
                onChange={(e) => handleChange("photographs", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="films" className="label">Films</label>
              <Input
                id="films"
                type="number"
                value={formData.films}
                onChange={(e) => handleChange("films", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="source_frames" className="label">Source Frames</label>
              <Input
                id="source_frames"
                type="number"
                value={formData.source_frames}
                onChange={(e) => handleChange("source_frames", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Archive facts shown in the edit-note panel on the collection page.
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="sort_order" className="label">Sort Order</label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleChange("sort_order", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-charcoal">Published</p>
              <p className="text-sm text-muted">Visible on the public website</p>
            </div>
            <Switch
              checked={formData.published}
              onChange={(checked) => handleChange("published", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

function XIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}