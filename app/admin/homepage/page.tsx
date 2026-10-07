"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { cx } from "@/lib/utils";
import Image from "next/image";

interface Slide {
  src: string;
  caption: string;
}

interface HomepageData {
  hero: {
    eyebrow: string;
    heading: string;
    highlight: string;
    subtext: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    slides: Slide[];
  };
  materials: {
    eyebrow: string;
    heading: string;
    subtext: string;
    description: string;
  };
  work: {
    eyebrow: string;
    heading: string;
    subtext: string;
    description: string;
  };
}

export default function AdminHomepagePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/homepage");
      const json = await res.json();
      if (json.homepage) setData(json.homepage);
    } catch (err) {
      console.error("Error fetching homepage settings:", err);
      setError("Failed to load homepage settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHeroChange = (field: string, value: any) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        hero: {
          ...prev.hero,
          [field]: value,
        },
      };
    });
  };

  const handleCtaChange = (ctaType: "primaryCta" | "secondaryCta", field: "label" | "href", value: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        hero: {
          ...prev.hero,
          [ctaType]: {
            ...prev.hero[ctaType],
            [field]: value,
          },
        },
      };
    });
  };

  const handleSlideChange = (index: number, field: "src" | "caption", value: string) => {
    setData((prev) => {
      if (!prev) return null;
      const nextSlides = [...prev.hero.slides];
      nextSlides[index] = { ...nextSlides[index], [field]: value };
      return {
        ...prev,
        hero: {
          ...prev.hero,
          slides: nextSlides,
        },
      };
    });
  };

  const handleAddSlide = () => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        hero: {
          ...prev.hero,
          slides: [
            ...prev.hero.slides,
            { src: "/media/photos/hero-01.jpg", caption: "New visual study caption" },
          ],
        },
      };
    });
  };

  const handleRemoveSlide = (index: number) => {
    setData((prev) => {
      if (!prev || prev.hero.slides.length <= 1) return prev;
      return {
        ...prev,
        hero: {
          ...prev.hero,
          slides: prev.hero.slides.filter((_, i) => i !== index),
        },
      };
    });
  };

  const handleSlideUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "site-assets");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to upload image");

      const uploadedUrl = resData.media?.url || resData.url;
      if (uploadedUrl) {
        handleSlideChange(index, "src", uploadedUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save homepage settings");

      setData(resData.homepage);
      setSuccess("Homepage configuration published successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-8 text-center text-muted">Loading homepage settings...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="display-2 text-charcoal">Homepage Control</h1>
        <p className="mt-2 text-muted">
          Manage hero messaging, rotation slides, section titles, and call-to-actions.
        </p>
      </div>

      {error && (
        <div className="rounded-card border border-red/20 bg-red/5 p-4 text-red text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-card border border-emerald/20 bg-emerald/5 p-4 text-emerald text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Hero Copy */}
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Hero Section — Editorial Copy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="label">Eyebrow</label>
                <Input
                  value={data.hero.eyebrow}
                  onChange={(e) => handleHeroChange("eyebrow", e.target.value)}
                  placeholder="CURATED COLLECTION 2026"
                />
              </div>
              <div>
                <label className="label">Highlight Keyword</label>
                <Input
                  value={data.hero.highlight}
                  onChange={(e) => handleHeroChange("highlight", e.target.value)}
                  placeholder="Living Spaces."
                />
              </div>
            </div>

            <div>
              <label className="label">Main Heading</label>
              <Input
                value={data.hero.heading}
                onChange={(e) => handleHeroChange("heading", e.target.value)}
                placeholder="Redefining Modern Living Spaces."
              />
            </div>

            <div>
              <label className="label">Subtext / Lede</label>
              <Textarea
                rows={3}
                value={data.hero.subtext}
                onChange={(e) => handleHeroChange("subtext", e.target.value)}
                placeholder="Bespoke interior architecture, refined materials and considered spaces..."
              />
            </div>

            {/* CTAs */}
            <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-line">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-charcoal">Primary CTA</h4>
                <div>
                  <label className="text-xs text-muted">Button Label</label>
                  <Input
                    value={data.hero.primaryCta.label}
                    onChange={(e) => handleCtaChange("primaryCta", "label", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Destination URL</label>
                  <Input
                    value={data.hero.primaryCta.href}
                    onChange={(e) => handleCtaChange("primaryCta", "href", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-charcoal">Secondary CTA</h4>
                <div>
                  <label className="text-xs text-muted">Button Label</label>
                  <Input
                    value={data.hero.secondaryCta.label}
                    onChange={(e) => handleCtaChange("secondaryCta", "label", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Destination URL</label>
                  <Input
                    value={data.hero.secondaryCta.href}
                    onChange={(e) => handleCtaChange("secondaryCta", "href", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Slides */}
        <Card className="border-line">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hero Carousel Slides</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSlide}>
              + Add Slide
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.hero.slides.map((slide, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-card border border-line bg-surface/50"
              >
                <div className="relative h-24 w-36 shrink-0 rounded overflow-hidden border border-line bg-charcoal/5">
                  <Image
                    src={slide.src}
                    alt={slide.caption || `Slide ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="text-xs text-muted">Image Source / URL</label>
                    <Input
                      value={slide.src}
                      onChange={(e) => handleSlideChange(index, "src", e.target.value)}
                      placeholder="/media/photos/hero-01.jpg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted">Slide Caption</label>
                    <Input
                      value={slide.caption}
                      onChange={(e) => handleSlideChange(index, "caption", e.target.value)}
                      placeholder="Material palette study..."
                    />
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                  <label className="btn btn-secondary text-xs cursor-pointer">
                    {uploadingIndex === index ? "Uploading..." : "Replace"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSlideUpload(index, e)}
                      disabled={uploadingIndex === index}
                    />
                  </label>
                  {data.hero.slides.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red hover:bg-red/10"
                      onClick={() => handleRemoveSlide(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <Button type="submit" loading={saving}>
            Save & Publish Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

