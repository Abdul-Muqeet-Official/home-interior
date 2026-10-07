"use client";

import { useState } from "react";
import GlassButton from "./GlassButton";

export default function AddReviewForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      projectType: formData.get("projectType"),
      review: formData.get("review"),
      consent: formData.get("consent") === "on",
    };

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit review");
      }

      setStatus("success");
    } catch (err: unknown) {
      console.error("Submission error:", err);
      setStatus("error");
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center text-white">
        <h3 className="mb-2 text-xl font-light tracking-wide text-champagne">Thank You</h3>
        <p className="text-white/80">Your review is pending moderation.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 sm:p-8 text-white shadow-xl backdrop-blur-sm">
      <h3 className="mb-6 text-2xl font-light tracking-wide text-champagne">Add Your Review</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm tracking-widest text-white/70 uppercase">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/30 focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne transition-colors"
              placeholder="Jane Doe"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="projectType" className="text-sm tracking-widest text-white/70 uppercase">
              Project Type
            </label>
            <input
              id="projectType"
              name="projectType"
              type="text"
              required
              className="w-full rounded border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/30 focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne transition-colors"
              placeholder="e.g. Living Room Redesign"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="review" className="text-sm tracking-widest text-white/70 uppercase">
            Review
          </label>
          <textarea
            id="review"
            name="review"
            required
            rows={5}
            className="w-full resize-none rounded border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/30 focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne transition-colors"
            placeholder="Share your experience working with HOME INTERIOR..."
          />
        </div>

        <div className="flex items-start gap-3 mt-2">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-champagne focus:ring-champagne focus:ring-offset-charcoal"
          />
          <label htmlFor="consent" className="text-sm text-white/70">
            I agree to let HOME INTERIOR publish this review
          </label>
        </div>

        {status === "error" && (
          <p className="text-sm text-red-400">{errorMessage}</p>
        )}

        <div className="mt-4 flex justify-end">
          <GlassButton
            type="submit"
            variant="champagne"
            loading={status === "submitting"}
          >
            Submit Review
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
