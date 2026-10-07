import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import { getWallpaperCollections } from "@/lib/supabase/queries";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Wallpaper Catalogues",
  description: "Wallpaper catalogue collections by source, including China and Korea.",
  alternates: { canonical: "/materials/wallpaper" },
};

export default async function WallpaperPage({ searchParams }: { searchParams: { country?: string } }) {
  const selectedCountry = searchParams.country;
  // If 'all' is passed or no country, pass undefined to fetch all
  const filter = selectedCountry === 'china' || selectedCountry === 'korea' ? selectedCountry : undefined;
  
  const collections = await getWallpaperCollections(filter);
  const countries = ["china", "korea"];
  return (
    <main id="main">
      <section className="pb-14 pt-12"><div className="container-wide">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Materials & Products", href: "/materials" }, { label: "Wallpaper" }]} />
        <div className="mt-10 max-w-4xl"><p className="eyebrow">Wallpaper</p><h1 className="display-1 mt-6 text-charcoal">Surface, pattern, atmosphere.</h1><p className="lede mt-7 max-w-2xl">Explore our wallpaper catalogue library by source and collection.</p></div>
      </div></section>
      <section className="section bg-pure" aria-labelledby="countries-heading"><div className="container-wide">
        <h2 id="countries-heading" className="display-3 text-charcoal">Country collections</h2>
        <div className="mt-8 flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Wallpaper source countries">
          <Link href="/materials/wallpaper" className={`btn whitespace-nowrap ${!filter ? 'btn-solid' : 'btn-outline'}`} role="listitem">ALL</Link>
          {countries.map((country) => <Link key={country} href={`/materials/wallpaper?country=${country}`} className={`btn whitespace-nowrap ${filter === country ? 'btn-solid' : 'btn-outline'}`} role="listitem">{country.toUpperCase()}</Link>)}
        </div>
        {collections.length === 0 ? <div className="mt-14 border-t border-line pt-10"><h2 className="text-xl text-charcoal">Wallpaper catalogues are being curated.</h2><p className="mt-3 max-w-xl text-sm text-muted">Published China and Korea collections will appear here as they are approved for the studio library.</p></div> : <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{collections.map((collection) => <Link key={collection.id} href={`/materials/wallpaper/${collection.country}/${collection.slug}`} className="group"><MediaFrame src={collection.cover?.src ?? "/media/materials/wallpaper.svg"} alt={`${collection.name} wallpaper catalogue cover`} ratio="4 / 5" sizes="(max-width: 640px) 90vw, 30vw" className="border border-line" /><p className="eyebrow mt-4">{collection.country.toUpperCase()}</p><h2 className="mt-2 text-xl text-charcoal">{collection.name}</h2><p className="mt-2 text-xs text-muted">{collection.pageCount} pages</p><span className="link-editorial mt-3 text-champagne">View collection <span aria-hidden="true">&rarr;</span></span></Link>)}</div>}
      </div></section><ConsultationCTA />
    </main>
  );
}

