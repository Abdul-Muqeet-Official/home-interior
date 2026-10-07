/**
 * components/ui/PhilosophySection.tsx
 * OUR PHILOSOPHY — six principles on a refined editorial grid.
 * Hairlines instead of cards keep the block calm and compact.
 */

import { PHILOSOPHY } from "@/lib/content/editorial";
import Reveal from "./Reveal";

export default function PhilosophySection() {
  return (
    <section className="section section-warm" aria-labelledby="philosophy-heading">
      <div className="container-editorial">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-gold-deep">{PHILOSOPHY.eyebrow}</p>
          <h2 id="philosophy-heading" className="display-2 mt-5 text-charcoal">
            {PHILOSOPHY.heading}
          </h2>
        </Reveal>

        <dl className="mt-16 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {PHILOSOPHY.pillars.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              delayMs={index * 50}
              className="grid grid-cols-[2.25rem_1fr] gap-x-4 gap-y-3 border-t border-line py-8"
            >
              <span className="row-span-2 pt-[3px] text-[11px] tracking-[0.3em] text-champagne">
                {pillar.index}
              </span>
              <dt className="font-serif text-xl tracking-[0.14em] text-charcoal">
                {pillar.title}
              </dt>
              <dd className="col-start-2 text-sm leading-relaxed text-muted">
                {pillar.description}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}