"use client";

import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

interface InfiniteRailProps {
  children: React.ReactNode;
  ariaLabel: string;
  itemClassName?: string;
  autoplay?: boolean;
  autoplayMs?: number;
  className?: string;
  tone?: "light" | "dark";
}

export default function InfiniteRail({
  children,
  ariaLabel,
  itemClassName,
  autoplay = true,
  autoplayMs = 24,
  className,
  tone = "light",
}: InfiniteRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const items = Children.toArray(children);
  const canLoop = items.length > 1;
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const dark = tone === "dark";

  const normalize = useCallback(() => {
    const track = trackRef.current;
    if (!track || !canLoop) return;
    const setWidth = track.scrollWidth / 3;
    if (track.scrollLeft < setWidth * 0.25) track.scrollLeft += setWidth;
    if (track.scrollLeft > setWidth * 1.75) track.scrollLeft -= setWidth;
  }, [canLoop]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !canLoop) return;
    const setWidth = track.scrollWidth / 3;
    track.scrollLeft = setWidth;
  }, [canLoop, items.length]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.2 }
    );
    if (trackRef.current) observer.observe(trackRef.current);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, []);

  const active = autoplay && canLoop && !paused && !reducedMotion && tabVisible && inView && !hovered && !focused;

  useEffect(() => {
    if (!active) return;
    let animId: number;
    let lastTime: number | null = null;
    let subPixelAccumulator = 0;
    // Smooth quiet-luxury speed: ~38 pixels per second
    const pixelsPerSecond = 38;

    const step = (timestamp: number) => {
      if (lastTime === null) {
        lastTime = timestamp;
      }
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      // Limit dt spikes if tab was backgrounded
      const safeDt = Math.min(dt, 0.1);
      subPixelAccumulator += safeDt * pixelsPerSecond;

      if (subPixelAccumulator >= 1) {
        const px = Math.floor(subPixelAccumulator);
        subPixelAccumulator -= px;
        const track = trackRef.current;
        if (track) {
          track.scrollLeft += px;
          normalize();
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [active, normalize]);

  const move = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.72, behavior: reducedMotion ? "auto" : "smooth" });
    window.setTimeout(normalize, 500);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !trackRef.current) return;
    dragRef.current = { active: true, startX: event.clientX, startScroll: trackRef.current.scrollLeft };
    setPaused(true);
    trackRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;
    track.scrollLeft = dragRef.current.startScroll - (event.clientX - dragRef.current.startX);
    normalize();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !trackRef.current) return;
    dragRef.current.active = false;
    trackRef.current.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={cx("relative", className)}
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
        onScroll={normalize}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cx("infinite-rail-track rail-grab", dark && "infinite-rail-dark")}
      >
        {(canLoop ? [0, 1, 2] : [1]).map((copy) => (
          <div key={copy} aria-hidden={canLoop && copy !== 1} inert={canLoop && copy !== 1} className="infinite-rail-set">
            {items.map((child, index) => (
              <div key={`${copy}-${index}`} className={cx("infinite-rail-item", itemClassName)}>
                {child}
              </div>
            ))}
          </div>
        ))}
      </div>

      {canLoop && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button type="button" aria-label={`Previous ${ariaLabel.toLowerCase()}`} onClick={() => move(-1)} className={cx("flex h-11 w-11 items-center justify-center rounded-full border", dark ? "border-white/30 text-white hover:bg-white hover:text-charcoal" : "border-line-strong text-charcoal hover:bg-charcoal hover:text-white")}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" aria-label={`Next ${ariaLabel.toLowerCase()}`} onClick={() => move(1)} className={cx("flex h-11 w-11 items-center justify-center rounded-full border", dark ? "border-white/30 text-white hover:bg-white hover:text-charcoal" : "border-line-strong text-charcoal hover:bg-charcoal hover:text-white")}>
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <button type="button" aria-pressed={paused} aria-label={paused ? `Resume ${ariaLabel.toLowerCase()}` : `Pause ${ariaLabel.toLowerCase()}`} onClick={() => setPaused((value) => !value)} className={cx("flex h-11 w-11 items-center justify-center rounded-full", dark ? "text-white/70 hover:text-white" : "text-muted hover:text-charcoal")}>
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
