/**
 * app/materials/carpet-tile/[collection]/page.tsx
 *
 * A single Carpet Tile collection: its cover, its source filename, its page count and
 * the full rendered catalogue behind the premium viewer.
 *
 * Only facts present in the source data are shown. No price, composition, fire rating,
 * acoustic rating, warranty, manufacturer or certification is invented — where a fact
 * is not in the catalogue, it is simply not stated.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CatalogueViewer from "@/components/ui/CatalogueViewer";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import SectionHeading from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site.config";
import { getCarpetTileCollection } from "@/lib/supabase/queries";

export const revalidate = 300;

type Props = { params: { collection: string } };

export async function generateStaticParams() {
  // Slugs are validated in the data layer; a bad slug simply yields an empty list.
  const { getCarpetTileCollections } = await import("@/lib/supabase/queries");
  const collections = await getCarpetTileCollections();
  return collections.map((entry) => ({ collection: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCarpetTileCollection(params.collection);
  if (!collection) {
    return { title: "Carpet Tile Collection", robots: { index: false, follow: false } };
  }
  const description = `${collection.name} — carpet tile catalogue collection from the HOME INTERIOR studio library, ${collection.pageCount} rendered pages.`;
  return {
    title: `${collection.name} Carpet Tile Collection`,
    description,
    alternates: { canonical: `/materials/carpet-tile/${collection.slug}` },
    openGraph: {
      title: `${collection.name} — Carpet Tile | HOME INTERIOR`,
      description,
      url: `/materials/carpet-tile/${collection.slug}`,
      type: "article",
      images: collection.cover ? [{ url: collection.cover.src }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.name} — Carpet Tile | HOME INTERIOR`,
      description,
      images: collection.cover ? [collection.cover.src] : undefined,
    },
  };
}


export default async function CarpetTileCollectionPage({ params }: Props) {
  const collection = await getCarpetTileCollection(params.collection);
  if (!collection) notFound();

  return (
    <main id="main">
      <section className="pb-12 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: "Carpet Tile", href: "/materials/carpet-tile" },
              { label: collection.name },
            ]}
          />

          <div className="mt-10 grid items-end gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="eyebrow">Carpet tile · collection</p>
              <h1 className="display-1 mt-6 break-words text-charcoal">{collection.name}</h1>

              <dl className="mt-9 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="eyebrow">Catalogue pages</dt>
                  <dd className="mt-2 font-display text-2xl text-charcoal">
                    {String(collection.pageCount).padStart(2, "0")}
                  </dd>
                </div>
                {collection.sourceFilename && (
                  <div className="min-w-0">
                    <dt className="eyebrow">Source file</dt>
                    <dd className="mt-2 break-words text-sm text-muted">
                      {collection.sourceFilename}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a href="#catalogue" className="btn btn-solid">
                  VIEW CATALOGUE
                  <span aria-hidden="true">↓</span>
                </a>
                <Link href="/consultation" className="btn btn-outline">
                  REQUEST SPECIFICATION
                </Link>
                <a
                  href={SITE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  WHATSAPP
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <MediaFrame
                src={collection.cover?.src ?? "/media/materials/carpet-tile.svg"}
                alt={`${collection.name} carpet tile catalogue cover`}
                ratio="1 / 1"
                sizes="(max-width: 1024px) 92vw, 40vw"
                priority
                className="border border-line"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalogue"
        className="section scroll-mt-24 bg-pure"
        aria-labelledby="catalogue-heading"
      >
        <div className="container-wide">
          <SectionHeading
            id="catalogue-heading"
            eyebrow="Rendered catalogue"
            heading="Catalogue pages"
            description="Select any page to open the full-size viewer."
          />
          <div className="mt-14">
            <CatalogueViewer
              items={collection.media}
              title={collection.name}
              label={`${collection.name} carpet tile catalogue pages`}
            />
          </div>
        </div>
      </section>

      <ConsultationCTA />
    </main>
  );
}
