"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { cx } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  year: number | null;
  type: string | null;
  gallery_paths: string[] | null;
  hero_image_path: string | null;
  video_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Projects</h1>
          <p className="mt-2 text-muted">Manage your portfolio projects.</p>
        </div>
        <Link href="/admin/projects/new">
          <Button icon={<PlusIcon />} iconPosition="left">
            Add Project
          </Button>
        </Link>
      </div>

      {/* Projects Table */}
      <Card className="border-line">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="mx-auto h-8 w-8 animate-spin text-champagne" />
              <p className="mt-4 text-muted">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <FolderIcon className="mx-auto h-12 w-12 text-muted/50" />
              <h3 className="mt-4 text-lg font-medium text-charcoal">No projects found</h3>
              <p className="mt-2 text-muted">Add your first portfolio project.</p>
              <Link href="/admin/projects/new" className="mt-4 inline-block">
                <Button variant="primary" icon={<PlusIcon />} iconPosition="left">
                  Add Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface/50">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Project</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Media</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Featured</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">Order</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-charcoal">{project.title}</p>
                          <p className="text-sm text-muted">/{project.slug}/</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {project.location || "—"}
                        {project.year && ` • ${project.year}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {project.type || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(project.gallery_paths?.length || 0) > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs text-muted bg-surface border border-line">
                              {project.gallery_paths!.length} images
                            </span>
                          )}
                          {project.video_url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs text-champagne bg-champagne/10 border border-champagne/20">
                              Video
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          project.is_published 
                            ? "bg-emerald/10 text-emerald" 
                            : "bg-amber/10 text-amber"
                        )}>
                          {project.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          project.is_featured
                            ? "bg-champagne/20 text-champagne-dark"
                            : "bg-muted/10 text-muted"
                        )}>
                          {project.is_featured ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal">
                        {project.sort_order}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/projects/${project.id}`}>
                            <Button variant="ghost" size="sm" icon={<EditIcon />} />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<TrashIcon />} 
                            onClick={() => handleDelete(project.id)}
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

function FolderIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
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