"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CollectionMediaItem } from "@/lib/content/types";
import MediaFrame from "./MediaFrame";

export default function CollectionMediaGallery({ items, title }: { items: CollectionMediaItem[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => { const trigger = triggerRef.current; setActiveIndex(null); window.setTimeout(() => trigger?.focus(), 0); }, []);
  const move = useCallback((direction: 1 | -1) => setActiveIndex((current) => current === null ? null : (current + direction + items.length) % items.length), [items.length]);
  useEffect(() => {
    if (activeIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "ArrowRight") move(1); if (event.key === "ArrowLeft") move(-1); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, [activeIndex, close, move]);
  if (items.length === 0) return <p className="text-sm text-muted">New collection material is being prepared.</p>;
  const active = activeIndex === null ? null : items[activeIndex];
  return <>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => <button key={item.id} ref={index === 0 ? triggerRef : undefined} type="button" onClick={() => setActiveIndex(index)} className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" aria-label={`Open ${item.alt}`}>
        <MediaFrame src={item.type === "image" ? item.src : (item.poster ?? "/media/texture-plaster.svg")} alt={item.alt} ratio="4 / 5" sizes="(max-width: 640px) 90vw, 30vw" className="border border-line" imageClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.03]" />
        <span className="mt-3 block text-sm text-charcoal">{item.caption || `${title} — media ${index + 1}`}</span>
      </button>)}
    </div>
    {active && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-charcoal/95 p-4" role="dialog" aria-modal="true" aria-label={`${title} media viewer`}>
      <button type="button" className="absolute right-4 top-4 min-h-11 min-w-11 text-white" onClick={close} aria-label="Close viewer">Close</button>
      {items.length > 1 && <button type="button" className="absolute left-3 top-1/2 min-h-11 min-w-11 text-2xl text-white" onClick={() => move(-1)} aria-label="Previous media">‹</button>}
      <div className="max-h-[88vh] max-w-5xl">{active.type === "video" ? <video src={active.src} poster={active.poster} controls playsInline preload="metadata" className="max-h-[88vh] max-w-full" aria-label={active.alt} /> : <Image src={active.src} alt={active.alt} width={active.width || 1600} height={active.height || 1200} className="max-h-[88vh] max-w-full object-contain" unoptimized />}</div>
      {items.length > 1 && <button type="button" className="absolute right-3 top-1/2 min-h-11 min-w-11 text-2xl text-white" onClick={() => move(1)} aria-label="Next media">›</button>}
      <p className="absolute bottom-4 text-xs tracking-[0.18em] text-white/70">{String((activeIndex ?? 0) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p>
    </div>}
  </>;
}
