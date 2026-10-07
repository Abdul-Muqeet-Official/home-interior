import { ProjectForm } from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">New Project</h1>
          <p className="mt-2 text-muted">Add a new portfolio project.</p>
        </div>
      </div>

      <ProjectForm />
    </div>
  );
}