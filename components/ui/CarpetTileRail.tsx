import Link from "next/link";
import MediaFrame from "./MediaFrame";
import type { CarpetTileCollection } from "@/lib/supabase/queries";

/**
 * components/ui/CarpetTileRail.tsx
 *
 * The editorial collection rail for Carpet Tile.
 *
 * One item per collection — nothing is hidden — laid out as a horizontal editorial
 * rail on large screens and a single column on small screens. Every frame has a stable
 * 1:1 ratio so the rail never reflows as covers resolve.
 */
export default function CarpetTileRail({
  collections,
  priorityCount = 0,
}: {
  collections: CarpetTileCollection[];
  priorityCount?: number;
}) {
  return (
    <ul
      className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12 lg:overflow-visible lg:px-0 xl:grid-cols-4"
      aria-label="Carpet Tile collections"
    >
      {collections.map((collection, index) => (
        <li
          key={collection.id}
          className="w-[74vw] shrink-0 snap-start sm:w-[46vw] lg:w-auto"
        >
          <Link
            href={`/materials/carpet-tile/${collection.slug}`}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-4 focus-visible:ring-offset-pure"
          >
            <MediaFrame
              src={collection.cover?.src ?? "/media/materials/carpet-tile.svg"}
              alt={`${collection.name} carpet tile catalogue cover`}
              ratio="1 / 1"
              sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, (max-width: 1280px) 30vw, 22vw"
              priority={index < priorityCount}
              className="border border-line"
              imageClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
            />
            <p className="eyebrow mt-5">
              {String(collection.pageCount).padStart(2, "0")} pages
            </p>
            <h3 className="mt-2 break-words text-lg leading-snug text-charcoal sm:text-xl">
              {collection.name}
            </h3>
            <span className="link-editorial mt-3 inline-block text-champagne">
              View collection <span aria-hidden="true">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
