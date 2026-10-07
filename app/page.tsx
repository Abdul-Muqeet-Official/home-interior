import Hero from "@/components/ui/Hero";
import MaterialRail from "@/components/ui/MaterialRail";
import WorkMediaRail from "@/components/ui/WorkMediaRail";
import PhilosophySection from "@/components/ui/PhilosophySection";
import ProcessTimeline from "@/components/ui/ProcessTimeline";
import ServicesSection from "@/components/ui/ServicesSection";
import ClientImpressionsMarquee from "@/components/ui/ClientImpressionsMarquee";
import LuxuryRunningTicker from "@/components/ui/LuxuryRunningTicker";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import SectionHeading from "@/components/ui/SectionHeading";
import { LOCAL_WORK_MEDIA } from "@/lib/content/work-media";
import { MATERIALS_PAGE, REVIEWS, WORK } from "@/lib/content/editorial";
import {
  getCategories,
  getProjects,
  getReviews,
  getServices,
} from "@/lib/supabase/queries";

export const revalidate = 300;

const HOME_PROJECT_LIMIT = 6;
const HOME_REVIEW_LIMIT = 6;

export default async function HomePage() {
  const [categories, projects, reviews, services] = await Promise.all([
    getCategories(),
    getProjects(),
    getReviews(),
    getServices(),
  ]);

  return (
    <main id="main">
      <Hero />

      {/* 1. Directly below Hero and BEFORE Our Philosophy */}
      <LuxuryRunningTicker variant="dark" />

      <PhilosophySection />

      {/* 2. Directly below Our Philosophy and BEFORE Materials & Products */}
      <LuxuryRunningTicker variant="dark" />

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

      {/* 3. Directly below Materials & Products and BEFORE Our Work */}
      <LuxuryRunningTicker variant="dark" />

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
            projects={projects.slice(0, HOME_PROJECT_LIMIT)}
            localMedia={LOCAL_WORK_MEDIA}
          />
        </div>
      </section>

      {/* 4. Directly below Our Work and BEFORE Services */}
      <LuxuryRunningTicker variant="dark" />

      <ServicesSection services={services} heading="Services" compact />

      {/* 5. Directly below Services and BEFORE Our Process */}
      <LuxuryRunningTicker variant="dark" />

      <ProcessTimeline />

      {/* Directly below Our Process and BEFORE Client Impressions */}
      <LuxuryRunningTicker variant="dark" />

      <ClientImpressionsMarquee reviews={reviews} />

      <ConsultationCTA />
    </main>
  );
}
