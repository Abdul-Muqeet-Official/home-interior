import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import ProcessTimeline from "@/components/ui/ProcessTimeline";
import ServicesSection from "@/components/ui/ServicesSection";
import { getServices } from "@/lib/supabase/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services",
  description: "Interior architecture, residential design, wall finishes and turnkey project management in Karachi.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <main id="main">
      <section className="relative isolate flex h-[70svh] min-h-[480px] w-full items-end overflow-hidden">
        <Image
          src="/media/photos/services.jpg"
          alt="Architectural workspace/interior detail"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
        
        <div className="container-editorial relative z-10 pb-16">
          <p className="eyebrow text-champagne">Capabilities</p>
          <h1 className="display-1 mt-4 max-w-3xl text-white text-shadow-editorial">Our Services.</h1>
          <p className="mt-4 max-w-xl text-white/85">
            From single-room interventions to complete residences — each engagement is scoped,
            drawn and supervised by the studio.
          </p>
        </div>
      </section>

      <div className="container-wide pt-10 pb-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} />
      </div>

      <ServicesSection services={services} heading="How we engage" headingId="services-list" />

      <ProcessTimeline />
      <ConsultationCTA />
    </main>
  );
}
