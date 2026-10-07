"use client";

/**
 * components/ui/Rail.tsx
 * Horizontal "running window" used for materials, portfolio and reviews.
 *
 * Native scroll + snap, mouse drag, touch swipe, previous/next controls and an
 * optional gentle autoplay that pauses on hover, focus, hidden tab, off-screen
 * position or reduced-motion preference. Fully keyboard operable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

interface RailProps {
  children: React.ReactNode;
  ariaLabel: string;
  itemClassName?: string;
  /** Autoplay interval in ms. 0 disables autoplay entirely. */
  autoplayMs?: number;
  className?: string;
  trackClassName?: string;
  showProgress?: boolean;
  showPauseControl?: boolean;
  /** Visual tone of the controls; use "dark" on charcoal sections. */
  tone?: "light" | "dark";
}

export default function Rail({
  children,
  ariaLabel,
  itemClassName,
  autoplayMs = 0,
  className,
  trackClassName,
  showProgress = true,
  showPauseControl = true,
  tone = "light",
}: RailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
    captured: false,
  });
  const suppressClick = useRef(false);

  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(max <= 4 || track.scrollLeft >= max - 4);
    setProgress(max <= 4 ? 1 : Math.min(1, Math.max(0, track.scrollLeft / max)));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateEdges();
    const handleScroll = () => updateEdges();
    track.addEventListener("scroll", handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateEdges());
      resizeObserver.observe(track);
    }

    return () => {
      track.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
    };
  }, [updateEdges, children]);

  /* Autoplay gating ---------------------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => setInView(entry.isIntersecting)),
        { threshold: 0.2 }
      );
      observer.observe(track);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(track.clientWidth * 0.85, 260);
    const max = track.scrollWidth - track.clientWidth;

    if (direction === 1 && track.scrollLeft >= max - 4) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && track.scrollLeft <= 4) {
      track.scrollTo({ left: max, behavior: "smooth" });
      return;
    }
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }, []);

  const autoplayActive =
    autoplayMs > 0 &&
    !reducedMotion &&
    !userPaused &&
    !hovered &&
    !focused &&
    !dragging &&
    inView &&
    tabVisible;

  useEffect(() => {
    if (!autoplayActive) return;
    const id = window.setInterval(() => scrollByPage(1), autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayActive, autoplayMs, scrollByPage]);

  /* Pointer drag -------------------------------------------------------
     Pointer capture is engaged only once a real drag passes the movement
     threshold. Capturing on pointer-down retargets the subsequent click
     to the track in some browsers, so card links would stop navigating.
     Below the threshold the gesture stays a click and reaches the link. */
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || event.pointerType === "touch" || event.button !== 0) return;
    dragState.current = {
      active: true,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
      captured: false,
    };
    /* Safety net: if the pointer is released off-track before the drag
       threshold engages capture, clear the pending gesture so the rail
       can never stay in a stuck drag state. */
    const clearPending = () => {
      dragState.current.active = false;
      window.removeEventListener("pointerup", clearPending);
      window.removeEventListener("pointercancel", clearPending);
    };
    window.addEventListener("pointerup", clearPending, { once: true });
    window.addEventListener("pointercancel", clearPending, { once: true });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const state = dragState.current;
    if (!track || !state.active) return;
    const delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(delta) > 4) {
      /* A real drag has begun — claim the pointer now and start scrolling. */
      state.moved = true;
      state.captured = true;
      track.setPointerCapture?.(event.pointerId);
      setDragging(true);
    }
    if (state.moved) {
      track.scrollLeft = state.startScroll - delta;
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const state = dragState.current;
    if (!track || !state.active) return;
    state.active = false;
    if (state.captured) {
      track.releasePointerCapture?.(event.pointerId);
      setDragging(false);
    }
    if (state.moved) {
      /* The gesture was a drag — suppress the click that follows it. */
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 320);
    }
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByPage(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByPage(-1);
    }
  };

  const dark = tone === "dark";

  const controlClass = cx(
    "flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-30",
    dark
      ? "border-white/30 text-white hover:bg-white hover:text-charcoal"
      : "border-line-strong text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-white"
  );

  return (
    <div
      className={cx("relative", dark && "on-dark", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        data-dragging={dragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
        className={cx("rail rail-grab", trackClassName)}
      >
        {Array.isArray(children) ? (
          children.map((child, index) => (
            <div key={index} className={cx("rail-item", itemClassName)}>
              {child}
            </div>
          ))
        ) : (
          <div className={cx("rail-item", itemClassName)}>{children}</div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll collection left"
            className={controlClass}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Scroll collection right"
            className={controlClass}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {autoplayMs > 0 && showPauseControl && (
            <button
              type="button"
              onClick={() => setUserPaused((paused) => !paused)}
              aria-pressed={userPaused}
              aria-label={userPaused ? "Resume automatic scrolling" : "Pause automatic scrolling"}
              className={cx(
                "ml-1 flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                dark ? "text-white/60 hover:text-white" : "text-muted hover:text-charcoal"
              )}
            >
              {userPaused ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M8 5l11 7-11 7V5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {showProgress && (
          <div className={cx("relative h-px flex-1", dark ? "bg-white/15" : "bg-line")} aria-hidden="true">
            <span
              className="absolute inset-y-0 left-0 bg-champagne transition-[width] duration-500 ease-editorial"
              style={{ width: `${Math.max(6, progress * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
