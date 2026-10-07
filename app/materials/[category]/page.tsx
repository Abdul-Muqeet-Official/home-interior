/**
 * app/materials/[category]/page.tsx
 * Category collection: breadcrumb, editorial header, product grid, sibling collections.
 * Legacy short slugs (e.g. /materials/spc) resolve to the canonical collection.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryCard from "@/components/ui/CategoryCard";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import EmptyState from "@/components/ui/EmptyState";
import MaterialCollection, {
  type CollectionCopy,
  type CollectionStats,
} from "@/components/ui/MaterialCollection";
import type { CollectionMediaItem } from "@/lib/content/types";
import MediaFrame from "@/components/ui/MediaFrame";
import ProductGrid from "@/components/ui/ProductGrid";
import Rail from "@/components/ui/Rail";
import Reveal from "@/components/ui/Reveal";
import {
  STUDIO_CATEGORY_SLUGS,
  findStudioCategory,
  resolveCategorySlug,
} from "@/lib/content/catalog";
import { EMPTY_STATES } from "@/lib/content/editorial";
import {
  FALSE_CEILING_COPY,
  FALSE_CEILING_STATS,
} from "@/lib/content/false-ceiling";
import {
  ARTIFICIAL_GRASS_COPY,
  ARTIFICIAL_GRASS_STATS,
} from "@/lib/content/artificial-grass";
import {
  FOLDING_DOORS_COPY,
  FOLDING_DOORS_STATS,
} from "@/lib/content/folding-doors";
import { SITE } from "@/lib/site.config";
import { getCategories, getCategoryWithData, getProductsByCategory, getSubCategories } from "@/lib/supabase/queries";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = { params: { category: string } };

export function generateStaticParams() {
  // `carpet-tile` has its own static route (app/materials/carpet-tile), which serves
  // the real imported catalogue. Pre-rendering it here as well would be a route
  // conflict, so the dedicated landing page owns that slug.
  return STUDIO_CATEGORY_SLUGS.filter((category) => category !== "carpet-tile").map(
    (category) => ({ category })
  );
}

export function generateMetadata({ params }: PageProps): Metadata {
  const canonical = resolveCategorySlug(params.category);
  const studio = canonical ? findStudioCategory(canonical) : null;
  const name = studio?.name ?? "Collection";

  return {
    title: name,
    description:
      studio?.description ??
      "Studio collection of interior materials and architectural finishes in Karachi.",
    alternates: { canonical: `/materials/${canonical ?? params.category}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const canonical = resolveCategorySlug(params.category);
  const requestedSlug = canonical ?? params.category.toLowerCase().trim();

  const [products, dbData, categories, subcategories] = await Promise.all([
    getProductsByCategory(requestedSlug),
    getCategoryWithData(requestedSlug),
    getCategories(),
    getSubCategories(requestedSlug),
  ]);

  const studioCategory = categories.find((entry) => entry.slug === requestedSlug);
  const category = dbData ? dbData.category : studioCategory;
  if (!category) notFound();

  // Prefer Supabase media when present; fall back to the code-defined collectionMedia.
  const collectionMedia = dbData?.media.length ? dbData.media : category.collectionMedia;

  // Prefer Supabase editorial copy/stats; fall back to code-defined lookup tables.
  const editorial = dbData?.editorial;
  const collectionCopy: CollectionCopy = editorial
    ? {
        editHeading: editorial.editHeading ?? "",
        editNote: editorial.editNote ?? "",
      }
    : (COLLECTION_COPY[category.slug] ?? genericCopy({ name: category.name, collectionMedia }));
  const collectionStats: CollectionStats = editorial?.stats
    ? editorial.stats
    : (COLLECTION_STATS[category.slug] ?? genericStats({ collectionMedia }));
  const railAria = editorial?.railAria ?? `${category.name} collection — stills and walkthrough film`;

  const siblings = categories.filter((entry) => entry.slug !== category.slug).slice(0, 8);

  return (
    <main id="main">
      <section className="pb-14 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: category.name },
            ]}
          />
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{category.meta}</p>
            <h1 className="display-1 mt-5 text-charcoal">{category.name}</h1>
            <p className="lede mt-6">{category.description}</p>

            <dl className="mt-9 grid grid-cols-2 gap-6">
              <div>
                <dt className="eyebrow">Collection</dt>
                <dd className="mt-2 text-sm text-charcoal">
                  {category.productCount > 0
                    ? `${category.productCount} published product${category.productCount === 1 ? "" : "s"}`
                    : "Catalogue in preparation"}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">HOME INTERIOR</dt>
                <dd className="mt-2 text-sm text-charcoal">DHA Phase 5, Karachi</dd>
              </div>
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/consultation" className="btn btn-solid">
                REQUEST A CONSULTATION
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/materials" className="btn btn-outline">
                ALL COLLECTIONS
              </Link>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7" delayMs={100}>
            <MediaFrame
              src={category.artwork}
              alt={editorial?.coverImageAlt ?? `${category.name} — studio material study`}
              ratio="16 / 11"
              sizes="(max-width: 1024px) 92vw, 720px"
              priority
              className="rounded-card border border-line"
            />
          </Reveal>
        </div>
      </section>

      {subcategories.length > 0 && (
        <section className="section bg-pure" aria-labelledby="sub-collections">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">{category.name} Collections</p>
                <h2 id="sub-collections" className="display-3 mt-4 text-charcoal">
                  Explore the series
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                Curated collections and specifications within {category.name}.
              </p>
            </div>
            <div className="mt-12">
              <Rail
                ariaLabel={`${category.name} collections`}
                itemClassName="w-[74vw] max-w-[330px] sm:w-[300px] lg:w-[320px]"
              >
                {subcategories.map((entry) => (
                  <CategoryCard
                    key={entry.slug}
                    category={entry}
                    href={`/materials/${category.slug}/${entry.slug}`}
                  />
                ))}
              </Rail>
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="section bg-pure border-t border-line/40" aria-labelledby="collection-products">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Product collection</p>
                <h2 id="collection-products" className="display-3 mt-4 text-charcoal">
                  {category.name} products
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                Product codes, finishes and availability are confirmed against the studio sample
                library at consultation.
              </p>
            </div>

            <ProductGrid
              products={products}
              className="mt-12"
              emptyTitle={EMPTY_STATES.products.title}
              emptyBody={EMPTY_STATES.products.body}
            />
          </div>
        </section>
      )}

      {subcategories.length === 0 && products.length === 0 && collectionMedia.length === 0 && (
        <section className="section bg-pure border-t border-line">
          <div className="container-wide">
            <EmptyState
              eyebrow={category.name}
              title="Catalogue selections are being curated"
              body="New collections and material finishes for this category are currently being prepared for studio display. Contact us or book a consultation below to review site samples."
              actions={[{ label: "Request consultation", href: "/consultation" }]}
            />
          </div>
        </section>
      )}

      {collectionMedia.length > 0 && (
        <section className="section-tight border-y border-line" aria-labelledby="collection-media">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">{`${category.name} collection media`}</p>
                <h2 id="collection-media" className="display-3 mt-4 text-charcoal">
                  Photographed as built.
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                Reference photography published with this collection. Product records and their
                rates sit in the product collection above.
              </p>
            </div>
            <div className="mt-12">
              <MaterialCollection
                items={collectionMedia}
                copy={collectionCopy}
                stats={collectionStats}
                railAria={railAria}
              />
            </div>
          </div>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="section" aria-labelledby="sibling-collections">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 id="sibling-collections" className="display-3 text-charcoal">
                Continue through the catalogue
              </h2>
              <Link href="/materials" className="link-editorial">
                All collections
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="container-wide mt-12">
            <Rail
              ariaLabel="Other studio collections"
              itemClassName="w-[74vw] max-w-[330px] sm:w-[300px] lg:w-[320px]"
            >
              {siblings.map((entry) => (
                <CategoryCard key={entry.slug} category={entry} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {(products.length === 0 && subcategories.length === 0) && (
        <section className="pb-20">
          <div className="container-wide">
            <EmptyState
              eyebrow="Sample library"
              title="See the collection in person"
              body="Samples, technical data sheets and current availability are maintained at the studio in DHA Phase 5. Book a private viewing and we will set the full range out for you."
              actions={[
                { label: "BOOK A VIEWING", href: "/consultation" },
                {
                  label: "WHATSAPP",
                  href: SITE.whatsappUrl,
                  variant: "outline",
                  external: true,
                },
              ]}
            />
          </div>
        </section>
      )}

      <ConsultationCTA />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Per-collection editorial copy and stats lookup                      */
