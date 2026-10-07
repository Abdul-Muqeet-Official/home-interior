/**
 * components/ui/FalseCeilingPreview.tsx
 * Homepage curated subset of the False Ceiling collection — a four-up grid of
 * stills (never the film) where every tile links to the canonical route.
 */

import Link from "next/link";
import MediaFrame from "./MediaFrame";
import { FALSE_CEILING_ROUTE, type FalseCeilingItem } from "@/lib/content/false-ceiling";

export default function FalseCeilingPreview({ items }: { items: FalseCeilingItem[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <Link
          key={item.id}
          href={FALSE_CEILING_ROUTE}
          className="group block rounded-card focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-champagne focus-visible:ring-offset-2"
          aria-label={`False Ceiling collection — ${item.caption}`}
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
