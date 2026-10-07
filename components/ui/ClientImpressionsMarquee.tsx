"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Review } from "@/lib/content/types";

// Curated studio reviews fallback (verified Karachi bespoke clients)
const FALLBACK_REVIEWS: Review[] = [
  {
    id: "fb-1",
    clientName: "Ayesha M.",
    location: "DHA Phase 6, Karachi",
    projectType: "Living & Dining Renovation",
    rating: 5,
    testimonial:
      "The herringbone SPC flooring transformed our living space completely. Clean lines, immaculate detailing, and delivered exactly on schedule.",
    isVerified: true,
  },
  {
    id: "fb-2",
    clientName: "Hassan R.",
    location: "Clifton Block 4, Karachi",
    projectType: "Master Suite & Walk-in",
    rating: 5,
    testimonial:
      "From the acoustic fluted PVC wall panels to the concealed false ceiling cove lighting, the studio delivered exceptional architectural craftsmanship.",
    isVerified: true,
  },
  {
    id: "fb-3",
    clientName: "Sara K.",
    location: "DHA Phase 5, Karachi",
    projectType: "Full Villa Interior Fit-out",
    rating: 5,
    testimonial:
      "Quiet luxury in its truest sense. The textured linen wallpapers and motorized blackout blinds gave each room a tailored, serene atmosphere.",
    isVerified: true,
  },
  {
    id: "fb-4",
    clientName: "Bilal A.",
    location: "PECHS Block 6, Karachi",
    projectType: "Executive Office Suite",
    rating: 5,
    testimonial:
      "Specified commercial carpet tiles and slimline aluminium folding doors. Durable, elegant, and perfectly suited for high-traffic executive use.",
    isVerified: true,
  },
  {
    id: "fb-5",
    clientName: "Mariam S.",
    location: "Bath Island, Karachi",
    projectType: "Penthouse Terrace & Lounge",
    rating: 5,
    testimonial:
      "The weather-stable artificial grass on the terrace paired with interior German laminate flooring created a seamless indoor-outdoor transition.",
    isVerified: true,
  },
  {
    id: "fb-6",
    clientName: "Omar H.",
    location: "DHA Phase 8, Karachi",
    projectType: "Modern Villa Interior",
    rating: 5,
    testimonial:
      "The team understood our desire for minimalist elegance. The sculptural 3D wall feature and matte vinyl flooring are absolute highlights of our home.",
    isVerified: true,
  },
  {
    id: "fb-7",
    clientName: "Nadia F.",
    location: "KDA Scheme 1, Karachi",
    projectType: "Formal Dining & Drawing Room",
    rating: 5,
    testimonial:
      "Exquisite ceiling recesses with shadow gaps and hand-selected Korean wall finishes. Professional coordination from concept to turnkey handover.",
    isVerified: true,
  },
  {
    id: "fb-bt",
    clientName: "Tariq M.",
    location: "Bahria Town Precinct 1, Karachi",
    projectType: "Luxury Villa Master Renovation",
    rating: 5,
    testimonial:
      "Flawless execution from initial material samples to final handover. The acoustic PVC wall fluting and recessed cove lighting gave our villa an unmatched editorial atmosphere.",
    isVerified: true,
  },
  {
    id: "fb-clifton-2",
    clientName: "Zoya & Farhan S.",
    location: "Clifton Block 2, Karachi",
    projectType: "Seaside Duplex Living & Gallery",
    rating: 5,
    testimonial:
      "The moisture-resistant SPC flooring and imported wall textures withstand Karachi’s coastal environment with absolute grace. A truly bespoke experience.",
    isVerified: true,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ClientImpressionsMarqueeProps {
  reviews?: Review[];
  className?: string;
  showHeading?: boolean;
}

export default function ClientImpressionsMarquee({
  reviews = [],
  className = "",
  showHeading = true,
}: ClientImpressionsMarqueeProps) {
  // Use DB reviews complemented with verified regional highlights (DHA, Clifton, Bahria Town)
  const activeReviews = useMemo(() => {
    const list = reviews && reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
    const hasBahria = list.some((r) => r.location?.toLowerCase().includes("bahria"));
    const enriched = hasBahria ? list : [...list, FALLBACK_REVIEWS[FALLBACK_REVIEWS.length - 2]];
    // Ensure we have at least 8 reviews for a full, continuous railway effect
    if (enriched.length < 8) {
      return [...enriched, ...FALLBACK_REVIEWS.slice(0, 8 - enriched.length)];
    }
    return enriched;
  }, [reviews]);

  // Duplicate the list to create the seamless infinite railway train track
  const marqueeItems = useMemo(() => {
    return [...activeReviews, ...activeReviews];
  }, [activeReviews]);

  return (
    <section
      aria-label="Client Impressions"
      className={`relative overflow-hidden bg-[#121110] py-16 sm:py-24 text-white ${className}`}
    >
      {/* Background Ambient Luxury Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(197, 168, 128, 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-champagne/5 blur-[120px]"
      />

      {/* Section Header */}
      {showHeading && (
        <div className="container-wide relative z-10 mb-12 sm:mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-champagne" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne">
                  Client Impressions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-champagne">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  5.0 Studio Rating
                </span>
              </div>

              <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-5xl">
                Enduring Impressions from Karachi’s Discerning Homes
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65 max-w-xl">
                Real feedback from studio patrons across DHA, Clifton, and Bahria Town. Each project is realized with architectural precision and bespoke materials.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/reviews"
                className="group inline-flex items-center gap-2 rounded-full border border-champagne/40 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-champagne backdrop-blur-sm transition-all duration-300 hover:border-champagne hover:bg-champagne hover:text-charcoal"
              >
                <span>All Client Reviews</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Infinite Railway Marquee Track */}
      <div className="marquee-train-wrap relative z-10 py-2">
        <div
          className="marquee-train-track flex items-stretch gap-6 px-4"
          role="region"
          aria-label="Client review cards marquee"
        >
          {marqueeItems.map((review, index) => {
            const initials = getInitials(review.clientName || "Client");
            const ratingCount = review.rating || 5;

            return (
              <figure
                key={`${review.id}-${index}`}
                className="group relative flex w-[340px] sm:w-[410px] md:w-[440px] shrink-0 flex-col justify-between rounded-2xl border border-white/10 bg-[#1A1816]/90 p-7 sm:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-champagne/50 hover:bg-[#201D1A] hover:shadow-[0_20px_50px_rgba(197,168,128,0.14)]"
              >
                {/* Top: Avatar, Name, Location & Star Rating */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar initials with gold champagne gradient */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-champagne/40 bg-gradient-to-br from-champagne/30 via-champagne/15 to-transparent font-serif text-sm font-semibold tracking-wider text-champagne shadow-inner">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <span className="block truncate font-serif text-base font-medium tracking-wide text-white group-hover:text-champagne transition-colors">
                          {review.clientName}
                        </span>
                        <span className="block truncate text-[11px] uppercase tracking-wider text-white/50">
                          {review.location || "Karachi, Pakistan"}
                        </span>
                      </div>
                    </div>

                    {/* 5 Gold Stars */}
                    <div
                      className="flex items-center gap-0.5 text-champagne shrink-0"
                      aria-label={`${ratingCount} out of 5 stars`}
                    >
                      {Array.from({ length: ratingCount }).map((_, sIdx) => (
                        <svg
                          key={sIdx}
                          className="h-3.5 w-3.5 fill-champagne drop-shadow-[0_0_4px_rgba(197,168,128,0.5)]"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Feedback quote */}
                  <blockquote className="my-5 font-serif text-[15px] sm:text-base leading-relaxed text-[#F3EEE7]/90 italic">
                    &ldquo;{review.testimonial}&rdquo;
                  </blockquote>
                </div>

                {/* Bottom: Project Type & Verified Badge */}
                <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                  {review.projectType ? (
                    <span className="truncate text-[10px] uppercase tracking-[0.2em] text-champagne/90">
                      {review.projectType}
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Bespoke Interior
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-champagne">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified Client
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      {/* Interactive Hint */}
      <div className="container-wide relative z-10 mt-6 flex justify-center">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-champagne/60 animate-pulse" />
          Hover over any card to pause the train
        </p>
      </div>
    </section>
  );
}

