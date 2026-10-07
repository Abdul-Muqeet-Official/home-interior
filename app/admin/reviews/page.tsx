"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { cx } from "@/lib/utils";

interface Review {
  id: string;
  client_name: string;
  email: string | null;
  testimonial: string;
  location: string | null;
  project_type: string | null;
  rating: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Reviews</h1>
          <p className="mt-2 text-muted">Manage client testimonials.</p>
        </div>
        <Link href="/admin/reviews/new">
          <Button icon={<PlusIcon />} iconPosition="left">
            Add Review
          </Button>
        </Link>
      </div>

      {/* Reviews Table */}
      <Card className="border-line">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="mx-auto h-8 w-8 animate-spin text-champagne" />
              <p className="mt-4 text-muted">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center">
              <StarIcon className="mx-auto h-12 w-12 text-muted/50" />
              <h3 className="mt-4 text-lg font-medium text-charcoal">No reviews found</h3>
              <p className="mt-2 text-muted">Add your first client testimonial.</p>
              <Link href="/admin/reviews/new" className="mt-4 inline-block">
                <Button variant="primary" icon={<PlusIcon />} iconPosition="left">
                  Add Review
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface/50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Rating</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Content</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Order</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-surface border border-line flex items-center justify-center">
                            <StarIcon className="h-5 w-5 text-muted" />
                          </div>
                          <div>
                            <p className="font-medium text-charcoal">{review.client_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {review.email || "Private email unavailable"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              className={cx("h-4 w-4", i < review.rating ? "text-champagne fill-current" : "text-muted/30")} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal max-w-xs line-clamp-2">
                        {review.testimonial}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          review.is_published 
                            ? "bg-emerald/10 text-emerald" 
                            : "bg-amber/10 text-amber"
                        )}>
                          {review.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {review.sort_order}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/reviews/${review.id}`}>
                            <Button variant="ghost" size="sm" icon={<EditIcon />} />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<TrashIcon />} 
                            onClick={() => handleDelete(review.id)}
                            className="text-red hover:text-red"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}

function StarIcon({ className, fill }: { className?: string; fill?: string }) {
  return <svg viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" className={className} aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>;
}

function EditIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

function TrashIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}

function Loader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
    </svg>
  );
}