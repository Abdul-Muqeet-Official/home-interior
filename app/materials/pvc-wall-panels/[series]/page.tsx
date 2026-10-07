/**
 * app/materials/pvc-wall-panels/[series]/page.tsx
 *
 * Individual PVC Wall Panels series collection page.
 * Renders the shared MaterialCollection component with series-specific
 * editorial copy, statistics, and media.
 *
 * Data priority:
 *   1. Supabase category row (with media + editorial columns) when the series
 *      exists as a child category of "pvc-wall-panels".
 *   2. Code-defined PVC_SERIES fallback when Supabase is unavailable or the
 *      series has no DB row yet.
 *
 * Each series is independently addressable:
 *   /materials/pvc-wall-panels/aura-series
 *   /materials/pvc-wall-panels/regular-vol-1
 *   /materials/pvc-wall-panels/prestige
 *   /materials/pvc-wall-panels/royal-series
 *   /materials/pvc-wall-panels/enigma-series
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import EmptyState from "@/components/ui/EmptyState";
import MaterialCollection, {
  type CollectionCopy,
  type CollectionStats,
} from "@/components/ui/MaterialCollection";
import ProductGrid from "@/components/ui/ProductGrid";
import MediaFrame from "@/components/ui/MediaFrame";
import Reveal from "@/components/ui/Reveal";
import { PVC_SERIES } from "@/lib/content/pvc-wall-panels";
import { EMPTY_STATES } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";
import { getCategoryWithData, getProductsByCategory } from "@/lib/supabase/queries";
import type { CollectionMediaItem } from "@/lib/content/types";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = { params: { series: string } };

export async function generateStaticParams() {
  // Code-defined series are always prerendered so the build succeeds even
  // when Supabase is unreachable at build time.
  return PVC_SERIES.map((s) => ({ series: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dbData = await getCategoryWithData(params.series);
  const fallback = PVC_SERIES.find((s) => s.slug === params.series);

  const name =
    dbData?.editorial?.heading ??
    dbData?.category.name ??
    fallback?.name ??
    "Series not found";
  const description =
    dbData?.editorial?.lede ?? fallback?.description ?? null;

  return {
    title: `${name} | PVC Wall Panels`,
    description,
    alternates: { canonical: `/materials/pvc-wall-panels/${params.series}` },
  };
}

export default async function PVCSeriesPage({ params }: PageProps) {
  const dbData = await getCategoryWithData(params.series);
  const fallback = PVC_SERIES.find((s) => s.slug === params.series);

  if (!dbData && !fallback) notFound();

  // --- Name / description / metadata -----------------------------------
  const seriesName = dbData?.category.name ?? fallback!.name;
  const seriesDescription = dbData?.category.description ?? fallback!.description;
  const seriesSlug = dbData?.category.slug ?? fallback!.slug;

  // --- Editorial copy --------------------------------------------------
  const editorial = dbData?.editorial;
  const eyebrow = editorial?.eyebrow ?? fallback!.copy.eyebrow;
  const heading = editorial?.heading ?? fallback!.copy.heading;
  const lede = editorial?.lede ?? fallback!.copy.lede;
  const editHeading = editorial?.editHeading ?? fallback!.copy.editHeading;
  const editNote = editorial?.editNote ?? fallback!.copy.editNote;
  const railAria = editorial?.railAria ?? fallback!.copy.railAria;
  const coverImageAlt = editorial?.coverImageAlt ?? fallback!.coverAlt;

  // --- Media (reference photography) -----------------------------------
  // Prefer Supabase media when rows exist; otherwise use code-defined items.
  const collectionMedia: CollectionMediaItem[] = dbData?.media.length
    ? dbData.media
    : fallback!.items;

  // --- Stats -----------------------------------------------------------
  const collectionStats: CollectionStats = editorial?.stats
    ? editorial.stats
    : fallback!.stats;

  // --- Products --------------------------------------------------------
  // Series-specific products: when the category has a DB ID, query by that
  // ID; otherwise fall back to the parent "pvc-wall-panels" slug query.
  const products = dbData?.category
    ? await getProductsByCategory(seriesSlug)
    : await getProductsByCategory("pvc-wall-panels");

  const copy: CollectionCopy = {
    editHeading,
    editNote,
  };

  return (
    <main id="main">
      <section className="pb-14 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: "PVC Wall Panels", href: "/materials/pvc-wall-panels" },
              { label: seriesName },
            ]}
          />
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display-1 mt-5 text-charcoal">{heading}</h1>
            <p className="lede mt-6">{lede}</p>

            <dl className="mt-9 grid grid-cols-2 gap-6">
              <div>
                <dt className="eyebrow">Collection</dt>
                <dd className="mt-2 text-sm text-charcoal">
                  {products.length > 0
                    ? `${products.length} published product${products.length === 1 ? "" : "s"}`
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
              <Link href="/materials/pvc-wall-panels" className="btn btn-outline">
                ALL SERIES
              </Link>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7" delayMs={100}>
            <MediaFrame
              src={dbData?.category.artwork ?? fallback!.cover}
              alt={coverImageAlt}
              ratio="16 / 11"
              sizes="(max-width: 1024px) 92vw, 720px"
              priority
              className="rounded-card border border-line"
            />
          </Reveal>
        </div>
      </section>

      {products.length > 0 && (
        <section className="section bg-pure" aria-labelledby="collection-products">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Product collection</p>
                <h2 id="collection-products" className="display-3 mt-4 text-charcoal">
                  {seriesName} products
                </h2>
              </div>
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

      {collectionMedia.length > 0 && (
        <section className="section-tight border-y border-line" aria-labelledby="series-media">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">{`${seriesName} collection media`}</p>
                <h2 id="series-media" className="display-3 mt-4 text-charcoal">
                  Photographed as built.
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-muted">
                Reference photography published with this series. Product records and their
                rates sit in the product collection above.
              </p>
            </div>
            <div className="mt-12">
              <MaterialCollection
                items={collectionMedia}
                copy={copy}
                stats={collectionStats}
                railAria={railAria}
              />
            </div>
          </div>
        </section>
      )}

      {collectionMedia.length === 0 && products.length === 0 && (
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
