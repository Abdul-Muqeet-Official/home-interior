import React from "react";

interface SectionSkeletonProps {
  eyebrow?: string;
  heading?: string;
  cardCount?: number;
  compact?: boolean;
}

export default function SectionSkeleton({
  eyebrow = "Curated Collection",
  heading = "Loading Architectural Collections...",
  cardCount = 4,
  compact = false,
}: SectionSkeletonProps) {
  return (
    <section className="section section-surface animate-pulse" aria-busy="true">
      <div className="container-wide">
        <div className="max-w-2xl">
          <div className="h-4 w-32 bg-champagne/20 rounded mb-3" />
          <div className="h-8 w-72 bg-pearl/10 rounded mb-4" />
          <div className="h-4 w-full max-w-md bg-pearl/5 rounded" />
        </div>
      </div>
      <div className="container-wide mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: cardCount }).map((_, index) => (
            <div
              key={index}
              className={`rounded-editorial bg-charcoal/40 border border-stone/10 overflow-hidden flex flex-col ${
                compact ? "h-64" : "h-96"
              }`}
            >
              <div className="flex-1 bg-stone/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-pearl/10 rounded" />
                <div className="h-3 w-1/2 bg-pearl/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

