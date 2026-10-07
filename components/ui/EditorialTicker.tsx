/**
 * components/ui/EditorialTicker.tsx
 * Continuous editorial running line. Pure CSS transform animation — pauses on hover
 * or keyboard focus and is disabled entirely for reduced-motion visitors.
 */

import { RUNNING_LINE } from "@/lib/content/editorial";
import { cx } from "@/lib/utils";

export default function EditorialTicker({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";

  return (
    <div
      className={cx(
        "marquee-wrap overflow-hidden border-y py-5",
        dark ? "on-dark border-line-light bg-charcoal text-white" : "border-line bg-surface text-charcoal"
      )}
    >
      <div className="marquee-track marquee-track-slow">
        {[0, 1].map((copy) => (
          <span key={copy} className="flex items-center" aria-hidden={copy === 1 || undefined}>
            {RUNNING_LINE.map((line) => (
              <span key={`${copy}-${line}`} className="flex items-center">
                <span className="px-6 text-[11px] uppercase tracking-[0.34em] whitespace-nowrap">
                  {line}
                </span>
                <span aria-hidden="true" className="text-champagne">
                  —
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
