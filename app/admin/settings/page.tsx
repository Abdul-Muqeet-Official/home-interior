"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Switch } from "@/components/admin/ui/Switch";
import { cx } from "@/lib/utils";

interface Settings {
  id: string;
  site_name: string | null;
  site_description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  updated_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSettings(data.settings);
      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="p-8 text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-champagne" />
          <p className="mt-4 text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="display-2 text-charcoal">Settings</h1>
        <p className="mt-2 text-muted">Configure your studio details and SEO.</p>
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
        {/* Business Info */}
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="site_name" className="label">Studio Name</label>
              <Input
                id="site_name"
                value={settings?.site_name || ""}
                onChange={(e) => handleChange("site_name", e.target.value)}
                placeholder="Home Interior Studio"
              />
            </div>

            <div>
              <label htmlFor="site_description" className="label">Studio Description</label>
              <Textarea
                id="site_description"
                value={settings?.site_description || ""}
                onChange={(e) => handleChange("site_description", e.target.value)}
                rows={3}
                placeholder="Brief description of your studio for SEO and social sharing"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="label">Phone</label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings?.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="03232655111"
                />
              </div>
              <div>
                <label htmlFor="whatsapp" className="label">WhatsApp</label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={settings?.whatsapp || ""}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  placeholder="03032566212"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <Input
                id="email"
                type="email"
                value={settings?.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="studio@example.com"
              />
            </div>

            <div>
              <label htmlFor="address" className="label">Address</label>
              <Textarea
                id="address"
                value={settings?.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                rows={3}
                placeholder="Full studio address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="instagram" className="label">Instagram</label>
                <Input
                  id="instagram"
                  value={settings?.instagram || ""}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  placeholder="https://instagram.com/yourstudio"
                />
              </div>
              <div>
                <label htmlFor="facebook" className="label">Facebook</label>
                <Input
                  id="facebook"
                  value={settings?.facebook || ""}
                  onChange={(e) => handleChange("facebook", e.target.value)}
                  placeholder="https://facebook.com/yourstudio"
                />
              </div>
              <div>
                <label htmlFor="linkedin" className="label">LinkedIn</label>
                <Input
                  id="linkedin"
                  value={settings?.linkedin || ""}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/yourstudio"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card className="border-line">
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="seo_title" className="label">SEO Title</label>
              <Input
                id="seo_title"
                value={settings?.seo_title || ""}
                onChange={(e) => handleChange("seo_title", e.target.value)}
                placeholder="Home Interior Studio | Premium Interior Design"
              />
              <p className="mt-1 text-sm text-muted">Max 60 characters recommended</p>
            </div>

            <div>
              <label htmlFor="seo_description" className="label">SEO Description</label>
              <Textarea
                id="seo_description"
                value={settings?.seo_description || ""}
                onChange={(e) => handleChange("seo_description", e.target.value)}
                rows={3}
                placeholder="Meta description for search engines"
              />
              <p className="mt-1 text-sm text-muted">Max 160 characters recommended</p>
            </div>

            <div>
              <label htmlFor="seo_image" className="label">SEO Image URL</label>
              <Input
                id="seo_image"
                value={settings?.seo_image || ""}
                onChange={(e) => handleChange("seo_image", e.target.value)}
                placeholder="https://example.com/og-image.jpg"
              />
              <p className="mt-1 text-sm text-muted">Open Graph image for social sharing (1200×630 recommended)</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

function Loader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
    </svg>
  );
}
