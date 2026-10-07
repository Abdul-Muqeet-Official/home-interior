"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Switch } from "@/components/admin/ui/Switch";
import { Thumb } from "@/components/admin/ui/Thumb";
import { cx } from "@/lib/utils";

interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  location: string;
  area_sqm: string;
  year: string;
  category: string;
  images: string[];
  video_url: string;
  video_urls: string[];
  video_poster: string;
  featured: boolean;
  published: boolean;
  sort_order: string;
}

export function ProjectForm({ initialData }: { initialData?: Partial<ProjectFormData>; isEditing?: boolean }) {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [videoPosterPreview, setVideoPosterPreview] = useState<string | null>(initialData?.video_poster || null);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    area_sqm: initialData?.area_sqm?.toString() || "",
    year: initialData?.year?.toString() || "",
    category: initialData?.category || "",
    images: initialData?.images || [],
    video_url: initialData?.video_url || "",
    video_urls: initialData?.video_urls || [],
    video_poster: initialData?.video_poster || "",
    featured: initialData?.featured || false,
    published: initialData?.published || false,
    sort_order: initialData?.sort_order?.toString() || "0",
  });

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "projects");

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.media?.url) {
          setImages(prev => [...prev, data.media.url]);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
  };

  const removeImage = (url: string) => {
    setImages(prev => prev.filter(img => img !== url));
  };

  const handleVideoPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "projects");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.media?.url) {
        setFormData(prev => ({ ...prev, video_poster: data.media.url }));
        setVideoPosterPreview(data.media.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const removeVideoPoster = () => {
    setFormData(prev => ({ ...prev, video_poster: "" }));
    setVideoPosterPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        year: formData.year ? parseInt(formData.year) : null,
        images,
        video_urls: formData.video_urls,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      const url = isEditing ? `/api/admin/projects/${params.id}` : "/api/admin/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save project");
      }

      router.push("/admin/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
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
              <label htmlFor="title" className="label">Project Title *</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                placeholder="e.g., Luxury Villa Renovation"
              />
            </div>
            <div>
              <label htmlFor="slug" className="label">Slug *</label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
                placeholder="luxury-villa-renovation"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="location" className="label">Location</label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Mumbai, India"
              />
            </div>
            <div>
              <label htmlFor="area_sqm" className="label">Area (m²)</label>
              <Input
                id="area_sqm"
                type="number"
                step="0.1"
                value={formData.area_sqm}
                onChange={(e) => handleChange("area_sqm", e.target.value)}
                placeholder="250"
              />
            </div>
            <div>
              <label htmlFor="year" className="label">Year</label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="label">Category</label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="e.g., Residential, Commercial, Hospitality"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              placeholder="Describe the project scope, design concept, materials used..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="label">Upload Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="input"
            />
            <p className="mt-1 text-sm text-muted">Select multiple images. Drag to reorder (after saving). Max 50MB per file.</p>
          </div>

          {images.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {images.map((url, index) => (
                <div key={url} className="relative group aspect-square rounded-card overflow-hidden border border-line">
                  <Thumb src={url} alt={`Project image ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-red/90 text-white hover:bg-red"
                    aria-label="Remove image"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="video_url" className="label">Video URL</label>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) => handleChange("video_url", e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
            <p className="mt-1 text-sm text-muted">Direct link to MP4/WebM video file. Video will autoplay muted in the project viewer.</p>
          </div>

          <div>
            <label htmlFor="video_urls" className="label">Additional Video URLs</label>
            <Textarea
              id="video_urls"
              value={formData.video_urls.join("\n")}
              onChange={(e) => handleChange("video_urls", e.target.value.split(/\r?\n/).map((value: string) => value.trim()).filter(Boolean))}
              rows={3}
              placeholder="One direct MP4/WebM URL per line"
            />
          </div>

          <div>
            <label htmlFor="video_poster" className="label">Video Poster (Thumbnail)</label>
            <input
              type="file"
              accept="image/*"
              id="video_poster"
              onChange={handleVideoPosterUpload}
              className="input"
            />
            <p className="mt-1 text-sm text-muted">Shown before video loads. Recommended 16:9 aspect ratio.</p>

            {videoPosterPreview && (
              <div className="mt-4 relative group aspect-video max-w-md rounded-lg overflow-hidden border border-line">
                <Thumb src={videoPosterPreview} alt="Poster preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removeVideoPoster}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-red/90 text-white hover:bg-red"
                  aria-label="Remove poster"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border-line">
        <CardHeader>
          <CardTitle>Status</CardTitle>
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-charcoal">Featured</p>
              <p className="text-sm text-muted">Show on homepage featured projects</p>
            </div>
            <Switch
              checked={formData.featured}
              onChange={(checked) => handleChange("featured", checked)}
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
          {isEditing ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

function XIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}