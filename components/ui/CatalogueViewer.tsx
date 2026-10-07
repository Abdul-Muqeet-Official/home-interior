"use client";

/**
 * components/ui/CatalogueViewer.tsx
 *
 * The premium catalogue viewer used by the Carpet Tile collections.
 *
 * A controlled, accessible lightbox over already-rendered WebP pages:
 *  - grid of lazy thumbnails; only the first band is eagerly loaded
 *  - dialog with focus trap, focus return, Escape, arrow keys and touch swipe
 *  - body scroll lock, scroll restoration and reduced-motion support
 *  - only the current page and its immediate neighbours load at full size
 *  - stable aspect ratio on every frame, so there is no layout shift
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CollectionMediaItem } from "@/lib/content/types";

interface Props {
  items: CollectionMediaItem[];
  title: string;
  /** Accessible label for the trigger grid. */
  label?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Pages rendered into the grid on first paint. A large catalogue must never put
 * hundreds of <img> elements into the DOM at once; the rest arrives on demand.
 */
const INITIAL_PAGES = 24;
const PAGE_STEP = 24;

export default function CatalogueViewer({ items, title, label }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedIndex, setLoadedIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGES);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const count = items.length;

  const close = useCallback(() => {
    const trigger = triggerRefs.current[0] ?? null;
    setActiveIndex(null);
    setLoadedIndex(null);
    window.setTimeout(() => trigger?.focus(), 0);
  }, []);

  const move = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null || count === 0) return current;
        return (current + direction + count) % count;
      });
    },
    [count]
  );

  // Dialog behaviour: scroll lock, keyboard, focus trap, scroll restoration.
  useEffect(() => {
    if (activeIndex === null) return;

    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
        return;
      }
      if (event.key !== "Tab") return;

      // The trap must span the whole dialog - header controls included - not just the
      // image scroll area, or Tab would escape past the close control.
      const root = rootRef.current ?? dialogRef.current;
      if (!root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => {
      // The autofocus target (the close control) lives in the dialog header, which is a
      // sibling of the scroll area, so it must be found from the dialog root - not from
      // the inner scroll container.
      const target =
        rootRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [activeIndex, close, move]);

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || count < 2) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    move(dx < 0 ? 1 : -1);
  };

  if (count === 0) {
    return (
      <p className="text-sm text-muted">
        This collection is being prepared for the studio library.
      </p>
    );
  }

  const active = activeIndex === null ? null : items[activeIndex];
  return (
    <>
      <ul
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
        aria-label={label ?? `${title} catalogue pages`}
      >
        {items.slice(0, visibleCount).map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              onClick={() => setActiveIndex(index)}
              className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-pure"
              aria-label={`Open ${title} catalogue page ${index + 1} of ${count}`}
            >
              <span className="relative block w-full overflow-hidden bg-surface">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width || 1200}
                  height={item.height || 1200}
                  loading={index < 4 ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                  className="h-auto w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                />
                <span className="pointer-events-none absolute inset-0 border border-line opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </span>
              <span className="mt-3 block text-[11px] uppercase tracking-[0.2em] text-muted">
                Page {String(index + 1).padStart(2, "0")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {visibleCount < count && (
        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Showing {visibleCount} of {count} pages
          </p>
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + PAGE_STEP)}
            className="btn btn-outline min-h-11"
          >
            LOAD MORE PAGES
          </button>
        </div>
      )}

      {active && activeIndex !== null && (
        <div
          ref={rootRef}
          className="fixed inset-0 z-[90] flex flex-col bg-charcoal/95"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} catalogue viewer`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <p className="min-w-0 flex-1 truncate text-[11px] uppercase tracking-[0.24em] text-white/70">
              {title}
            </p>
            <p className="shrink-0 text-[11px] tabular-nums tracking-[0.24em] text-white/70">
              {String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </p>
            <button
              type="button"
              data-autofocus
              onClick={close}
              className="inline-flex min-h-11 shrink-0 items-center justify-center border border-white/25 px-4 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
              aria-label="Close catalogue viewer"
            >
              Close
            </button>
          </div>

          <div
            ref={dialogRef}
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-16"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {count > 1 && (
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center border border-white/25 text-xl text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne sm:left-4"
                aria-label="Previous catalogue page"
              >
                <span aria-hidden="true">‹</span>
              </button>
            )}

            <div className="relative flex h-full max-h-full w-full max-w-5xl items-center justify-center">
              {loadedIndex !== activeIndex && (
                <span
                  className="absolute inset-0 m-auto h-10 w-10 animate-pulse border border-white/20"
                  aria-hidden="true"
                />
              )}
              <Image
                src={active.src}
                alt={active.alt}
                width={active.width || 1600}
                height={active.height || 1200}
                onLoad={() => setLoadedIndex(activeIndex)}
                priority
                sizes="(max-width: 1024px) 92vw, 80vw"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {count > 1 && (
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center border border-white/25 text-xl text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne sm:right-4"
                aria-label="Next catalogue page"
              >
                <span aria-hidden="true">›</span>
              </button>
            )}
          </div>

          {/* Neighbour preloading keeps navigation instant without flooding the browser. */}
          <div aria-hidden="true" className="sr-only">
            {[activeIndex - 1, activeIndex + 1]
              .filter((index) => index >= 0 && index < count)
              .map((index) => (
                <Image
                  key={items[index].id}
                  src={items[index].src}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="h-px w-px"
                />
              ))}
          </div>
        </div>
      )}
    </>
  );
}
