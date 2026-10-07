"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminTagsPage() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch("/api/admin/tags");
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading tags");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add tag");
      }
      const data = await res.json();
      setTags(data.tags);
      setNewTag("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error adding tag");
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(oldName: string) {
    if (!editValue.trim() || editValue === oldName) {
      setEditingTag(null);
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: editValue }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to rename tag");
      }
      const data = await res.json();
      setTags(data.tags);
      setEditingTag(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error renaming tag");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Are you sure you want to delete tag "${name}"?`)) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete tag");
      }
      const data = await res.json();
      setTags(data.tags);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting tag");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Catalogue Taxonomy</span>
            <span className="text-muted">/</span>
            <span className="text-xs uppercase tracking-wider text-muted">Phase 4</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl lg:text-3xl text-charcoal">
            Secondary Tag System
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage secondary architectural attributes (e.g. waterproof, motorized, herringbone, acoustic).
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-lg border border-line bg-surface px-4 py-2 text-xs uppercase tracking-wider text-charcoal hover:border-champagne transition"
        >
          Assign in Products &rarr;
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Add New Tag Card */}
      <div className="rounded-card border border-line bg-surface p-6">
        <h2 className="font-serif text-lg text-charcoal">Create New Tag</h2>
        <p className="mt-1 text-xs text-muted">
          New tags automatically sanitize into lowercase hyphenated keys for URL compatibility.
        </p>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            required
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g. anti-bacterial, chevron, blackout"
            className="flex-1 rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-charcoal outline-none focus:border-champagne"
          />
          <button
            type="submit"
            disabled={saving || !newTag.trim()}
            className="rounded-lg bg-charcoal px-5 py-2.5 text-xs uppercase tracking-widest text-canvas hover:bg-charcoal/90 disabled:opacity-50 transition"
          >
            {saving ? "Adding…" : "Add Tag"}
          </button>
        </form>
      </div>

      {/* Tags List */}
      <div className="rounded-card border border-line bg-surface p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h2 className="font-serif text-lg text-charcoal">
            Registered Tags ({tags.length})
          </h2>
          <span className="text-xs text-muted">Available across all 11 categories</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading tags catalog…</div>
        ) : tags.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No tags defined yet.</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3.5 py-2.5 transition hover:border-sand"
              >
                {editingTag === tag ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded border border-line px-2 py-1 text-xs text-charcoal outline-none focus:border-champagne"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(tag)}
                      className="text-[11px] font-semibold text-charcoal hover:text-champagne px-1.5"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTag(null)}
                      className="text-[11px] text-muted hover:text-charcoal px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-mono text-xs text-charcoal">{tag}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTag(tag);
                          setEditValue(tag);
                        }}
                        className="text-[11px] text-muted hover:text-charcoal px-1"
                        title="Rename Tag"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag)}
                        className="text-[11px] text-red-600 hover:text-red-800 px-1"
                        title="Delete Tag"
                      >
                        &times;
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

