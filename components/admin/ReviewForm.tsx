"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Select } from "@/components/admin/ui/Select";
import { Switch } from "@/components/admin/ui/Switch";

interface ReviewFormData {
  client_name: string;
  email: string;
  testimonial: string;
  rating: number;
  location: string;
  project_type: string;
  is_published: boolean;
  sort_order: string;
}

export function ReviewForm({ initialData }: { initialData?: Partial<ReviewFormData>; isEditing?: boolean }) {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<ReviewFormData>({
    client_name: initialData?.client_name || "",
    email: initialData?.email || "",
    testimonial: initialData?.testimonial || "",
    rating: initialData?.rating || 5,
    location: initialData?.location || "",
    project_type: initialData?.project_type || "",
    is_published: initialData?.is_published || false,
    sort_order: initialData?.sort_order?.toString() || "0",
  });

  const update = <K extends keyof ReviewFormData>(field: K, value: ReviewFormData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        throw new Error("Enter a valid customer email.");
      }
      const response = await fetch(isEditing ? `/api/admin/reviews/${params.id}` : "/api/admin/reviews", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rating: Number(formData.rating), sort_order: Number(formData.sort_order) || 0 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save review");
      router.push("/admin/reviews");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {error && <div className="rounded-card border border-red/20 bg-red/5 p-4 text-sm text-red">{error}</div>}
      <Card className="border-line">
        <CardHeader><CardTitle>Review Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div><label htmlFor="client_name" className="label">Customer Name *</label><Input id="client_name" value={formData.client_name} onChange={(event) => update("client_name", event.target.value)} required /></div>
            <div><label htmlFor="email" className="label">Customer Email *</label><Input id="email" type="email" value={formData.email} onChange={(event) => update("email", event.target.value)} required /></div>
          </div>
          <div><label htmlFor="testimonial" className="label">Review *</label><Textarea id="testimonial" value={formData.testimonial} onChange={(event) => update("testimonial", event.target.value)} required rows={4} /></div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div><label htmlFor="rating" className="label">Star Rating *</label><Select id="rating" value={String(formData.rating)} onChange={(event) => update("rating", Number(event.target.value))} required>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}</Select></div>
            <div><label htmlFor="location" className="label">Project / Area</label><Input id="location" value={formData.location} onChange={(event) => update("location", event.target.value)} /></div>
            <div><label htmlFor="sort_order" className="label">Display Order</label><Input id="sort_order" type="number" value={formData.sort_order} onChange={(event) => update("sort_order", event.target.value)} /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-line">
        <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-between"><div><p className="font-medium text-charcoal">Published</p><p className="text-sm text-muted">Only published reviews appear publicly.</p></div><Switch checked={formData.is_published} onChange={(checked) => update("is_published", checked)} /></div></CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={loading}>{isEditing ? "Update Review" : "Create Review"}</Button></div>
    </form>
  );
}
