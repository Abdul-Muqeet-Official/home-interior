import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import { getWallpaperCollections } from "@/lib/supabase/queries";

export const revalidate = 300;
type Props = { params: { country: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = params.country.toLowerCase();
  return { title: `${country[0]?.toUpperCase() ?? ""}${country.slice(1)} Wallpaper Catalogues`, description: `Wallpaper catalogue collections sourced from ${country}.`, alternates: { canonical: `/materials/wallpaper/${country}` } };
}

export default async function WallpaperCountryPage({ params }: Props) {
  const country = params.country.toLowerCase();
  if (country !== "china" && country !== "korea") notFound();
  const collections = await getWallpaperCollections(country);
  return <main id="main"><section className="pb-14 pt-12"><div className="container-wide"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Materials & Products", href: "/materials" }, { label: "Wallpaper", href: "/materials/wallpaper" }, { label: country.toUpperCase() }]} /><p className="eyebrow mt-10">Wallpaper · {country.toUpperCase()}</p><h1 className="display-1 mt-5 text-charcoal">{country[0]?.toUpperCase() ?? ""}{country.slice(1)} wallpaper catalogues</h1><p className="lede mt-6 max-w-2xl">Collections rendered from the supplied {country.toUpperCase()} catalogue PDFs.</p></div></section><section className="section bg-pure"><div className="container-wide">{collections.length === 0 ? <p className="text-sm text-muted">No published wallpaper collections are currently available for {country}.</p> : <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{collections.map((collection) => <Link key={collection.id} href={`/materials/wallpaper/${country}/${collection.slug}`} className="group"><MediaFrame src={collection.cover?.src ?? "/media/materials/wallpaper.svg"} alt={`${collection.name} wallpaper catalogue cover`} ratio="4 / 5" sizes="(max-width: 640px) 90vw, 30vw" className="border border-line" /><p className="eyebrow mt-4">{collection.pageCount} pages</p><h2 className="mt-2 text-xl text-charcoal">{collection.name}</h2><span className="link-editorial mt-3 text-champagne">View collection <span aria-hidden="true">→</span></span></Link>)}</div>}</div></section><ConsultationCTA /></main>;
}
