/**
 * app/materials/carpet-tile/page.tsx
 *
 * CARPET TILE — the editorial catalogue landing page.
 *
 * Every collection, cover and page count is read live from Supabase. The hero image is
 * a real published catalogue cover from the imported library, so no stock or unrelated
 * artwork is ever shown.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CarpetTileRail from "@/components/ui/CarpetTileRail";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import SectionHeading from "@/components/ui/SectionHeading";
import { SITE, SITE_URL } from "@/lib/site.config";
import {
  getCarpetTileCollections,
  type CarpetTileCollection,
} from "@/lib/supabase/queries";

export const revalidate = 300;

/**
 * A real published cover doubles as the social card. A collection always has one, so
 * the page never ships a placeholder social image.
 */
function socialImageFor(collections: CarpetTileCollection[]): string {
  const cover = collections.find((entry) => entry.cover)?.cover;
  if (cover) return cover.src;
  return `${SITE_URL}/media/materials/carpet-tile.svg`;
}

export async function generateMetadata(): Promise<Metadata> {
  const collections = await getCarpetTileCollections();
  const description =
    "Carpet tile catalogue collections from the HOME INTERIOR studio library, rendered page by page from the supplied source catalogues.";
  return {
    title: "Carpet Tile Catalogues",
    description,
    alternates: { canonical: "/materials/carpet-tile" },
    openGraph: {
      title: "Carpet Tile Catalogues — HOME INTERIOR",
      description,
      url: "/materials/carpet-tile",
      type: "website",
      images: [socialImageFor(collections)],
    },
    twitter: {
      card: "summary_large_image",
      title: "Carpet Tile Catalogues — HOME INTERIOR",
      description,
      images: [socialImageFor(collections)],
    },
  };
}

export default async function CarpetTilePage() {
  const collections = await getCarpetTileCollections();
  const totalPages = collections.reduce((sum, item) => sum + item.pageCount, 0);
  const hero = collections[0] ?? null;

  return (
    <main id="main">
      <section className="pb-14 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: "Carpet Tile" },
            ]}
          />

          {/* Top-aligned rather than `items-end`: bottoming the short text column against
              a tall 4:5 cover left a large dead zone above the headline on desktop. */}
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="eyebrow">Carpet Tile</p>
              <h1 className="display-1 mt-6 text-charcoal">CARPET TILE</h1>
              <p className="lede mt-7 max-w-xl">
                A material library of modular carpet tile, presented collection by
                collection and page by page exactly as the studio received it.
              </p>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
                Every collection below is rendered directly from its source catalogue, so
                colour, texture and pattern are shown as printed — nothing is redrawn,
                recoloured or substituted.
              </p>

              {collections.length > 0 && (
                <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
                  <div>
                    <dt className="eyebrow">Collections</dt>
                    <dd className="mt-2 font-display text-3xl text-charcoal">
                      {collections.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Catalogue pages</dt>
                    <dd className="mt-2 font-display text-3xl text-charcoal">
                      {totalPages}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="lg:col-span-5">
              <MediaFrame
                src={hero?.cover?.src ?? "/media/materials/carpet-tile.svg"}
                alt={
                  hero
                    ? `${hero.name} carpet tile catalogue cover`
                    : "Carpet tile material texture"
                }
                ratio="4 / 5"
                sizes="(max-width: 1024px) 92vw, 40vw"
                priority
                className="border border-line"
                note={hero ? hero.name : null}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-pure" aria-labelledby="carpet-collections-heading">
        <div className="container-wide">
          <SectionHeading
            id="carpet-collections-heading"
            eyebrow="Carpet tile collections"
            heading="CARPET TILE COLLECTIONS"
            description="Select a collection to open its rendered catalogue."
          />

          {collections.length === 0 ? (
            <div className="mt-12 border-t border-line pt-10">
              <h3 className="text-xl text-charcoal">
                Carpet tile catalogues are being curated.
              </h3>
              <p className="mt-3 max-w-xl text-sm text-muted">
                Published carpet tile collections will appear here as they are approved
                for the studio library.
              </p>
            </div>
          ) : (
            <div className="mt-14">
              <CarpetTileRail collections={collections} priorityCount={0} />
            </div>
          )}
        </div>
      </section>

      <section className="section-warm">
        <div className="container-editorial flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow text-gold-deep">Specification</p>
            <h2 className="display-3 mt-4 text-charcoal">
              Need a specific colourway or a full schedule?
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Share the room, the finish and the layout pattern you have in mind. We will
              confirm availability and arrange samples from the catalogue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/consultation" className="btn btn-solid">
              REQUEST A CONSULTATION
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/materials" className="btn btn-outline">
              ALL MATERIALS
            </Link>
          </div>
        </div>
      </section>

      <ConsultationCTA />
    </main>
  );
}

