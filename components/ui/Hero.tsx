"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HERO } from "@/lib/content/editorial";
import { cx } from "@/lib/utils";

const ROTATION_MS = 5200;
const FALLBACK = "/media/hero-01.svg";

export default function Hero() {
  const [sources, setSources] = useState<string[]>(() => HERO.slides.map((slide) => slide.src));
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    let timer: number | undefined;

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        setCurrent((index) => (index + 1) % HERO.slides.length);
      }, ROTATION_MS);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.clearInterval(timer);
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [paused, reducedMotion]);

  const handleError = useCallback((index: number) => {
    setSources((previous) => {
      if (previous[index] === FALLBACK) return previous;
      const next = [...previous];
      next[index] = FALLBACK;
      return next;
    });
  }, []);

  const selectSlide = (index: number) => {
    setCurrent(index);
    setPaused(true);
  };

  return (
    <section
      aria-label="HOME INTERIOR — curated collection"
      className="relative isolate flex h-[84svh] min-h-[560px] w-full items-end overflow-hidden"
    >
      {HERO.slides.map((slide, index) => (
        <div
          key={slide.src}
          aria-hidden={index !== current}
          className={cx(
            "absolute inset-0 transition-opacity duration-[1400ms] ease-editorial",
            index === current ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={sources[index]}
            alt={slide.caption}
            fill
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            sizes="100vw"
            onError={() => handleError(index)}
            className={cx(
              "object-cover",
              index === current && !reducedMotion && "hero-media-active"
            )}
          />
        </div>
      ))}

      <div className="container-editorial relative z-10 pb-12 pt-32 sm:pb-16">
        <p className="eyebrow text-champagne">{HERO.eyebrow}</p>

        <h1 className="display-1 mt-5 max-w-3xl text-white text-shadow-editorial">
          {HERO.heading.replace(HERO.highlight, "").trim()} <span className="ital">{HERO.highlight}</span>
        </h1>

        <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
          {HERO.subtext}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={HERO.primaryCta.href} className="btn btn-light">
            {HERO.primaryCta.label}
          </Link>
          <Link href={HERO.secondaryCta.href} className="btn btn-outline-light">
            {HERO.secondaryCta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3" role="group" aria-label="Hero imagery">
            {HERO.slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-current={index === current}
                aria-label={`Show image ${index + 1} of ${HERO.slides.length}`}
                onClick={() => selectSlide(index)}
                className={cx(
                  "h-[2px] w-10 transition-colors duration-500",
                  index === current ? "bg-champagne" : "bg-white/35 hover:bg-white/70"
                )}
              />
            ))}
          </div>
          <p className="max-w-md text-[11px] uppercase tracking-[0.18em] text-white/70">
            Surface study — stone, oak and shadow line detailing.
          </p>
        </div>
      </div>
    </section>
  );
}