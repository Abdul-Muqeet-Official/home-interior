/**
 * app/materials/pvc-wall-panels/page.tsx
 *
 * Parent collection for PVC Wall Panels. Presents the five series as separate
 * cards — each linking to its own series route. PVC Wall Panels is the only
 * category that uses this parent-child hierarchy; all other categories render
 * through the shared dynamic /materials/[category] route.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CategoryCard from "@/components/ui/CategoryCard";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import Reveal from "@/components/ui/Reveal";
import { PVC_WALL_PANELS_COPY, PVC_SERIES } from "@/lib/content/pvc-wall-panels";
import type { Category } from "@/lib/content/types";
import { CATEGORY_ARTWORK } from "@/lib/content/media";
import { getCategoryWithData, getSubCategories } from "@/lib/supabase/queries";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  const dbData = await getCategoryWithData("pvc-wall-panels");
  const editorial = dbData?.editorial;
  const name = editorial?.heading ?? dbData?.category.name ?? PVC_WALL_PANELS_COPY.heading;
  const description =
    editorial?.lede ?? dbData?.category.description ?? PVC_WALL_PANELS_COPY.lede;
  const artwork = dbData?.category.artwork ?? CATEGORY_ARTWORK["pvc-wall-panels"];

  return {
    title: name,
    description,
    alternates: { canonical: "/materials/pvc-wall-panels" },
    openGraph: {
      title: name,
      description,
      images: artwork ? [{ url: artwork }] : undefined,
    },
  };
}

export default async function PVCWallPanelsPage() {
  const [dbData, seriesCategories] = await Promise.all([
    getCategoryWithData("pvc-wall-panels"),
    getSubCategories("pvc-wall-panels"),
  ]);

  const hasSeriesFromDb = seriesCategories.length > 0;

  // Parent editorial data from Supabase with code-defined fallback.
  const parentName = dbData?.category.name ?? "PVC Wall Panels";
  const parentDescription = dbData?.category.description ?? PVC_WALL_PANELS_COPY.lede;
  const parentMeta = dbData?.category.meta ?? "Wall · Cladding";
  const parentArtwork =
    dbData?.category.artwork ?? CATEGORY_ARTWORK["pvc-wall-panels"];
  const parentEyebrow =
    dbData?.editorial?.eyebrow ?? PVC_WALL_PANELS_COPY.eyebrow;
  const parentHeading = dbData?.editorial?.heading ?? PVC_WALL_PANELS_COPY.heading;
  const parentLede = dbData?.editorial?.lede ?? PVC_WALL_PANELS_COPY.lede;
  const seriesCount = hasSeriesFromDb
    ? seriesCategories.length
    : PVC_SERIES.length;

  // Series list from Supabase has precedence; fall back to code-defined PVC_SERIES.
  // Both branches produce Category[] so the card rendering is unified.
  const seriesList: Category[] = hasSeriesFromDb
    ? seriesCategories
    : PVC_SERIES.map((s, index) => ({
        slug: s.slug,
        name: s.name,
        description: s.description,
        meta: "PVC · Series",
        artwork: s.cover,
        tone: (["champagne", "stone", "graphite"] as const)[index % 3],
        sortOrder: index + 1,
        productCount: 0,
        collectionMedia: s.items,
        source: "studio-catalogue" as const,
        parentId: null,
      }));

  return (
    <main id="main">
      <section className="pb-14 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: parentName },
            ]}
          />
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{parentEyebrow}</p>
            <h1 className="display-1 mt-5 text-charcoal">{parentHeading}</h1>
            <p className="lede mt-6">{parentLede}</p>

            <dl className="mt-9 grid grid-cols-2 gap-6">
              <div>
                <dt className="eyebrow">Series</dt>
                <dd className="mt-2 text-sm text-charcoal">{seriesCount} collections</dd>
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
              src={parentArtwork}
              alt={dbData?.editorial?.coverImageAlt ?? `${parentName} — studio material study`}
              ratio="16 / 11"
              sizes="(max-width: 1024px) 92vw, 720px"
              priority
              className="rounded-card border border-line"
            />
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="pvc-series">
        <div className="container-wide">
          <div className="mb-12">
            <p className="eyebrow">Series</p>
            <h2 id="pvc-series" className="display-3 mt-4 text-charcoal">
              Five collections
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {seriesList.map((series) => (
              <CategoryCard
                key={series.slug}
                category={series}
                href={`/materials/pvc-wall-panels/${series.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <ConsultationCTA />
    </main>
  );
}

