/**
 * components/ui/ProcessTimeline.tsx
 * OUR PROCESS — Discover, Define, Design, Detail, Deliver.
 * Editorial numbered timeline: hairlines, no cards.
 */

import { PROCESS } from "@/lib/content/editorial";
import Reveal from "./Reveal";

export default function ProcessTimeline({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <section
      className={tone === "dark" ? "section section-surface" : "section"}
      aria-labelledby="process-heading"
    >
      <div className="container-editorial">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-gold-deep">{PROCESS.eyebrow}</p>
          <h2
            id="process-heading"
            className="display-2 mt-5 text-charcoal"
          >
            {PROCESS.heading}
          </h2>
        </Reveal>

        <ol className="mt-16 border-t border-line">
          {PROCESS.steps.map((step, index) => (
            <li key={step.title} className="border-b border-line">
              <Reveal delayMs={index * 50}>
                <div className="grid gap-x-10 gap-y-3 py-7 sm:grid-cols-12 sm:items-baseline">
                  <span className="text-[11px] tracking-[0.3em] text-champagne sm:col-span-1">
                    {step.index}
                  </span>
                  <h3 className="font-serif text-2xl tracking-[0.1em] text-charcoal sm:col-span-3">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted sm:col-span-8">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}