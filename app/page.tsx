import { Suspense } from "react";
import dynamic from "next/dynamic";
import Hero from "@/components/ui/Hero";
import MaterialRail from "@/components/ui/MaterialRail";
import WorkMediaRail from "@/components/ui/WorkMediaRail";
import PhilosophySection from "@/components/ui/PhilosophySection";
import ProcessTimeline from "@/components/ui/ProcessTimeline";
import ServicesSection from "@/components/ui/ServicesSection";
import LuxuryRunningTicker from "@/components/ui/LuxuryRunningTicker";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionSkeleton from "@/components/ui/SectionSkeleton";
import { LOCAL_WORK_MEDIA } from "@/lib/content/work-media";
import { MATERIALS_PAGE, WORK } from "@/lib/content/editorial";
import {
  getCategories,
  getProjects,
  getReviews,
  getServices,
} from "@/lib/supabase/queries";

// Dynamic import for heavy marquee component to reduce initial bundle size
const ClientImpressionsMarquee = dynamic(
  () => import("@/components/ui/ClientImpressionsMarquee"),
  {
    loading: () => (
      <div className="section bg-charcoal text-pearl py-16 animate-pulse" aria-hidden="true">
        <div className="container-wide h-40 bg-stone/10 rounded-editorial" />
      </div>
    ),
  }
);

export const revalidate = 300;

const HOME_PROJECT_LIMIT = 6;
const HOME_REVIEW_LIMIT = 6;
const HOME_SERVICE_LIMIT = 6;

/* ------------------------------------------------------------------ *
 * Async Streaming Sub-Components
 * ------------------------------------------------------------------ */

async function MaterialsSection() {
  const categories = await getCategories();

  return (
    <section className="section section-surface" aria-labelledby="materials-heading">
      <div className="container-wide">
        <SectionHeading
          id="materials-heading"
          eyebrow={MATERIALS_PAGE.eyebrow}
          heading={MATERIALS_PAGE.subtext}
          description={MATERIALS_PAGE.description}
          action={{ label: "View all collections", href: "/materials" }}
        />
      </div>
      <div className="container-wide mt-14">
        <MaterialRail categories={categories} />
      </div>
    </section>
  );
}

async function WorkSection() {
  const projects = await getProjects({ limit: HOME_PROJECT_LIMIT });

  return (
    <section className="section" aria-labelledby="work-heading">
      <div className="container-wide">
        <SectionHeading
          id="work-heading"
          eyebrow={WORK.eyebrow}
          heading={WORK.heading}
          description={WORK.subtext}
          action={{ label: "View all work", href: "/our-work" }}
        />
      </div>
      <div className="container-wide mt-14">
        <WorkMediaRail
          projects={projects}
          localMedia={LOCAL_WORK_MEDIA}
        />
      </div>
    </section>
  );
}

async function ServicesStream() {
  const services = await getServices({ limit: HOME_SERVICE_LIMIT });
  return <ServicesSection services={services} heading="Services" compact />;
}

async function ReviewsStream() {
  const reviews = await getReviews({ limit: HOME_REVIEW_LIMIT });
  return <ClientImpressionsMarquee reviews={reviews} />;
}

/* ------------------------------------------------------------------ *
 * Main Homepage: Instant Above-the-Fold + Concurrent Streaming
 * ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <main id="main">
      {/* 1. Above-the-fold Hero renders instantly with prioritized LCP image */}
      <Hero />

      {/* Directly below Hero and BEFORE Our Philosophy */}
      <LuxuryRunningTicker variant="dark" />

      <PhilosophySection />

      {/* Directly below Our Philosophy and BEFORE Materials & Products */}
      <LuxuryRunningTicker variant="dark" />

      {/* 2. Stream Materials Rail */}
      <Suspense fallback={<SectionSkeleton eyebrow="Material Collections" heading="Loading Architectural Finishes..." />}>
        <MaterialsSection />
      </Suspense>

      {/* Directly below Materials & Products and BEFORE Our Work */}
      <LuxuryRunningTicker variant="dark" />

      {/* 3. Stream Our Work Rail */}
      <Suspense fallback={<SectionSkeleton eyebrow="Bespoke Portfolio" heading="Loading Commissioned Projects..." />}>
        <WorkSection />
      </Suspense>

      {/* Directly below Our Work and BEFORE Services */}
      <LuxuryRunningTicker variant="dark" />

      {/* 4. Stream Services Section */}
      <Suspense fallback={<SectionSkeleton eyebrow="Bespoke Services" heading="Loading Architectural Services..." cardCount={3} compact />}>
        <ServicesStream />
      </Suspense>

      {/* Directly below Services and BEFORE Our Process */}
      <LuxuryRunningTicker variant="dark" />

      <ProcessTimeline />

      {/* Directly below Our Process and BEFORE Client Impressions */}
      <LuxuryRunningTicker variant="dark" />

      {/* 5. Stream Client Impressions Marquee (lazy-chunked) */}
      <Suspense fallback={<div className="h-40 bg-charcoal animate-pulse" />}>
        <ReviewsStream />
      </Suspense>

      <ConsultationCTA />
    </main>
  );
}
