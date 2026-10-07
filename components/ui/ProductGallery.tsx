/**
 * components/ui/ProductGallery.tsx
 * Interactive product gallery: a main image plus selectable thumbnails.
 *
 * The cover is passed separately from `images` so the first thumbnail is always
 * the primary picture and never a duplicate of it.
 *
 * Accessibility: the thumbnails are a real radio group, so arrow keys move
 * between pictures and screen readers announce the selected position. Clicking a
 * thumbnail swaps the main image without a page navigation.
 */

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

export default function ProductGallery({
  cover,
  images,
  alt,
  sizes = "(max-width: 1024px) 92vw, 720px",
}: {
  cover: string;
  images: string[];
  alt: string;
  sizes?: string;
}) {
  // De-duplicate so a record that repeats the cover never shows a duplicate thumb.
  const all = [cover, ...images.filter((src) => src !== cover)];
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset when the product changes (slug navigation keeps the component mounted).
  useEffect(() => {
    setActiveIndex(0);
  }, [cover, images]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeIndex + delta + all.length) % all.length;
    setActiveIndex(next);
    thumbRefs.current[next]?.focus();
  }, [activeIndex, all.length]);

  if (all.length === 0) return null;
  const active = all[Math.min(activeIndex, all.length - 1)];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-surface">
        <Image
          src={active}
          alt={`${alt} — image ${activeIndex + 1} of ${all.length}`}
          fill
          sizes={sizes}
          priority={activeIndex === 0}
          className="object-cover"
        />
      </div>

      {all.length > 1 && (
        <div
          role="radiogroup"
          aria-label={`${alt} — product pictures`}
          onKeyDown={onKeyDown}
          className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4"
        >
          {all.map((src, index) => (
            <button
              key={`${src}-${index}`}
              ref={(el) => { thumbRefs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={index === activeIndex}
              aria-label={`Show picture ${index + 1} of ${all.length}`}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              className={cx(
                "relative aspect-square overflow-hidden rounded-panel border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne",
                index === activeIndex
                  ? "border-charcoal"
                  : "border-line hover:border-line-strong"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 30vw, 160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}