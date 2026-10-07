import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import { SITE } from "@/lib/site.config";
import CollectionMediaGallery from "@/components/ui/CollectionMediaGallery";
import { ROLLER_BLINDS_ITEMS } from "@/lib/content/roller-blinds";

export const revalidate = 300;
export const metadata: Metadata = { title: "Roller Blinds", description: "Roller Blinds reference collection from the HOME INTERIOR material library.", alternates: { canonical: "/materials/window-blinds/roller-blinds" } };

export default function RollerBlindsPage() {
  return <main id="main"><section className="pb-14 pt-12"><div className="container-wide"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Materials & Products", href: "/materials" }, { label: "Window Blinds", href: "/materials/window-blinds" }, { label: "Roller Blinds" }]} /><p className="eyebrow mt-10">Window Blinds · Collection</p><h1 className="display-1 mt-5 text-charcoal">Roller Blinds</h1><p className="lede mt-6 max-w-2xl">Reference photography from the supplied Roller Blinds collection.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/consultation" className="btn btn-solid">REQUEST A CONSULTATION <span aria-hidden="true">→</span></Link><a href={SITE.whatsappUrl} className="btn btn-outline" target="_blank" rel="noreferrer">WHATSAPP US</a></div></div></section><section className="section bg-pure"><div className="container-wide"><CollectionMediaGallery items={ROLLER_BLINDS_ITEMS} title="Roller Blinds" /></div></section><ConsultationCTA /></main>;
}
