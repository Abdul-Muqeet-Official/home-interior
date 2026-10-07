import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import ReviewsViewer from "@/components/ui/ReviewsViewer";
import { REVIEWS } from "@/lib/content/editorial";
import { getReviews } from "@/lib/supabase/queries";

// Dynamic import for interactive form below the fold
const AddReviewForm = dynamic(() => import("@/components/ui/AddReviewForm"), {
  loading: () => <div className="h-64 rounded-editorial bg-charcoal/50 animate-pulse" />,
});

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Client Reviews",
  description: "Published client impressions of HOME INTERIOR — interior design and material specification in Karachi.",
  alternates: { canonical: "/reviews" },
};

async function ReviewsContent() {
  const reviews = await getReviews();

  return (
    <div className="mt-14">
      <ReviewsViewer reviews={reviews} />
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <main id="main">
      <section className="relative isolate flex h-[65svh] min-h-[440px] w-full items-end overflow-hidden">
        <Image
          src="/media/photos/work-03.jpg"
          alt="Refined completed interior"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        
        <div className="container-editorial relative z-10 pb-16">
          <p className="eyebrow text-champagne">{REVIEWS.eyebrow}</p>
          <h1 id="reviews-heading" className="display-1 mt-4 max-w-3xl text-white text-shadow-editorial">
            {REVIEWS.heading}
          </h1>
          <p className="mt-4 max-w-xl text-white/85">{REVIEWS.subtext}</p>
        </div>
      </section>

      <section className="bg-charcoal text-white">
        <div className="container-wide pt-10 pb-20 lg:pb-32">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Client Reviews" }]}
            tone="dark"
          />

          <Suspense fallback={<div className="mt-14 h-96 rounded-editorial bg-stone/5 animate-pulse" />}>
            <ReviewsContent />
          </Suspense>

          <div className="mt-20 max-w-3xl mx-auto">
            <AddReviewForm />
          </div>
        </div>
      </section>

      <ConsultationCTA />
    </main>
  );
}
