/**
 * components/ui/CategoryCard.tsx
 * Materials & Products collection card. Server component.
 * Every card is a full link with a visible focus state and no placeholder content.
 */

import Link from "next/link";
import MediaFrame from "./MediaFrame";
import type { Category } from "@/lib/content/types";

export default function CategoryCard({
  category,
  href,
}: {
  category: Category;
  href?: string;
}) {
  const route = href ?? `/materials/${category.slug}`;
  return (
    <Link
      href={route}
      className="group block rounded-card focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-champagne focus-visible:ring-offset-2"
      aria-label={`${category.name} — explore the collection`}
    >
      <MediaFrame
        src={category.artwork}
        alt={`${category.name} material study`}
        ratio="4 / 5"
        sizes="(max-width: 640px) 74vw, (max-width: 1024px) 40vw, 320px"
        className="rounded-card border border-line transition-shadow duration-700 ease-editorial group-hover:shadow-soft"
        imageClassName="transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.04]"
        overlay="base"
        fallbackSrc="/media/texture-plaster.svg"
      >
        {/* Always-visible CTA — never gated behind hover. The pointer-events-none
            span keeps every click on the parent Link. */}
        <span className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white opacity-100 transition-opacity duration-500 ease-editorial group-hover:opacity-80">
          Explore collection
          <span aria-hidden="true">→</span>
        </span>
      </MediaFrame>

      <div className="mt-5">
        <p className="eyebrow">{category.meta}</p>
        <h3 className="mt-2 text-xl leading-snug text-charcoal">{category.name}</h3>
        <span className="link-editorial mt-3 text-champagne">
          Explore collection
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
