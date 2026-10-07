"use client";

/**
 * components/ui/MaterialCollection.tsx
 * Generic editorial presentation for any material collection: a featured lead
 * still, the edit-note panel (archive facts), then a Rail carrying the rest of
 * the stills and any walkthrough film.
 *
 * Driven entirely by props so that every collection renders through the same
 * architecture — ceiling, grass, doors, panels, and future additions alike.
 *
 * The film is muted, looping and plays inline. It autoplays only while visible
 * and never autoplays for visitors who prefer reduced motion — those visitors
 * receive native controls instead.
 */

import { useEffect, useRef, useState } from "react";
import MediaFrame from "./MediaFrame";
import Rail from "./Rail";
import type { CollectionMediaItem } from "@/lib/content/types";

export interface CollectionCopy {
  editHeading: string;
  editNote: string;
}

export interface CollectionStats {
  photographs: number;
  films: number;
  sourceFrames: number;
}

function FilmCard({ item, reducedMotion }: { item: CollectionMediaItem; reducedMotion: boolean }) {
  return (
    <article>
      <div
        className="relative overflow-hidden rounded-card border border-line bg-surface"
        style={{ aspectRatio: "4 / 5" }}
      >
        <video
          src={item.src}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="metadata"
          autoPlay={!reducedMotion}
          controls={reducedMotion}
          aria-label={item.alt}
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/25 bg-charcoal/55 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur-sm">
          Film · {item.caption}
        </span>
      </div>
      <div className="mt-4">
        <p className="eyebrow">
          Walkthrough · {item.width} × {item.height}
        </p>
        <h3 className="mt-2 font-serif text-xl leading-snug text-charcoal">{item.caption}</h3>
      </div>
    </article>
  );
}

function StillCard({ item, index }: { item: CollectionMediaItem; index: number }) {
  return (
    <article>
      <MediaFrame
        src={item.src}
        alt={item.alt}
        ratio="4 / 5"
        sizes="(max-width: 640px) 74vw, 330px"
        className="rounded-card border border-line"
      />
      <div className="mt-4">
        <p className="eyebrow">
          {String(index).padStart(2, "0")} · {item.width} × {item.height}
        </p>
        <h3 className="mt-2 font-serif text-xl leading-snug text-charcoal">{item.caption}</h3>
      </div>
    </article>
  );
}

export interface MaterialCollectionProps {
  items: CollectionMediaItem[];
  copy: CollectionCopy;
  stats: CollectionStats;
  railAria?: string;
}

export default function MaterialCollection({
  items,
  copy,
  stats,
  railAria = "Collection stills and walkthrough film",
}: MaterialCollectionProps) {
  const [lead, ...rest] = items;
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    if (videos.length === 0) return;

    if (reducedMotion) {
      videos.forEach((video) => video.pause());
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) void video.play().catch(() => undefined);
          else video.pause();
        });
      },
      { threshold: 0.25 }
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [reducedMotion, items]);

  if (!lead) return null;

  return (
    <div ref={containerRef}>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8">
          <MediaFrame
            src={lead.src}
            alt={lead.alt}
            ratio="16 / 10"
            sizes="(max-width: 1024px) 92vw, 900px"
            priority
            className="rounded-card border border-line"
            overlay="base"
          />
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="eyebrow">Featured · {lead.id}</p>
            <p className="max-w-xl text-sm leading-relaxed text-muted">{lead.caption}</p>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-card border border-line bg-surface p-8">
            <p className="eyebrow">{copy.editHeading}</p>
            <p className="mt-5 text-sm leading-relaxed text-muted">{copy.editNote}</p>
            <dl className="mt-8">
              <div className="flex items-baseline justify-between gap-4 border-t border-line py-4">
                <dt className="eyebrow">Photographs</dt>
                <dd className="text-sm text-charcoal">{stats.photographs}</dd>
              </div>
              {stats.films > 0 && (
                <div className="flex items-baseline justify-between gap-4 border-t border-line py-4">
                  <dt className="eyebrow">Film</dt>
                  <dd className="text-sm text-charcoal">{stats.films}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-line py-4">
                <dt className="eyebrow">Source archive</dt>
                <dd className="text-sm text-charcoal">{stats.sourceFrames} frames</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {rest.length > 0 && (
        <div className="mt-14 rail-fade">
          <Rail
            ariaLabel={railAria}
            itemClassName="w-[74vw] max-w-[330px] sm:w-[300px] lg:w-[330px]"
            autoplayMs={4200}
          >
            {rest.map((item, index) =>
              item.type === "video" ? (
                <FilmCard key={item.id} item={item} reducedMotion={reducedMotion} />
              ) : (
                <StillCard key={item.id} item={item} index={index + 2} />
              )
            )}
          </Rail>
        </div>
      )}
    </div>
  );
}
