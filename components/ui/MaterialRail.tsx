/**
 * components/ui/MaterialRail.tsx
 * Materials & Products collection rail. Server component that hands fully rendered
 * cards to the client-side Rail controller.
 */

import CategoryCard from "./CategoryCard";
import Rail from "./Rail";
import type { Category } from "@/lib/content/types";

export default function MaterialRail({
  categories,
  autoplayMs = 3000,
}: {
  categories: Category[];
  autoplayMs?: number;
}) {
  return (
    <div className="rail-fade">
      <Rail
        ariaLabel="Materials and products collections"
        itemClassName="w-[74vw] max-w-[330px] sm:w-[300px] lg:w-[320px]"
        autoplayMs={autoplayMs}
      >
        {categories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </Rail>
    </div>
  );
}