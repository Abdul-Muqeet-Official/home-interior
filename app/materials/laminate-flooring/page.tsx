import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import LaminateFlooringRail from "@/components/ui/LaminateFlooringRail";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import SectionHeading from "@/components/ui/SectionHeading";
import { SITE_URL } from "@/lib/site.config";
import {
  getLaminateFlooringCollections,
  type LaminateFlooringCollection,
} from "@/lib/supabase/queries";

export const revalidate = 300;

function socialImageFor(collections: LaminateFlooringCollection[]): string {
  const cover = collections.find((entry) => entry.cover)?.cover;
  if (cover) return cover.src;
  return "/media/materials/laminate-flooring.svg";
}

export async function generateMetadata(): Promise<Metadata> {
  const collections = await getLaminateFlooringCollections();
  const description =
    "Laminate flooring catalogue collections from the HOME INTERIOR studio library, rendered page by page from the supplied source catalogues.";
  return {
    title: "Laminate Flooring Catalogues",
    description,
    alternates: { canonical: "/materials/laminate-flooring" },
    openGraph: {
      title: "Laminate Flooring Catalogues — HOME INTERIOR",
      description,
      url: "/materials/laminate-flooring",
      type: "website",
      images: [socialImageFor(collections)],
    },
    twitter: {
      card: "summary_large_image",
      title: "Laminate Flooring Catalogues — HOME INTERIOR",
      description,
      images: [socialImageFor(collections)],
    },
  };
}

export default async function LaminateFlooringPage() {
  const collections = await getLaminateFlooringCollections();
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
              { label: "Laminate Flooring" },
            ]}
          />

          <div className="mt-10 grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="eyebrow">Laminate Flooring</p>
              <h1 className="display-1 mt-6 text-charcoal">LAMINATE FLOORING</h1>
              <p className="lede mt-7 max-w-xl">
                High-pressure laminate planks presented collection by collection
                and page by page exactly as the studio received them.
              </p>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
                Every collection below is rendered directly from its source catalogue, so
                colour, grain and finish are shown as printed — nothing is redrawn,
                recoloured or substituted.
              </p>

              {collections.length > 0 && (
                <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
                  <div>
                    <dt className="eyebrow">Collections</dt>
                    <dd className="mt-2 font-serif text-3xl text-charcoal">
                      {collections.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Catalogue pages</dt>
                    <dd className="mt-2 font-serif text-3xl text-charcoal">
                      {totalPages}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="lg:col-span-5">
              <MediaFrame
                src={hero?.cover?.src ?? "/media/materials/laminate-flooring.svg"}
                alt={
                  hero
                    ? hero.name + " laminate flooring catalogue cover"
                    : "Laminate flooring material texture"
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

      <section className="section bg-pure" aria-labelledby="laminate-collections-heading">
        <div className="container-wide">
          <SectionHeading
            id="laminate-collections-heading"
            eyebrow="Laminate flooring collections"
            heading="LAMINATE FLOORING COLLECTIONS"
            description="Select a collection to open its rendered catalogue."
          />

          {collections.length === 0 ? (
            <div className="mt-12 border-t border-line pt-10">
              <h3 className="text-xl text-charcoal">
                Laminate flooring catalogues are being curated.
              </h3>
              <p className="mt-3 max-w-xl text-sm text-muted">
                Published laminate flooring collections will appear here as they are
                approved for the studio library.
              </p>
            </div>
          ) : (
            <div className="mt-14">
              <LaminateFlooringRail collections={collections} priorityCount={0} />
            </div>
          )}
        </div>
      </section>

      <section className="section-warm">
        <div className="container-editorial flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow text-gold-deep">Specification</p>
            <h2 className="display-3 mt-4 text-charcoal">
              Need a specific finish or a full schedule?
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Share the room, the finish and the pattern you have in mind. We will
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
