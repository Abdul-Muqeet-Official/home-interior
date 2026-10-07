"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";

interface ServiceItem {
  slug: string;
  title: string;
  meta: string;
  description: string;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (index: number, field: keyof ServiceItem, value: string) => {
    setServices((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      slug: `custom-service-${Date.now()}`,
      title: "New Studio Service",
      meta: "Specification",
      description: "Service description and scope of works.",
    };
    setServices((prev) => [...prev, newService]);
    setEditingIndex(services.length);
  };

  const handleRemoveService = (index: number) => {
    if (!confirm("Are you sure you want to remove this service?")) return;
    setServices((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save services");

      setServices(data.services);
      setSuccess("Services saved and published successfully.");
      setEditingIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving services");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Services</h1>
          <p className="mt-2 text-muted">
            Manage studio disciplines, descriptions, and architectural capabilities.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleAddService}>
            + Add Service
          </Button>
          <Button type="button" onClick={handleSaveAll} loading={saving}>
            Save All Changes
          </Button>
        </div>
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

      {loading ? (
        <div className="p-8 text-center text-muted">Loading services...</div>
      ) : (
        <div className="space-y-4">
          {services.map((service, index) => {
            const isEditing = editingIndex === index;

            return (
              <Card key={service.slug || index} className="border-line">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div>
                    <CardTitle className="text-base font-medium text-charcoal">
                      {service.title}
                    </CardTitle>
                    <span className="text-xs text-muted uppercase tracking-wider">
                      {service.meta} • /{service.slug}/
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIndex(isEditing ? null : index)}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red hover:bg-red/10"
                      onClick={() => handleRemoveService(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>

                {isEditing && (
                  <CardContent className="space-y-4 pt-0 border-t border-line/60">
                    <div className="grid gap-4 sm:grid-cols-2 pt-4">
                      <div>
                        <label className="text-xs text-muted">Service Title</label>
                        <Input
                          value={service.title}
                          onChange={(e) => handleChange(index, "title", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Category / Meta Tag</label>
                        <Input
                          value={service.meta}
                          onChange={(e) => handleChange(index, "meta", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted">Scope & Description</label>
                      <Textarea
                        rows={3}
                        value={service.description}
                        onChange={(e) => handleChange(index, "description", e.target.value)}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

