import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import PhilosophySection from "@/components/ui/PhilosophySection";
import ProcessTimeline from "@/components/ui/ProcessTimeline";

export const metadata: Metadata = {
  title: "Philosophy",
  description: "How HOME INTERIOR approaches residential design in Karachi.",
  alternates: { canonical: "/philosophy" },
};

export default function PhilosophyPage() {
  return (
    <main id="main">
      <section className="relative isolate flex h-[70svh] min-h-[480px] w-full items-end overflow-hidden">
        <Image
          src="/media/photos/philosophy.jpg"
          alt="Material study — stone, plaster and oak review under studio light"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
        
        <div className="container-editorial relative z-10 pb-16">
          <p className="eyebrow text-champagne">Philosophy</p>
          <h1 className="display-1 mt-4 max-w-3xl text-white text-shadow-editorial">Our Philosophy.</h1>
          <p className="mt-4 max-w-xl text-white/85">
            Six principles govern every drawing we issue. They are not a style — they are the
            order in which decisions are taken, from the first site measurement to final
            handover.
          </p>
        </div>
      </section>

      <div className="container-wide pt-10 pb-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Philosophy" }]} />
      </div>

      <PhilosophySection />
      <ProcessTimeline />
      <ConsultationCTA />
    </main>
  );
}
