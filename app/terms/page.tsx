/**
 * app/terms/page.tsx
 */

import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { SITE } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the HOME INTERIOR website and studio information.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main id="main">
      <section className="pb-16 pt-12">
        <div className="container-wide">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms" }]} />

          <div className="mt-10 max-w-3xl">
            <p className="eyebrow">Legal</p>
            <h1 className="display-2 mt-6 text-charcoal">Terms of Use</h1>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-12">
            <div className="max-w-2xl space-y-8 lg:col-span-8">
              <section>
                <h2 className="display-3 text-charcoal">Website content</h2>
                <p className="lede mt-4">
                  Product names, descriptions and material notes published here are provided for
                  general specification guidance. Finishes, shades, dimensions and availability are
                  confirmed against physical samples and written quotations.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Pricing</h2>
                <p className="lede mt-4">
                  Where a price is shown it is indicative and subject to confirmation of quantity,
                  specification, stock and site conditions. Where no price is shown, pricing is
                  provided on consultation.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Imagery</h2>
                <p className="lede mt-4">
                  Studio visualisations and material studies published on this site are produced by
                  the studio to communicate design direction. Photographs of completed work are
                  published with client consent.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Intellectual property</h2>
                <p className="lede mt-4">
                  Drawings, renderings, specifications and photography produced by the studio remain
                  the intellectual property of {SITE.name}.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Contact</h2>
                <p className="lede mt-4">
                  Questions about these terms can be sent to the studio on {SITE.phone} or via
                  WhatsApp on {SITE.whatsapp}.
                </p>
              </section>
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-card border border-line bg-surface p-8">
                <p className="eyebrow">HOME INTERIOR</p>
                <address className="mt-5 not-italic text-sm leading-relaxed text-charcoal">
                  {SITE.addressLines.map((line, i) => <span key={line}  className="block">{line} </span>)}
                </address>
                <p className="mt-6 text-sm text-charcoal">{SITE.phone}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}


