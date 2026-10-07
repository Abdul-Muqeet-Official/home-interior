import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import CollectionMediaGallery from "@/components/ui/CollectionMediaGallery";
import MediaFrame from "@/components/ui/MediaFrame";
import { getCategoryWithData } from "@/lib/supabase/queries";

export const revalidate = 300;
type Props = { params: { category: string; collection: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCategoryWithData(params.collection);
  const title = data?.category.name ?? "Collection";
  const description = data?.category.description ?? "Explore the HOME INTERIOR collection.";
  return { title, description, alternates: { canonical: `/materials/${params.category}/${params.collection}` }, openGraph: { title, description, images: data?.category.artwork ? [{ url: data.category.artwork }] : undefined } };
}

export default async function CollectionPage({ params }: Props) {
  const data = await getCategoryWithData(params.collection);
  if (!data) notFound();
  const { category, media } = data;
  return <main id="main">
    <section className="pb-12 pt-12"><div className="container-wide"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Materials & Products", href: "/materials" }, { label: params.category, href: `/materials/${params.category}` }, { label: category.name }]} /><div className="mt-10 max-w-4xl"><p className="eyebrow">{category.meta}</p><h1 className="display-1 mt-6 text-charcoal">{category.name}</h1><p className="lede mt-7 max-w-2xl">{category.description}</p><p className="mt-6 text-sm text-muted">{media.length} verified media {media.length === 1 ? "item" : "items"}</p></div></div></section>
    <section className="section bg-pure"><div className="container-wide"><div className="grid gap-10 lg:grid-cols-12 lg:items-start"><div className="lg:col-span-5"><MediaFrame src={category.artwork} alt={`${category.name} collection cover`} ratio="4 / 5" sizes="(max-width: 1024px) 90vw, 38vw" priority className="border border-line" /></div><div className="lg:col-span-7"><CollectionMediaGallery items={media} title={category.name} /></div></div></div></section>
    <ConsultationCTA />
  </main>;
}
