/**
 * components/ui/ReviewsWindow.tsx
 * CLIENT IMPRESSIONS — dark, full-width horizontal running review window.
 * Reviews are read from Supabase only. When none are published, the section states
 * exactly that instead of inventing testimonials.
 */

import Rail from "./Rail";
import { EMPTY_STATES } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";
import type { Review } from "@/lib/content/types";

export default function ReviewsWindow({
  reviews,
  limit,
}: {
  reviews: Review[];
  limit?: number;
}) {
  const list = typeof limit === "number" ? reviews.slice(0, limit) : reviews;

  if (list.length === 0) {
    return (
      <div className="on-dark rounded-card border border-line-light bg-dark px-8 py-14 text-center sm:px-14 sm:py-20">
        <p className="eyebrow text-champagne">{EMPTY_STATES.reviews.title}</p>
        <p className="lede mx-auto mt-6 max-w-xl text-white/65">{EMPTY_STATES.reviews.body}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-champagne"
          >
            WHATSAPP
            <span aria-hidden="true">→</span>
          </a>
          <a href={SITE.phoneHref} className="btn btn-outline-light">
            CALL THE STUDIO
          </a>
        </div>
      </div>
    );
  }

  return (
    <Rail
      ariaLabel="Client impressions"
      itemClassName="w-[86vw] sm:w-[480px] lg:w-[540px]"
      tone="dark"
    >
      {list.map((review) => (
        <figure
          key={review.id}
          className="flex h-full flex-col rounded-card border border-line-light bg-dark/70 p-8 sm:p-10"
        >
          {review.rating && (
            <p className="text-champagne" aria-label={`Rated ${review.rating} out of 5`}>
              <span aria-hidden="true">{"★".repeat(review.rating)}</span>
            </p>
          )}

          <blockquote className="mt-6 flex-1 font-serif text-xl leading-relaxed text-white/90 sm:text-2xl">
            “{review.testimonial}”
          </blockquote>

          <figcaption className="mt-8 border-t border-line-light pt-5">
            <span className="block text-sm text-white">{review.clientName}</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-white/55">
              {[review.projectType, review.location].filter(Boolean).join(" · ")}
            </span>
            {review.isVerified && (
              <span className="mt-4 inline-block rounded-full border border-champagne/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-champagne">
                Verified client
              </span>
            )}
          </figcaption>
        </figure>
      ))}
    </Rail>
  );
}
