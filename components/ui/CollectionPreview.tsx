/**
 * components/ui/CollectionPreview.tsx
 * Generic homepage preview grid for any material collection.
 * Shows a curated subset of stills (never video) where every tile links to the
 * canonical collection route. Replaces the FalseCeiling-specific preview.
 */

import Link from "next/link";
import MediaFrame from "./MediaFrame";
import type { CollectionMediaItem } from "@/lib/content/types";

export default function CollectionPreview({
  items,
  route,
  collectionName,
}: {
  items: CollectionMediaItem[];
  route: string;
  collectionName: string;
}) {
  const stills = items.filter((item) => item.type === "image");
  if (stills.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stills.map((item, index) => (
        <Link
          key={item.id}
          href={route}
          className="group block rounded-card focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-champagne focus-visible:ring-offset-2"
          aria-label={`${collectionName} collection — ${item.caption}`}
        >
          <MediaFrame
            src={item.src}
            alt={item.alt}
            ratio="4 / 5"
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 340px"
            className="rounded-card border border-line transition-shadow duration-700 ease-editorial group-hover:shadow-soft"
            imageClassName="transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.04]"
            overlay="base"
          >
            <span className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white opacity-100 transition-opacity duration-500 ease-editorial group-hover:opacity-80">
              {String(index + 1).padStart(2, "0")}
              <span aria-hidden="true">→</span>
            </span>
          </MediaFrame>
          <p className="mt-4 text-sm leading-relaxed text-muted transition-colors group-hover:text-charcoal">
            {item.caption}
          </p>
        </Link>
      ))}
    </div>
  );
}
