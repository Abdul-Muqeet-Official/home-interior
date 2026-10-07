import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import EditorialTicker from "@/components/ui/EditorialTicker";
import MediaFrame from "@/components/ui/MediaFrame";
import WorkMediaRail from "@/components/ui/WorkMediaRail";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionSkeleton from "@/components/ui/SectionSkeleton";
import { LOCAL_WORK_MEDIA } from "@/lib/content/work-media";
import { FALSE_CEILING_COPY, falseCeilingPreview, FALSE_CEILING_ROUTE } from "@/lib/content/false-ceiling";
import { WORK } from "@/lib/content/editorial";
import { getProjects } from "@/lib/supabase/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Selected residential interiors and architectural transformations across Karachi — spatial planning, material palettes and detailing by HOME INTERIOR.",
  alternates: { canonical: "/our-work" },
};

async function WorkProjectsStream() {
  const projects = await getProjects();
  const hasProjects = projects.length > 0;

  return (
    <section className="section" aria-labelledby={hasProjects ? "our-work-window" : undefined}>
      {hasProjects && (
        <div className="container-wide">
          <SectionHeading
            id="our-work-window"
            eyebrow="Project Window"
            heading="Recent projects."
            description="A selection of completed rooms, renovations and material applications."
          />
        </div>
      )}
      <div className={hasProjects ? "mt-14" : ""}>
        <WorkMediaRail
          projects={projects}
          localMedia={LOCAL_WORK_MEDIA}
        />
      </div>
    </section>
  );
}

export default function OurWorkPage() {
  return (
    <main id="main">
      <section className="relative isolate flex h-[75svh] min-h-[500px] w-full items-end overflow-hidden">
        <Image
          src="/media/photos/work-featured.jpg"
          alt="Selected residential interiors"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
        
        <div className="container-editorial relative z-10 pb-16">
          <p className="eyebrow text-champagne">{WORK.eyebrow}</p>
          <h1 className="display-1 mt-4 max-w-3xl text-white text-shadow-editorial">{WORK.heading}</h1>
          <p className="mt-4 max-w-xl text-white/85">{WORK.subtext}</p>
        </div>
      </section>

      <div className="container-wide pt-10 pb-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Our Work" }]} />
      </div>

      <EditorialTicker />

      <Suspense fallback={<SectionSkeleton eyebrow="Project Window" heading="Loading Recent Commissions..." />}>
        <WorkProjectsStream />
      </Suspense>

      <section className="section section-surface">
        <div className="container-editorial">
          <SectionHeading
            eyebrow={FALSE_CEILING_COPY.eyebrow}
            heading={FALSE_CEILING_COPY.heading}
            description={FALSE_CEILING_COPY.lede}
            action={{ label: FALSE_CEILING_COPY.eyebrow, href: FALSE_CEILING_ROUTE }}
          />

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {falseCeilingPreview(3).map((item, index) => (
              <div key={item.id} className="group">
                <MediaFrame
                  src={item.src}
                  alt={item.alt}
                  ratio="4 / 5"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                  className="rounded-card border border-line"
                  priority={index === 0}
                />
                <p className="mt-5 text-sm font-medium tracking-wide text-charcoal">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConsultationCTA />
    </main>
  );
}
