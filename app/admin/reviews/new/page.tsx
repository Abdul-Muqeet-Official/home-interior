import { ReviewForm } from "@/components/admin/ReviewForm";

export default function NewReviewPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">New Review</h1>
          <p className="mt-2 text-muted">Add a new client testimonial.</p>
        </div>
      </div>

      <ReviewForm />
    </div>
  );
}