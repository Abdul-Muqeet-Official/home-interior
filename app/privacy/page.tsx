/**
 * app/privacy/page.tsx
 */

import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { SITE } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How HOME INTERIOR handles consultation enquiries, contact details and website data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main id="main">
      <section className="pb-16 pt-12">
        <div className="container-wide">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy" }]} />

          <div className="mt-10 max-w-3xl">
            <p className="eyebrow">Legal</p>
            <h1 className="display-2 mt-6 text-charcoal">Privacy Notice</h1>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-12">
            <div className="max-w-2xl space-y-8 lg:col-span-8">
              <section>
                <h2 className="display-3 text-charcoal">Information we collect</h2>
                <p className="lede mt-4">
                  When you submit a consultation request we record your name, phone number, email
                  address, project type, preferred contact method and any message you choose to
                  send. The website itself does not set advertising cookies and does not build
                  visitor profiles.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">How we use it</h2>
                <p className="lede mt-4">
                  Your details are used solely to respond to your enquiry, arrange a consultation
                  and prepare a quotation. We do not sell, rent or publish client information.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Where it is stored</h2>
                <p className="lede mt-4">
                  Enquiries are stored in the studio’s Supabase lead register, which is protected
                  by row-level security. Only studio staff can read submitted enquiries. Submission
                  from the public website is write-only.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Your choices</h2>
                <p className="lede mt-4">
                  You may ask us to correct or delete the details we hold about your enquiry at any
                  time. Contact the studio on {SITE.phone} or message us on WhatsApp at{" "}
                  {SITE.whatsapp}.
                </p>
              </section>

              <section>
                <h2 className="display-3 text-charcoal">Project imagery</h2>
                <p className="lede mt-4">
                  Photographs of completed client work are published only with the owner’s consent.
                  Projects are shown with the details the owner has approved.
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


