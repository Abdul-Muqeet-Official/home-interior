import { ProjectForm } from "@/components/admin/ProjectForm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProject(id: string) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Edit Project</h1>
          <p className="mt-2 text-muted">Update project details.</p>
        </div>
      </div>

      <ProjectForm
        initialData={{
          ...project,
          category: project.type,
          images: project.gallery_paths ?? [],
          video_urls: Array.isArray(project.video_paths) ? project.video_paths : [],
          video_poster: project.video_poster_path,
          featured: project.is_featured,
          published: project.is_published,
        }}
        isEditing
      />
    </div>
  );
}