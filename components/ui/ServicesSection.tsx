/**
 * components/ui/ServicesSection.tsx
 * SERVICES — editorial index rather than generic feature cards.
 */

import Link from "next/link";
import Reveal from "./Reveal";
import type { Service } from "@/lib/content/types";

/**
 * SERVICES — a studio service menu: numbered rows, hairlines, no feature cards.
 */
export default function ServicesSection({
  services,
  heading = "Services",
  headingId = "services-heading",
  compact = false,
}: {
  services: Service[];
  heading?: string;
  headingId?: string;
  compact?: boolean;
}) {
  const list = compact ? services.slice(0, 6) : services;

  return (
    <section className="section section-warm" aria-labelledby={headingId}>
      <div className="container-editorial">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">What we do</p>
          <h2 id={headingId} className="display-2 mt-5 text-charcoal">
            {heading}
          </h2>
        </Reveal>

        <ul className="mt-16 border-t border-line">
          {list.map((service, index) => (
            <li key={service.slug} className="border-b border-line">
              <Reveal delayMs={index * 45}>
                <div className="grid gap-x-10 gap-y-3 py-8 lg:grid-cols-12 lg:items-baseline">
                  <span className="text-[11px] tracking-[0.3em] text-champagne lg:col-span-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-2xl leading-snug text-charcoal lg:col-span-4">
                    {service.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted lg:col-span-6">
                    {service.description}
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-gold-deep lg:col-span-1 lg:text-right">
                    {service.meta}
                  </span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/consultation" className="btn btn-solid">
            REQUEST A CONSULTATION
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/materials" className="btn btn-outline">
            BROWSE MATERIALS
          </Link>
        </div>
      </div>
    </section>
  );
}