"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Select } from "@/components/admin/ui/Select";
import { Switch } from "@/components/admin/ui/Switch";
import { Thumb } from "@/components/admin/ui/Thumb";
import { cx, composePriceLabel } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

interface ProductFormData {
  name: string;
  slug: string;
  code: string;
  description: string;
  category_id: string; // The selected collection ID or category ID
  primary_category_id: string; // The top-level category
  price: string;
  original_price: string;
  currency: string;
  unit: string;
  price_label: string;
  stock_status: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
    depth: string;
    unit: string;
  };
  tags: string[];
  video_url: string;
  video_poster: string;
  specifications: Record<string, string>;
  images: string[];
  published: boolean;
  sort_order: string;
}

const STANDARD_STUDIO_TAGS = [
  "Waterproof",
  "Commercial Grade",
  "Acoustic Slat",
  "Herringbone",
  "Textured Finish",
  "Luxury Matte",
  "Fire Retardant",
  "High Durability",
  "Anti-Bacterial",
  "Bespoke Living",
  "Imported Grade A",
  "Sound Dampening",
  "UV Resistant",
  "Scratch Resistant",
];

const STOCK_STATUS_OPTIONS = [
  { value: "in_stock", label: "In Stock (Available for Dispatch)" },
  { value: "low_stock", label: "Low Stock (Limited Quantity)" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "made_to_order", label: "Made to Order (Fabrication Required)" },
  { value: "consultation", label: "Price / Availability on Consultation" },
];

