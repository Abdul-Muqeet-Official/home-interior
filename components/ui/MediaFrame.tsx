"use client";

/**
 * components/ui/MediaFrame.tsx
 * Every image on the site renders through this frame.
 *
 * Guarantees:
 *  - fixed aspect ratio, so nothing can cause layout shift
 *  - if a remote photograph fails to load (deleted CDN asset, offline, blocked),
 *    the frame silently swaps to studio artwork — never a grey box, never a
 *    broken-image icon, never visible alt text.
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { cx } from "@/lib/utils";
import { ensureAbsoluteImagePath } from "@/lib/content/image-src";
import MediaErrorBoundary from "./MediaErrorBoundary";

const DEFAULT_FALLBACK = "/media/texture-plaster.svg";

export interface MediaFrameProps {
  src: string;
  alt: string;
  /** CSS aspect-ratio value, e.g. "4 / 5". */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackSrc?: string;
  /** Small label shown over the artwork, e.g. "Studio visualisation". */
  note?: string | null;
  overlay?: "none" | "base" | "strong";
  /**
   * Encoder quality. 80 is the deliberate default for the catalogue
   * photography: at these display sizes it is visually indistinguishable from
   * 100 while cutting transferred bytes by roughly half.
   */
  quality?: number;
  children?: React.ReactNode;
}

export default function MediaFrame({
  src,
  alt,
  ratio = "4 / 5",
  sizes = "(max-width: 768px) 90vw, 33vw",
  priority = false,
  className,
  imageClassName,
  fallbackSrc = DEFAULT_FALLBACK,
  note = null,
  overlay = "none",
  quality = 80,
  children,
}: MediaFrameProps) {
  /*
   * Every image on the site renders through this frame, so the path is
   * sanitised here once and for all. A bare Supabase storage path
   * ("materials/folding-doors/...") is expanded to an absolute URL; an
   * unusable value falls back to artwork. Without this, next/image throws at
   * render time and takes the whole page down with it.
   */
  const safeSrc = ensureAbsoluteImagePath(src, { fallback: fallbackSrc });
  const safeFallbackSrc = ensureAbsoluteImagePath(fallbackSrc, { fallback: DEFAULT_FALLBACK });

  const [currentSrc, setCurrentSrc] = useState(safeSrc);
  const [usedFallback, setUsedFallback] = useState(false);
  /** Drives the low-res skeleton underneath the image until it has painted. */
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    if (usedFallback) return;
    setUsedFallback(true);
    setCurrentSrc(safeFallbackSrc);
  };

  // An already-cached image can finish decoding before React attaches onLoad,
  // so a permanent skeleton would otherwise be a real visual bug.
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => { if (!cancelled) setLoaded(true); };
    img.onerror = () => { if (!cancelled) setLoaded(true); };
    img.src = currentSrc;
    return () => { cancelled = true; };
  }, [currentSrc]);

  // SVG is already a vector format: there is nothing for the optimizer to resize or
  // re-encode, and passing it through /_next/image only risks an unsupported-source
  // response. Raster media (the real catalogue photography) still goes through
  // next/image, so the optimisation rules are unchanged for everything that benefits.
  const isVector = /\.svg($|\?)/i.test(currentSrc);

  return (
    <div
      className={cx("relative overflow-hidden bg-surface", className)}
      style={{ aspectRatio: ratio }}
    >
      {/* Skeleton sits beneath the image; it is removed from the a11y tree and
          from pointer events so it can never intercept a click. */}
      <div
        aria-hidden="true"
        data-skeleton={loaded ? "done" : "loading"}
        className={cx(
          "pointer-events-none absolute inset-0 bg-surface",
          "animate-pulse motion-reduce:animate-none",
          loaded && "opacity-0 transition-opacity duration-500"
        )}
      />

      {/* Contains any residual render failure to this frame only. */}
      <MediaErrorBoundary>
        <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          unoptimized={isVector}
          onError={handleError}
          onLoad={() => setLoaded(true)}
          className={cx("object-cover", imageClassName)}
        />
      </MediaErrorBoundary>

      {overlay === "base" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/45 via-charcoal/5 to-transparent"
        />
      )}
      {overlay === "strong" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/35 to-charcoal/20"
        />
      )}

      {note && (
        <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-charcoal/55 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur-sm">
          {note}
        </span>
      )}

      {children}
    </div>
  );
}
