"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { Thumb } from "@/components/admin/ui/Thumb";
import { cx } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryWithParent extends Category {
  parent_name?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithParent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.categories) {
        const raw: Category[] = data.categories;
        const byId = new Map(raw.map((c) => [c.id, c]));
        setCategories(
          raw.map((c) => ({
            ...c,
            parent_name: c.parent_id ? byId.get(c.parent_id)?.name : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not delete this category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  /** Activate / deactivate a collection from the list view. */
  const handleToggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !category.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCategories(prev =>
          prev.map(entry => (entry.id === category.id ? { ...entry, ...data.category } : entry))
        );
      } else {
        alert(data.error || "Could not change publication status");
      }
    } catch (error) {
      console.error("Error updating category status:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Categories</h1>
          <p className="mt-2 text-muted">Manage your studio collections.</p>
        </div>
        <Link href="/admin/categories/new">
          <Button icon={<PlusIcon />} iconPosition="left">
            Add Category
          </Button>
        </Link>
      </div>

      {/* Categories Table */}
      <Card className="border-line">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="mx-auto h-8 w-8 animate-spin text-champagne" />
              <p className="mt-4 text-muted">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center">
              <GridIcon className="mx-auto h-12 w-12 text-muted/50" />
              <h3 className="mt-4 text-lg font-medium text-charcoal">No categories found</h3>
              <p className="mt-2 text-muted">Create your first collection.</p>
              <Link href="/admin/categories/new" className="mt-4 inline-block">
                <Button variant="primary" icon={<PlusIcon />} iconPosition="left">
                  Add Category
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface/50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Slug</th>
                   <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Cover</th>
                     <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Parent</th>
                     <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Order</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {category.image_path && (
                            <Thumb
                              src={category.image_path}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border border-line"
                            />
                          )}
                          <div>
                            <p className="font-medium text-charcoal">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-muted line-clamp-1">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal font-mono">
                        /{category.slug}/
                      </td>
                     <td className="px-6 py-4">
                         {category.image_path ? (
                           <Thumb
                             src={category.image_path}
                             alt=""
                             className="h-16 w-16 rounded-lg object-cover border border-line"
                           />
                         ) : (
                           <span className="text-muted text-sm">No cover</span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-sm text-charcoal">
                         {category.parent_name ?? "— Top-level —"}
                       </td>
                       <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          category.is_active 
                            ? "bg-emerald/10 text-emerald" 
                            : "bg-amber/10 text-amber"
                        )}>
                          {category.is_active ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {category.sort_order}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(category)}
                          >
                            {category.is_active ? "Unpublish" : "Publish"}
                          </Button>
                          <Link href={`/admin/categories/${category.id}`}>
                            <Button variant="ghost" size="sm" icon={<EditIcon />} />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<TrashIcon />} 
                            onClick={() => handleDelete(category.id)}
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

function GridIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} /><rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} /><rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} /><rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} /></svg>;
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