export function ProductForm({
  initialData,
  categories = [],
}: {
  initialData?: Partial<ProductFormData>;
  categories: Category[];
  isEditing?: boolean;
}) {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;

  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newTagInput, setNewTagInput] = useState("");

  // Split categories into Primary Categories and Sub-Collections
  const primaryCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  const collectionsByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories
      .filter((c) => !!c.parent_id)
      .forEach((col) => {
        const parentId = col.parent_id!;
        const existing = map.get(parentId) || [];
        existing.push(col);
        map.set(parentId, existing);
      });
    return map;
  }, [categories]);

  // Initial determination of primary category and collection
  const initialCategorySetup = useMemo(() => {
    if (!initialData?.category_id) return { primaryId: "", collectionId: "" };
    const matching = categories.find((c) => c.id === initialData.category_id);
    if (!matching) return { primaryId: "", collectionId: "" };
    if (matching.parent_id) {
      return { primaryId: matching.parent_id, collectionId: matching.id };
    }
    return { primaryId: matching.id, collectionId: "" };
  }, [initialData, categories]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    category_id: initialData?.category_id || initialCategorySetup.collectionId || "",
    primary_category_id: initialCategorySetup.primaryId || "",
    price: initialData?.price?.toString() || "",
    original_price: initialData?.original_price?.toString() || "",
    currency: initialData?.currency || "PKR",
    unit: initialData?.unit || "sq ft",
    price_label: initialData?.price_label || "",
    stock_status: initialData?.stock_status || "in_stock",
    dimensions: initialData?.dimensions || {
      length: "",
      width: "",
      height: "",
      depth: "",
      unit: "mm",
    },
    tags: initialData?.tags || [],
    video_url: initialData?.video_url || "",
    video_poster: initialData?.video_poster || "",
    specifications: initialData?.specifications || {},
    images: initialData?.images || [],
    published: initialData?.published || false,
    sort_order: initialData?.sort_order?.toString() || "0",
  });

  // Available collections for selected primary category
  const availableCollections = useMemo(() => {
    if (!formData.primary_category_id) return [];
    return collectionsByParent.get(formData.primary_category_id) || [];
  }, [formData.primary_category_id, collectionsByParent]);

  // Auto-generate slug when name changes (if not already editing an existing slug)
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const updates: Partial<ProductFormData> = { name: val };
      if (!isEditing || !prev.slug) {
        updates.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return { ...prev, ...updates };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("bucket", "products");

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });
        const data = await res.json();
        if (data.media?.url) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.media.url],
          }));
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  };

  const removeImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== url),
    }));
  };

  const setCoverImage = (url: string) => {
    setFormData((prev) => {
      const remaining = prev.images.filter((img) => img !== url);
      return { ...prev, images: [url, ...remaining] };
    });
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || formData.tags.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setNewTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (publishNow?: boolean) => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Product name is required.");
      setLoading(false);
      return;
    }

    if (!formData.primary_category_id) {
      setError("Please select a Primary Category in Step 2.");
      setLoading(false);
      return;
    }

    // Determine final target category ID: collection if chosen, otherwise primary
    const targetCategoryId = formData.category_id || formData.primary_category_id;
    const isPublished = publishNow !== undefined ? publishNow : formData.published;

    try {
      const payload = {
        name: formData.name.trim(),
        title: formData.name.trim(),
        slug: formData.slug.trim(),
        code: formData.code.trim() || null,
        description: formData.description.trim() || null,
        category_id: targetCategoryId,
        price: formData.price ? parseFloat(formData.price) : null,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        currency: formData.currency.trim() || "PKR",
        unit: formData.unit.trim() || null,
        price_label: formData.price_label.trim() || null,
        stock_status: formData.stock_status,
        dimensions: formData.dimensions,
        tags: formData.tags,
        video_url: formData.video_url.trim() || null,
        video_poster: formData.video_poster.trim() || null,
        images: formData.images,
        is_published: isPublished,
        published: isPublished,
        sort_order: parseInt(formData.sort_order) || 0,
        specifications: {
          ...formData.specifications,
          stock_status: formData.stock_status,
          dimensions: formData.dimensions,
          tags: formData.tags,
          video_url: formData.video_url.trim() || null,
          video_poster: formData.video_poster.trim() || null,
        },
      };

      const url = isEditing ? `/api/admin/products/${params.id}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      setSuccess(
        isEditing
          ? "Product updated successfully!"
          : "Product created and synchronized with the catalogue!"
      );

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Basic Info", desc: "Name, Code & Overview" },
    { num: 2, title: "Category & Series", desc: "Where it belongs" },
    { num: 3, title: "Pricing & Stock", desc: "Rates, dimensions & stock" },
    { num: 4, title: "Media", desc: "Photos & video" },
    { num: 5, title: "Studio Tags", desc: "Attributes & badges" },
    { num: 6, title: "Review & Publish", desc: "Summary & live status" },
  ];

  return (
    <div className="space-y-6">
      {/* Wizard Step Progression Bar */}
      <div className="rounded-2xl border border-line bg-pure p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={cx(
                "flex flex-col items-start rounded-xl p-2.5 text-left transition-all",
                activeStep === s.num
                  ? "bg-[#C5A880]/15 border border-[#C5A880]/40 text-charcoal"
                  : activeStep > s.num
                  ? "bg-surface/50 text-charcoal border border-transparent hover:border-line"
                  : "text-muted hover:bg-surface/30"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cx(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    activeStep === s.num
                      ? "bg-[#C5A880] text-black"
                      : activeStep > s.num
                      ? "bg-charcoal text-white"
                      : "bg-surface text-muted"
                  )}
                >
                  {activeStep > s.num ? "✓" : s.num}
                </span>
                <span className="text-xs font-semibold">{s.title}</span>
              </div>
              <span className="mt-1 text-[10px] text-muted line-clamp-1">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-900 flex items-center gap-2">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-center gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* STEP 1: BASIC INFORMATION */}
      {activeStep === 1 && (
        <Card className="border-line shadow-sm">
          <CardHeader>
            <CardTitle>Step 1 — Basic Information</CardTitle>
            <p className="text-xs text-muted">
              Define the product name, SKU, URL slug, and customer-facing description.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Walnut Acoustic Slat"
                  required
                />
              </div>

              <div>
                <label className="label">SKU / Studio Reference Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. OAK-SLAT-2400"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">URL Slug (Web Address Identifier) *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="royal-walnut-acoustic-slat"
                  required
                />
                <p className="mt-1 text-[11px] text-muted">
                  Used in browser URL: /products/{formData.slug || "your-slug"}
                </p>
              </div>

              <div>
                <label className="label">Catalogue Display Sort Order</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="0"
                />
                <p className="mt-1 text-[11px] text-muted">Lower numbers appear first (0, 1, 2…)</p>
              </div>
            </div>

            <div>
              <label className="label">Product Description</label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe material composition, acoustic properties, recommended interior applications, and bespoke finish details…"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: WHERE DOES IT BELONG? */}
      {activeStep === 2 && (
        <Card className="border-line shadow-sm">
          <CardHeader>
            <CardTitle>Step 2 — Where Does It Belong?</CardTitle>
            <p className="text-xs text-muted">
              Select the primary architectural category, then assign it to a specific collection/series.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="label">Primary Category *</label>
              <Select
                value={formData.primary_category_id}
                onChange={(e) => {
                  const newPrimary = e.target.value;
                  setFormData({
                    ...formData,
                    primary_category_id: newPrimary,
                    category_id: "", // Reset sub-collection on parent change
                  });
                }}
                required
              >
                <option value="">-- Select Primary Material Category --</option>
                {primaryCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-[11px] text-muted">
                Choose from the 11 primary departments (Wallpaper, Flooring, PVC Panels, False Ceiling, etc.)
              </p>
            </div>

            {formData.primary_category_id && (
              <div className="rounded-xl border border-line bg-surface/40 p-4">
                <label className="label">Collection / Series (Sub-Catalogue)</label>
                {availableCollections.length > 0 ? (
                  <>
                    <Select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">
                        -- None (Directly in Primary Category) --
                      </option>
                      {availableCollections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-1.5 text-[11px] text-muted">
                      Example: If category is Wallpaper, choose China or Korea. If PVC Wall Panels, choose Prestige or Royal.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted">
                    No sub-collections currently exist under this category. This product will be placed directly in the main category.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: PRICING, DIMENSIONS & STOCK */}
      {activeStep === 3 && (
        <Card className="border-line shadow-sm">
          <CardHeader>
            <CardTitle>Step 3 — Pricing, Dimensions & Stock</CardTitle>
            <p className="text-xs text-muted">
              Configure rates, compare-at sales price, physical dimensions, and stock availability.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="label">Regular Price (PKR)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="24500"
                />
                <p className="mt-1 text-[11px] text-muted">Leave blank for &quot;On Consultation&quot;</p>
              </div>

              <div>
                <label className="label">Compare-At Price (Optional Original Price)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="28000"
                />
                <p className="mt-1 text-[11px] text-muted">Shows strikethrough price if discounted</p>
              </div>

              <div>
                <label className="label">Pricing Unit</label>
                <Select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="sq ft">per sq ft</option>
                  <option value="panel">per panel</option>
                  <option value="box">per box</option>
                  <option value="roll">per roll</option>
                  <option value="piece">per piece</option>
                  <option value="linear ft">per linear ft</option>
                </Select>
              </div>
            </div>

            {/* Price Preview */}
            <div className="rounded-xl border border-line bg-surface/50 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Public Price Display Preview:
              </span>
              <p className="mt-1 text-sm font-semibold text-charcoal">
                {composePriceLabel(formData.price, formData.currency, formData.unit) ??
                  "PRICE AVAILABLE ON CONSULTATION"}
              </p>
            </div>

            {/* Stock & Availability */}
            <div>
              <label className="label">Stock & Availability Status *</label>
              <Select
                value={formData.stock_status}
                onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
              >
                {STOCK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Physical Dimensions */}
            <div>
              <label className="label font-semibold">Architectural Dimensions</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-5">
                <div>
                  <span className="text-[11px] text-muted">Length</span>
                  <Input
                    value={formData.dimensions.length}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, length: e.target.value },
                      })
                    }
                    placeholder="2400"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted">Width</span>
                  <Input
                    value={formData.dimensions.width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, width: e.target.value },
                      })
                    }
                    placeholder="600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted">Height</span>
                  <Input
                    value={formData.dimensions.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, height: e.target.value },
                      })
                    }
                    placeholder="—"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted">Thickness / Depth</span>
                  <Input
                    value={formData.dimensions.depth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, depth: e.target.value },
                      })
                    }
                    placeholder="21"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted">Dimension Unit</span>
                  <Select
                    value={formData.dimensions.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: { ...formData.dimensions, unit: e.target.value },
                      })
                    }
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="inch">inch</option>
                    <option value="ft">ft</option>
                    <option value="m">meter</option>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: MEDIA & PHOTOGRAPHY */}
      {activeStep === 4 && (
        <Card className="border-line shadow-sm">
          <CardHeader>
            <CardTitle>Step 4 — Media & Photography</CardTitle>
            <p className="text-xs text-muted">
              Upload product images, set the cover photograph, and optionally attach architectural video.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="label">Upload Photography</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="input"
              />
              <p className="mt-1 text-[11px] text-muted">
                Images are uploaded to your high-speed Supabase storage bucket. The first image serves as the primary catalogue cover.
              </p>
            </div>

            {formData.images.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {formData.images.map((url, idx) => (
                  <div
                    key={url}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface"
                  >
                    <Thumb src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-champagne px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                        Cover Image
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setCoverImage(url)}
                          className="rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-charcoal hover:bg-white"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-8 text-center text-xs text-muted">
                No images uploaded yet. If left blank, the studio&apos;s standard material placeholder will be used.
              </div>
            )}

            {/* Video Option */}
            <div className="rounded-xl border border-line bg-surface/30 p-4 space-y-3">
              <label className="label">Product Showcase Video URL (Optional)</label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://... or /media/work-showcase/01-3d-wall-picture.mp4"
              />
              <p className="text-[11px] text-muted">
                Enter an MP4 video URL or local media showcase video.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: TAGS & ATTRIBUTES */}
      {activeStep === 5 && (
        <Card className="border-line shadow-sm">
          <CardHeader>
            <CardTitle>Step 5 — Studio Tags & Specifications</CardTitle>
            <p className="text-xs text-muted">
              Tag this product with search attributes (e.g. Waterproof, Acoustic, Imported Grade A).
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="label">Current Tags for This Product</label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-xl border border-line bg-surface/30">
                {formData.tags.length > 0 ? (
                  formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-pure px-3 py-1 text-xs font-medium text-charcoal"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted p-1">No tags assigned yet. Select below.</span>
                )}
              </div>
            </div>

            {/* Preset Studio Tags */}
            <div>
              <label className="label">Click to Add Studio Tags</label>
              <div className="flex flex-wrap gap-2">
                {STANDARD_STUDIO_TAGS.map((tag) => {
                  const isSelected = formData.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={isSelected}
                      onClick={() => addTag(tag)}
                      className={cx(
                        "rounded-lg px-2.5 py-1 text-xs transition-colors border",
                        isSelected
                          ? "bg-surface text-muted/50 border-transparent cursor-not-allowed"
                          : "bg-pure border-line text-charcoal hover:border-champagne hover:text-champagne"
                      )}
                    >
                      + {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2 max-w-sm">
              <Input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Custom tag name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTagInput);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addTag(newTagInput)}>
                Add Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: REVIEW & PUBLISH */}
      {activeStep === 6 && (
        <Card className="border-line shadow-sm">
          <CardHeader>
            <CardTitle>Step 6 — Final Review & Publishing</CardTitle>
            <p className="text-xs text-muted">
              Review commercial specifications before saving to the database.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-line bg-surface/40 p-5 text-xs">
              <div>
                <span className="text-muted uppercase text-[10px] font-semibold">Product Title</span>
                <p className="font-semibold text-charcoal text-sm">{formData.name || "—"}</p>
              </div>

              <div>
                <span className="text-muted uppercase text-[10px] font-semibold">Department</span>
                <p className="font-semibold text-charcoal text-sm">
                  {primaryCategories.find((c) => c.id === formData.primary_category_id)?.name || "—"}
                  {formData.category_id &&
                    ` → ${availableCollections.find((c) => c.id === formData.category_id)?.name || ""}`}
                </p>
              </div>

              <div>
                <span className="text-muted uppercase text-[10px] font-semibold">Price</span>
                <p className="font-semibold text-charcoal text-sm">
                  {formData.price ? `PKR ${formData.price} / ${formData.unit}` : "On Consultation"}
                </p>
              </div>

              <div>
                <span className="text-muted uppercase text-[10px] font-semibold">Stock Status</span>
                <p className="font-semibold text-charcoal text-sm capitalize">
                  {formData.stock_status.replace("_", " ")}
                </p>
              </div>

              <div>
                <span className="text-muted uppercase text-[10px] font-semibold">Images Uploaded</span>
                <p className="font-semibold text-charcoal text-sm">{formData.images.length} images</p>
              </div>

              <div>
                <span className="text-muted uppercase text-[10px] font-semibold">Tags Assigned</span>
                <p className="font-semibold text-charcoal text-sm">{formData.tags.length} tags</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line p-4">
              <div>
                <p className="font-semibold text-charcoal text-sm">Publish to Live Website Immediately?</p>
                <p className="text-xs text-muted">
                  If turned off, this product will be saved as an internal Draft.
                </p>
              </div>
              <Switch
                checked={formData.published}
                onChange={(checked) => setFormData({ ...formData, published: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-line pt-4">
        <div>
          {activeStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep((prev) => prev - 1)}
            >
              ← Previous Step
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeStep < 6 ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setActiveStep((prev) => prev + 1)}
            >
              Next Step →
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleSubmit(false)}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={loading}
                onClick={() => handleSubmit(true)}
              >
                {loading ? "Saving to Catalogue…" : "Save & Publish Live"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}