"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Thumb } from "@/components/admin/ui/Thumb";
import { cx } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  alt: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  project_id: string | null;
  product_id: string | null;
  created_at: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (data.media) setMedia(data.media);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "products");

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.media) {
          setMedia(prev => [data.media, ...prev]);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media file?")) return;
    
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const filteredMedia = media.filter(m => 
    filterType === "all" || m.type === filterType
  );

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Media Library</h1>
          <p className="mt-2 text-muted">Manage your images and videos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              className="sr-only"
              disabled={uploading}
            />
            <Button variant="secondary" icon={<UploadIcon />} iconPosition="left" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Files"}
            </Button>
          </label>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-line">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              {(["all", "image", "video"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cx(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    filterType === type
                      ? "bg-charcoal text-white"
                      : "bg-surface text-charcoal hover:bg-stone"
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted">{filteredMedia.length} items</span>
              <div className="flex border border-line rounded-full overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cx("p-2 transition-colors", viewMode === "grid" ? "bg-charcoal text-white" : "text-charcoal hover:bg-surface")}
                  aria-label="Grid view"
                >
                  <GridIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cx("p-2 transition-colors", viewMode === "list" ? "bg-charcoal text-white" : "text-charcoal hover:bg-surface")}
                  aria-label="List view"
                >
                  <ListIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card className="border-line">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="mx-auto h-8 w-8 animate-spin text-champagne" />
              <p className="mt-4 text-muted">Loading media...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted/50" />
              <h3 className="mt-4 text-lg font-medium text-charcoal">No media found</h3>
              <p className="mt-2 text-muted">Upload your first image or video.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredMedia.map(item => (
                  <MediaCard key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface/50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Preview</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">File</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Size</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Dimensions</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Assigned To</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredMedia.map(item => (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        {item.type === "image" ? (
                          <Thumb src={item.url} alt={item.alt || ""} className="h-16 w-16 rounded-lg object-cover border border-line" />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-surface border border-line flex items-center justify-center">
                            <VideoIcon className="h-8 w-8 text-muted" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-charcoal truncate max-w-xs">{item.url.split("/").pop()}</p>
                        {item.alt && <p className="text-sm text-muted">{item.alt}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                          item.type === "image"
                            ? "bg-blue/10 text-blue"
                            : "bg-purple/10 text-purple"
                        )}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">{formatSize(item.size)}</td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {item.width && item.height ? `${item.width}×${item.height}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {item.project_id ? `Project: ${item.project_id.slice(0, 8)}...` : item.product_id ? `Product: ${item.product_id.slice(0, 8)}...` : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<TrashIcon />} 
                          onClick={() => handleDelete(item.id)}
                          className="text-red hover:text-red"
                        />
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

function MediaCard({ item, onDelete }: { item: MediaItem; onDelete: (id: string) => void }) {
  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden border border-line bg-surface">
      {item.type === "image" ? (
        <Thumb src={item.url} alt={item.alt || ""} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-surface">
          <VideoIcon className="h-12 w-12 text-muted" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <div className="w-full flex justify-end gap-2">
          <Button variant="ghost" size="sm" className="bg-white/90 text-charcoal" icon={<TrashIcon />} onClick={() => onDelete(item.id)} />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex justify-between">
        <span className={cx(
          "px-2 py-1 rounded text-xs font-medium",
          item.type === "image"
            ? "bg-blue/90 text-white"
            : "bg-purple/90 text-white"
        )}>
          {item.type}
        </span>
        {item.width && item.height && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-black/60 text-white">
            {item.width}×{item.height}
          </span>
        )}
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
}

function GridIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>;
}

function ListIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
}

function ImageIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} /><circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 17" /></svg>;
}

function VideoIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>;
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