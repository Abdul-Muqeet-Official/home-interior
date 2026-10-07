"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/admin/ui/Card";
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

interface CollectionItem extends Category {
  parent_name?: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [selectedParent, setSelectedParent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.categories) {
        const raw: Category[] = data.categories;
        const parents = raw.filter((c) => !c.parent_id);
        const children = raw.filter((c) => !!c.parent_id);
        const parentMap = new Map(parents.map((p) => [p.id, p.name]));

        setParentCategories(parents);
        setCollections(
          children.map((c) => ({
            ...c,
            parent_name: c.parent_id ? parentMap.get(c.parent_id) || "Parent Category" : "None",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (collection: CollectionItem) => {
    try {
      const res = await fetch(`/api/admin/categories/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !collection.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCollections((prev) =>
          prev.map((entry) => (entry.id === collection.id ? { ...entry, ...data.category } : entry))
        );
      } else {
        alert(data.error || "Could not change status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not delete this collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  const filtered = collections.filter((c) => {
    const matchesParent = selectedParent === "all" || c.parent_id === selectedParent;
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.parent_name && c.parent_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesParent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Collections</h1>
          <p className="mt-2 text-muted">
            Manage catalogue sub-collections, series, and material lines.
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>Add Collection</Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input text-sm py-2 px-3 border border-line bg-surface rounded-card"
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
          >
            <option value="all">All Parent Categories ({collections.length})</option>
            {parentCategories.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs text-sm"
          />
        </div>
        <div className="text-xs text-muted">
          Showing {filtered.length} of {collections.length} collections
        </div>
      </div>

      <Card className="border-line">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted">Loading collections...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted">No collections found matching filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface/50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Collection
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Parent Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Order
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Thumb
                            src={item.image_path || ""}
                            alt={item.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-charcoal">{item.name}</p>
                            <p className="text-xs text-muted">/{item.slug}/</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-surface border border-line text-muted">
                          {item.parent_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cx(
                            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                            item.is_active
                              ? "bg-emerald/10 text-emerald"
                              : "bg-charcoal/10 text-muted"
                          )}
                        >
                          {item.is_active ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">{item.sort_order}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            className="text-xs font-medium text-muted hover:text-charcoal px-2 py-1 rounded hover:bg-surface"
                          >
                            {item.is_active ? "Unpublish" : "Publish"}
                          </button>
                          <Link href={`/admin/categories/${item.id}`}>
                            <button
                              type="button"
                              className="text-xs font-medium text-champagne hover:text-gold-deep px-2 py-1 rounded hover:bg-champagne/10"
                            >
                              Edit
                            </button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-medium text-red hover:bg-red/10 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
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
