"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { cx, composePriceLabel } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  code: string | null;
  price: number | null;
  currency: string | null;
  unit: string | null;
  is_published: boolean;
  sort_order: number;
  categories?: { name: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // fetchProducts reads search/statusFilter from state; re-run when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not delete this product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  /** Publish / unpublish without resending the whole record. */
  const handleTogglePublish = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !product.is_published }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setProducts(prev =>
          prev.map(entry => (entry.id === product.id ? { ...entry, ...data.product } : entry))
        );
      } else {
        alert(data.error || "Could not change publication status");
      }
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && p.is_published) ||
      (statusFilter === "draft" && !p.is_published);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Products</h1>
          <p className="mt-2 text-muted">Manage your product catalogue.</p>
        </div>
        <Link href="/admin/products/new">
          <Button icon={<PlusIcon />} iconPosition="left">
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-line">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full pl-10"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
              className="input w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-line">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="mx-auto h-8 w-8 animate-spin text-champagne" />
              <p className="mt-4 text-muted">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <PackageIcon className="mx-auto h-12 w-12 text-muted/50" />
              <h3 className="mt-4 text-lg font-medium text-charcoal">No products found</h3>
              <p className="mt-2 text-muted">Get started by adding your first product.</p>
              <Link href="/admin/products/new" className="mt-4 inline-block">
                <Button variant="primary" icon={<PlusIcon />} iconPosition="left">
                  Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface/50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Unit</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Updated</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-charcoal">{product.name}</p>
                          <p className="text-sm text-muted">/{product.slug}/</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {product.categories?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {composePriceLabel(product.price, product.currency, null) ?? "On consultation"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          product.is_published 
                            ? "bg-emerald/10 text-emerald" 
                            : "bg-amber/10 text-amber"
                        )}>
                          {product.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          product.unit
                            ? "bg-muted/10 text-charcoal"
                            : "bg-muted/10 text-muted"
                        )}>
                          {product.unit ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {product.updated_at
                          ? new Date(product.updated_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(product)}
                          >
                            {product.is_published ? "Unpublish" : "Publish"}
                          </Button>
                          <Link href={`/admin/products/${product.id}`}>
                            <Button variant="ghost" size="sm" icon={<EditIcon />} />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<TrashIcon />} 
                            onClick={() => handleDelete(product.id)}
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

function SearchIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" /></svg>;
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

function PackageIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
}