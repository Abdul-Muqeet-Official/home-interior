"use client";

import Link from "next/link";
import Rail from "./Rail";
import { EMPTY_STATES } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";
import type { Review } from "@/lib/content/types";

export default function ReviewsViewer({
  reviews,
  className,
}: {
  reviews: Review[];
  className?: string;
}) {
  /**
   * No published reviews yet. This is stated plainly and presented as an
   * intentional part of the dark editorial section — never as a broken widget,
   * and never with invented testimonials.
   */
  if (reviews.length === 0) {
    return (
      <div className={className}>
        <div className="border-y border-line-light py-10 sm:py-14">
          {/* The CLIENT REVIEWS eyebrow already opens this section upstream —
              repeating it here would say the same thing twice. */}
          <p className="max-w-2xl font-serif text-[1.75rem] leading-[1.2] text-white sm:text-4xl">
            {EMPTY_STATES.reviews.title}
          </p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/65">
            {EMPTY_STATES.reviews.body}
          </p>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/45">
            {EMPTY_STATES.reviews.note}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/consultation" className="btn btn-champagne">
              REQUEST A CONSULTATION
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light"
            >
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Rail
      ariaLabel="Client reviews"
      itemClassName="review-showroom-item"
      className={className}
      tone="dark"
      autoplayMs={4000}
    >
      {reviews.map((review) => (
        <figure
          key={review.id}
          className="flex h-full flex-col border-y border-line-light px-7 py-9 sm:px-9 sm:py-10"
        >
          {review.rating ? (
            <p
              className="text-[11px] tracking-[0.34em] text-champagne"
              aria-label={`Rated ${review.rating} out of 5`}
            >
              <span aria-hidden="true">{"★".repeat(review.rating)}</span>
            </p>
          ) : (
            <span aria-hidden="true" className="block h-[2px] w-10 bg-champagne/70" />
          )}

          <blockquote className="mt-6 flex-1 font-serif text-2xl leading-[1.28] text-white sm:text-[1.75rem]">
            &ldquo;{review.testimonial}&rdquo;
          </blockquote>

          <figcaption className="mt-8 border-t border-line-light pt-5">
            <span className="block text-sm text-white">{review.clientName}</span>
            {[review.projectType, review.location].filter(Boolean).length > 0 && (
              <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-white/55">
                {[review.projectType, review.location].filter(Boolean).join(" · ")}
              </span>
            )}
            {review.isVerified && (
              <span className="mt-4 inline-block border border-champagne/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-champagne">
                Verified client
              </span>
            )}
          </figcaption>
        </figure>
      ))}
    </Rail>
  );
}

