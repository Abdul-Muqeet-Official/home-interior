import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import CollectionMediaGallery from "@/components/ui/CollectionMediaGallery";
import MediaFrame from "@/components/ui/MediaFrame";
import { getWallpaperCollections } from "@/lib/supabase/queries";

export const revalidate = 300;
type Props = { params: { country: string; collection: string } };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const collection = (await getWallpaperCollections(params.country, true)).find((entry) => entry.slug === params.collection); return { title: collection ? `${collection.name} Wallpaper Collection` : "Wallpaper Collection", description: collection ? `${collection.name} — ${collection.country.toUpperCase()} wallpaper catalogue collection.` : "HOME INTERIOR wallpaper collection.", alternates: { canonical: `/materials/wallpaper/${params.country}/${params.collection}` } }; }
export default async function WallpaperCollectionPage({ params }: Props) { const country = params.country.toLowerCase(); if (country !== "china" && country !== "korea") notFound(); const collection = (await getWallpaperCollections(country, true)).find((entry) => entry.slug === params.collection); if (!collection) notFound(); return <main id="main"><section className="pb-14 pt-12"><div className="container-wide"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Materials & Products", href: "/materials" }, { label: "Wallpaper", href: "/materials/wallpaper" }, { label: country.toUpperCase(), href: `/materials/wallpaper/${country}` }, { label: collection.name }]} /><p className="eyebrow mt-10">{country.toUpperCase()} · Wallpaper collection</p><h1 className="display-1 mt-5 text-charcoal">{collection.name}</h1><p className="mt-5 text-sm text-muted">{collection.pageCount} pages</p></div></section><section className="section bg-pure"><div className="container-wide grid gap-10 lg:grid-cols-12"><div className="lg:col-span-4"><MediaFrame src={collection.cover?.src ?? "/media/materials/wallpaper.svg"} alt={`${collection.name} wallpaper catalogue cover`} ratio="4 / 5" sizes="(max-width: 1024px) 90vw, 32vw" priority className="border border-line" /></div><div className="lg:col-span-8"><CollectionMediaGallery items={collection.media} title={collection.name} /></div></div></section><ConsultationCTA /></main>; }

