/**
 * components/ui/StudioIntro.tsx
 * Editorial introduction — the studio statement directly beneath the hero.
 * Visual-first with strong imagery alongside editorial content.
 */

import Link from "next/link";
import MediaFrame from "./MediaFrame";
import Reveal from "./Reveal";
import { EDITORIAL_INTRO } from "@/lib/content/editorial";

export default function StudioIntro() {
  return (
    <section className="section section-warm" aria-labelledby="studio-introduction">
      <div className="container-editorial grid gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-7">
          <MediaFrame
            src="/media/photos/philosophy.jpg"
            alt="Studio material study — warm plaster, limestone, brushed brass and smoked oak reviewed under daylight"
            ratio="5 / 4"
            sizes="(max-width: 1024px) 92vw, 720px"
            className="rounded-card border border-line"
          />
          <div className="mt-6 grid grid-cols-2 gap-6">
            <p className="text-sm leading-relaxed text-muted">
              Material palette study — warm plaster, limestone, brushed brass and smoked oak,
              reviewed together under the room&apos;s own daylight.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Every scheme begins on the drawing board: proportions, service routes and storage set
              out before surfaces are selected.
            </p>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delayMs={120}>
          <p className="eyebrow">{EDITORIAL_INTRO.eyebrow}</p>
          <h2 id="studio-introduction" className="display-2 mt-5 text-charcoal">
            {EDITORIAL_INTRO.heading}
          </h2>
          <div className="mt-7 space-y-5">
            {EDITORIAL_INTRO.body.map((paragraph) => (
              <p key={paragraph} className="lede">
                {paragraph}
              </p>
            ))}
          </div>

          <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {EDITORIAL_INTRO.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="eyebrow">{fact.label}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-charcoal">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/philosophy" className="btn btn-solid">
              Our philosophy
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/our-work" className="btn btn-outline">
              Our work
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}