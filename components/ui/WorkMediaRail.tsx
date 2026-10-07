"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EmptyState from "./EmptyState";
import InfiniteRail from "./InfiniteRail";
import { EMPTY_STATES, WORK } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";
import type { Project } from "@/lib/content/types";
import type { LocalWorkMedia } from "@/lib/content/work-media";
import { cx } from "@/lib/utils";

/**
 * A rail video whose source is only attached once the card approaches the
 * viewport.
 *
 * The rail renders three copies of every item for a seamless loop, so eagerly
 * setting `src` meant dozens of simultaneous metadata/byte requests for footage
 * the visitor may never scroll to. The element, its poster and its playback
 * behaviour are unchanged — only the moment the source is attached changes.
 *
 * Accessibility note: `prefers-reduced-motion` visitors get the poster and no
 * autoplay, matching the rail's own reduced-motion behaviour.
 */
function VideoMedia({ src, poster, label }: { src: string; poster?: string | null; label: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const node = holderRef.current;
    if (!node || shouldLoad) return;

    // Start fetching shortly before the card is actually on screen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  // Reduced motion: show the poster only, never autoplay.
  if (reducedMotion) {
    return (
      <div ref={holderRef} className="h-full w-full">
        {poster ? (
          <Image src={poster} alt={label} fill sizes="(max-width: 767px) 78vw, 25vw" className="object-cover" />
        ) : null}
      </div>
    );
  }

  return (
    <div ref={holderRef} className="h-full w-full">
      <video
        src={shouldLoad ? src : undefined}
        data-src={src}
        poster={poster ?? undefined}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className="h-full w-full object-cover"
      />
    </div>
  );
}


/**
 * Studio showcase media — footage and stills recorded by the studio, shown only
 * while no project record has been published. Titles come from the source files,
 * so nothing here is invented.
 */
function ShowcaseCard({ media }: { media: LocalWorkMedia }) {
  return (
    <article>
      <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface">
        {media.type === "video" ? (
          <VideoMedia src={media.src} label={media.title} />
        ) : (
          <Image
            src={media.src}
            alt={media.title}
            fill
            loading="lazy"
            sizes="(max-width: 767px) 78vw, 25vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="mt-4">
        <p className="eyebrow">{WORK.showcaseNote}</p>
        <h3 className="mt-2 font-serif text-2xl leading-snug text-charcoal">{media.title}</h3>
      </div>
    </article>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/our-work/${project.slug}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface">
        {project.videoUrl ? <VideoMedia src={project.videoUrl} poster={project.videoPoster ?? project.heroImage} label={`${project.title} project video`} /> : <Image src={project.heroImage} alt={`${project.title}${project.location ? `, ${project.location}` : ""}`} fill sizes="(max-width: 767px) 78vw, 25vw" className="object-cover transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.03]" />}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Our Work</p>
          <h3 className="mt-2 font-serif text-2xl leading-snug text-charcoal">{project.title}</h3>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted">{[project.type, project.location, project.year].filter(Boolean).join(" · ")}</p>
        </div>
        <span className="link-editorial shrink-0 pt-1 text-champagne">View project <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

export default function WorkMediaRail({ projects, localMedia }: { projects: Project[]; localMedia: LocalWorkMedia[] }) {
  const videosRef = useRef<HTMLDivElement>(null);
  /** Real published projects always win; the studio showcase only fills the gap. */
  const list = projects.slice(0, 6);
  const useProjects = list.length > 0;

  useEffect(() => {
    const root = videosRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) void video.play().catch(() => undefined);
        else video.pause();
      });
    }, { threshold: 0.15 });
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [useProjects, localMedia.length]);

  if (!useProjects && localMedia.length === 0) {
    return (
      <EmptyState
        title={EMPTY_STATES.projects.title}
        body={EMPTY_STATES.projects.body}
        actions={[
          { label: "REQUEST A CONSULTATION", href: "/consultation" },
          { label: "WHATSAPP", href: SITE.whatsappUrl, variant: "outline", external: true },
        ]}
      />
    );
  }

  return (
      <div ref={videosRef} className={cx("relative", useProjects && "work-project-rail", "rail-fade")}>
      <InfiniteRail
        ariaLabel="Our Work window"
        itemClassName="work-media-item"
        autoplay
        autoplayMs={28}
      >
        {useProjects
          ? list.map((project) => <ProjectCard key={project.slug} project={project} />)
          : localMedia.map((media) => <ShowcaseCard key={media.src} media={media} />)}
      </InfiniteRail>
    </div>
  );
}
