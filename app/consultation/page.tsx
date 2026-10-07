import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationForm from "@/components/ui/ConsultationForm";
import { CONSULTATION } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Consultation",
  description: "Request a private interior design consultation with HOME INTERIOR, DHA Phase 5, Karachi.",
  alternates: { canonical: "/consultation" },
};

export default function ConsultationPage() {
  return (
    <main id="main">
      <section className="relative isolate flex h-[60svh] min-h-[400px] w-full items-end overflow-hidden">
        <Image
          src="/media/photos/og.jpg"
          alt="Consultation interior space"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
        
        <div className="container-editorial relative z-10 pb-12">
          <p className="eyebrow text-champagne">{CONSULTATION.eyebrow}</p>
          <h1 className="display-1 mt-4 text-white text-shadow-editorial">let&apos;s design your space.</h1>
          <p className="mt-4 max-w-xl text-white/85">{CONSULTATION.subtext}</p>
        </div>
      </section>

      <section className="section-tight pb-24 bg-pure">
        <div className="container-wide mt-8">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Consultation" }]} />
        </div>
        
        <div className="container-wide mt-10 grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ConsultationForm source="consultation-page" />
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-card border border-line bg-surface p-8">
              <p className="eyebrow">HOME INTERIOR<br />KARACHI — BESPOKE LIVING STUDIO</p>
              <address className="mt-5 not-italic text-sm leading-relaxed text-charcoal">
                {SITE.addressLines.map((line, i) => <span key={line}  className="block">{line} </span>)}
              </address>

              <dl className="mt-8 space-y-5">
                <div>
                  <dt className="eyebrow">Phone</dt>
                  <dd className="mt-2">
                    <a href={SITE.phoneHref} className="text-sm text-charcoal hover:text-gold-deep">
                      {SITE.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">WhatsApp</dt>
                  <dd className="mt-2">
                    <a
                      href={SITE.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-charcoal hover:text-gold-deep"
                    >
                      {SITE.whatsapp}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}




