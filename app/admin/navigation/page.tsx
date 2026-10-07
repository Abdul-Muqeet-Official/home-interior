"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";

interface NavItem {
  href: string;
  label: string;
}

interface NavData {
  primary: NavItem[];
  consultation: NavItem;
  footer: NavItem[];
}

export default function AdminNavigationPage() {
  const [data, setData] = useState<NavData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/navigation");
      const json = await res.json();
      if (json.navigation) setData(json.navigation);
    } catch (err) {
      console.error("Error fetching navigation:", err);
      setError("Failed to load navigation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrimaryChange = (index: number, field: "href" | "label", value: string) => {
    setData((prev) => {
      if (!prev) return null;
      const primary = [...prev.primary];
      primary[index] = { ...primary[index], [field]: value };
      return { ...prev, primary };
    });
  };

  const handleAddPrimary = () => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        primary: [...prev.primary, { href: "/new-page", label: "NEW LINK" }],
      };
    });
  };

  const handleRemovePrimary = (index: number) => {
    setData((prev) => {
      if (!prev || prev.primary.length <= 1) return prev;
      return {
        ...prev,
        primary: prev.primary.filter((_, i) => i !== index),
      };
    });
  };

  const handleConsultationChange = (field: "href" | "label", value: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        consultation: { ...prev.consultation, [field]: value },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save navigation");

      setData(json.navigation);
      setSuccess("Navigation configuration published successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading navigation settings...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Navigation</h1>
          <p className="mt-2 text-muted">
            Configure primary header links, consultation action, and footer pathways.
          </p>
        </div>
        <Button type="button" onClick={handleSubmit} loading={saving}>
          Save Navigation
        </Button>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Nav */}
        <Card className="border-line">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Primary Header Navigation</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPrimary}>
              + Add Nav Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.primary.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-1/3">
                  <Input
                    value={item.label}
                    onChange={(e) => handlePrimaryChange(index, "label", e.target.value)}
                    placeholder="LABEL"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={item.href}
                    onChange={(e) => handlePrimaryChange(index, "href", e.target.value)}
                    placeholder="/path"
                  />
                </div>
                {data.primary.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red hover:bg-red/10"
                    onClick={() => handleRemovePrimary(index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action button */}
        <Card className="border-line">
          <CardHeader>
            <CardTitle>Consultation CTA Action</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted">Button Label</label>
              <Input
                value={data.consultation.label}
                onChange={(e) => handleConsultationChange("label", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Target Route</label>
              <Input
                value={data.consultation.href}
                onChange={(e) => handleConsultationChange("href", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

