import { ReviewForm } from "@/components/admin/ReviewForm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getReview(id: string) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export default async function EditReviewPage({ params }: PageProps) {
  const { id } = await params;
  const review = await getReview(id);

  if (!review) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">Edit Review</h1>
          <p className="mt-2 text-muted">Update testimonial details.</p>
        </div>
      </div>

      <ReviewForm initialData={review} isEditing />
    </div>
  );
}