/* ------------------------------------------------------------------ */

const COLLECTION_COPY: Record<string, CollectionCopy> = {
  "false-ceiling": {
    editHeading: FALSE_CEILING_COPY.editHeading,
    editNote: FALSE_CEILING_COPY.editNote,
  },
  "artificial-grass": {
    editHeading: ARTIFICIAL_GRASS_COPY.editHeading,
    editNote: ARTIFICIAL_GRASS_COPY.editNote,
  },
  "folding-doors": {
    editHeading: FOLDING_DOORS_COPY.editHeading,
    editNote: FOLDING_DOORS_COPY.editNote,
  },
};

const COLLECTION_STATS: Record<string, CollectionStats> = {
  "false-ceiling": FALSE_CEILING_STATS,
  "artificial-grass": ARTIFICIAL_GRASS_STATS,
  "folding-doors": FOLDING_DOORS_STATS,
};

function genericCopy(category: { name: string; collectionMedia: CollectionMediaItem[] }): CollectionCopy {
  return {
    editHeading: "The edit",
    editNote: `Reference photography published with the ${category.name} collection.`,
  };
}

function genericStats(category: { collectionMedia: CollectionMediaItem[] }): CollectionStats {
  return {
    photographs: category.collectionMedia.filter((i) => i.type === "image").length,
    films: category.collectionMedia.filter((i) => i.type === "video").length,
    sourceFrames: category.collectionMedia.length,
  };
}
