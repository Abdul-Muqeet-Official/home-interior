import Image from "next/image";
import Link from "next/link";
import { CONSULTATION } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";

export default function ConsultationCTA({
  showFormLink = true,
}: {
  showFormLink?: boolean;
}) {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="consultation-heading"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="/media/photos/og.jpg"
          alt="Premium interior consultation space"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/80" />
      </div>

      <div className="container-editorial relative z-10 grid gap-12 py-24 lg:grid-cols-12 lg:py-32">
        <div className="lg:col-span-7">
          <p className="eyebrow text-champagne">{CONSULTATION.eyebrow}</p>
          <h2
            id="consultation-heading"
            className="display-2 mt-5 text-white text-shadow-editorial"
          >
            let&apos;s design your space.
          </h2>
          <p className="lede mt-6 max-w-xl text-white/85">
            {CONSULTATION.subtext}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {showFormLink && (
              <Link href="/consultation" className="btn btn-glass">
                REQUEST A CONSULTATION
                <span aria-hidden="true">→</span>
              </Link>
            )}
            <a
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light"
            >
              WHATSAPP
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 lg:pl-10">
          <div className="rounded-card border border-white/20 bg-white/10 p-8 backdrop-blur-md">
            <p className="eyebrow text-white/80">HOME INTERIOR<br />KARACHI — BESPOKE LIVING STUDIO</p>
            <address className="mt-5 not-italic text-sm leading-relaxed text-white">
              {SITE.addressLines.map((line, i) => <span key={line}  className="block">{line} </span>)}
            </address>

            <dl className="mt-8 space-y-5">
              <div>
                <dt className="eyebrow text-white/80">Phone</dt>
                <dd className="mt-2">
                  <a href={SITE.phoneHref} className="text-sm text-white hover:text-champagne transition-colors">
                    {SITE.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-white/80">WhatsApp</dt>
                <dd className="mt-2">
                  <a
                    href={SITE.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:text-champagne transition-colors"
                  >
                    {SITE.whatsapp}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}




