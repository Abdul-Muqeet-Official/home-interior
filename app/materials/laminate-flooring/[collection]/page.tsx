import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CatalogueViewer from "@/components/ui/CatalogueViewer";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import SectionHeading from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site.config";
import { getLaminateFlooringCollection } from "@/lib/supabase/queries";

export const revalidate = 300;

type Props = { params: { collection: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getLaminateFlooringCollection(params.collection);
  if (!collection) {
    return { title: "Laminate Flooring Collection", robots: { index: false, follow: false } };
  }
  const description = collection.name + " — laminate flooring catalogue collection from the HOME INTERIOR studio library, " + collection.pageCount + " rendered pages.";
  return {
    title: collection.name + " Laminate Flooring Collection",
    description,
    alternates: { canonical: "/materials/laminate-flooring/" + collection.slug },
    openGraph: {
      title: collection.name + " — Laminate Flooring | HOME INTERIOR",
      description,
      url: "/materials/laminate-flooring/" + collection.slug,
      type: "article",
      images: collection.cover ? [{ url: collection.cover.src }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: collection.name + " — Laminate Flooring | HOME INTERIOR",
      description,
      images: collection.cover ? [collection.cover.src] : undefined,
    },
  };
}

export default async function LaminateFlooringCollectionPage({ params }: Props) {
  const collection = await getLaminateFlooringCollection(params.collection);
  if (!collection) notFound();

  return (
    <main id="main">
      <section className="pb-12 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: "Laminate Flooring", href: "/materials/laminate-flooring" },
              { label: collection.name },
            ]}
          />

          <div className="mt-10 grid items-end gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="eyebrow">Laminate flooring · collection</p>
              <h1 className="display-1 mt-6 break-words text-charcoal">{collection.name}</h1>

              <dl className="mt-9 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="eyebrow">Catalogue pages</dt>
                  <dd className="mt-2 font-serif text-2xl text-charcoal">
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
                src={collection.cover?.src ?? "/media/materials/laminate-flooring.svg"}
                alt={collection.name + " laminate flooring catalogue cover"}
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
              label={collection.name + " laminate flooring catalogue pages"}
            />
          </div>
        </div>
      </section>

      <ConsultationCTA />
    </main>
  );
}
