/**
 * app/our-work/[slug]/page.tsx
 * Project detail. Only factual Supabase content is displayed.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import MediaFrame from "@/components/ui/MediaFrame";
import Reveal from "@/components/ui/Reveal";
import { getProjectBySlug, getProjects } from "@/lib/supabase/queries";
import { WORK } from "@/lib/content/editorial";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = { params: { slug: string } };

export async function generateStaticParams() {
  const projects = await getProjects({ limit: 40 });
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return { title: "Project not found" };

  return {
    title: project.title,
    description:
      project.summary ??
      `${project.title} — residential interior project by HOME INTERIOR.`,
    alternates: { canonical: `/our-work/${project.slug}` },
  };
}

async function RelatedProjectsStream({ currentSlug }: { currentSlug: string }) {
  const allProjects = await getProjects({ limit: 4 });
  const related = allProjects.filter((entry) => entry.slug !== currentSlug).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="section bg-surface" aria-labelledby="related-projects">
      <div className="container-wide">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="related-projects" className="display-3 text-charcoal">
            More projects
          </h2>
          <Link href="/our-work" className="link-editorial">
            All work
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((entry) => (
            <li key={entry.slug}>
              <Link href={`/our-work/${entry.slug}`} className="group block">
                <MediaFrame
                  src={entry.heroImage}
                  alt={entry.title}
                  ratio="4 / 3"
                  sizes="(max-width: 640px) 92vw, 400px"
                  className="rounded-card border border-line"
                  imageClassName="transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.04]"
                  fallbackSrc="/media/band-light.svg"
                />
                <h3 className="mt-5 text-xl text-charcoal">{entry.title}</h3>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted">
                  {[entry.type, entry.location, entry.year].filter(Boolean).join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default async function ProjectPage({ params }: PageProps) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const facts = [
    { label: "Location", value: project.location },
    { label: "Project type", value: project.type },
    { label: "Year", value: project.year ? String(project.year) : null },
  ].filter((fact) => Boolean(fact.value));

  return (
    <main id="main">
      <section className="pb-10 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Our Work", href: "/our-work" },
              { label: project.title },
            ]}
          />
        </div>
      </section>

      <section className="pb-14">
        <div className="container-wide">
          <Reveal>
            <h1 className="display-1 max-w-4xl text-charcoal">{project.title}</h1>
            {project.summary && <p className="lede mt-6 max-w-2xl">{project.summary}</p>}

            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-muted">
              {WORK.noPricing}
            </p>

            {facts.length > 0 && (
              <dl className="mt-10 grid gap-8 sm:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="eyebrow">{fact.label}</dt>
                    <dd className="mt-2 text-sm text-charcoal">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide">
          {project.videoUrl ? (
            <video
              src={project.videoUrl}
              poster={project.videoPoster ?? project.heroImage}
              autoPlay
              muted
              playsInline
              loop
              controls
              className="rounded-card border border-line w-full"
              style={{ aspectRatio: "16 / 9" }}
            />
          ) : (
            <MediaFrame
              src={project.heroImage}
              alt={`${project.title}${project.location ? `, ${project.location}` : ""}`}
              ratio="16 / 9"
              sizes="100vw"
              priority
              className="rounded-card border border-line"
              fallbackSrc="/media/band-stone.svg"
              note={project.usingStudioArtwork ? "Studio visualisation" : null}
            />
          )}
        </div>
      </section>

      {(project.description || project.gallery.length > 0) && (
        <section className="section bg-pure" aria-labelledby="project-narrative">
          <div className="container-wide grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">Design approach</p>
              <h2 id="project-narrative" className="display-3 mt-4 text-charcoal">
                Notes from the project
              </h2>
            </div>
            <div className="lg:col-span-8">
              {project.description ? (
                <div className="space-y-5">
                  {project.description.split(/\n{2,}/).map((paragraph) => (
                    <p key={paragraph} className="lede">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="lede">
                  A written account of this project will be published with the owner’s permission.
                </p>
              )}

              {project.gallery.length > 0 && (
                <ul className="mt-10 grid gap-5 sm:grid-cols-2">
                  {project.gallery.map((image, index) => (
                    <li key={`${image}-${index}`}>
                      <MediaFrame
                        src={image}
                        alt={`${project.title} — gallery view ${index + 1}`}
                        ratio="4 / 3"
                        sizes="(max-width: 640px) 92vw, 400px"
                        className="rounded-card border border-line"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {project.videoGallery.length > 0 && (
        <section className="section" aria-labelledby="project-videos">
          <div className="container-wide">
            <p className="eyebrow">Moving image</p>
            <h2 id="project-videos" className="display-3 mt-4 text-charcoal">Project videos</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {project.videoGallery.map((video, index) => (
                <video key={`${video}-${index}`} src={video} poster={project.videoPoster ?? project.heroImage} controls muted playsInline preload="metadata" className="w-full border border-line" />
              ))}
            </div>
          </div>
        </section>
      )}

      {project.beforeImage && project.afterImage && (
        <section className="section" aria-labelledby="before-after">
          <div className="container-wide">
            <p className="eyebrow">Transformation</p>
            <h2 id="before-after" className="display-3 mt-4 text-charcoal">
              Before and after
            </h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <figure>
                <MediaFrame
                  src={project.beforeImage}
                  alt={`${project.title} — before works`}
                  ratio="4 / 3"
                  sizes="(max-width: 1024px) 92vw, 600px"
                  className="rounded-card border border-line"
                />
                <figcaption className="eyebrow mt-4">Before</figcaption>
              </figure>
              <figure>
                <MediaFrame
                  src={project.afterImage}
                  alt={`${project.title} — completed interior`}
                  ratio="4 / 3"
                  sizes="(max-width: 1024px) 92vw, 600px"
                  className="rounded-card border border-line"
                />
                <figcaption className="eyebrow mt-4">After</figcaption>
              </figure>
            </div>
          </div>
        </section>
      )}

      <Suspense fallback={<div className="container-wide py-12"><div className="h-64 rounded-editorial bg-surface animate-pulse" /></div>}>
        <RelatedProjectsStream currentSlug={project.slug} />
      </Suspense>

      <ConsultationCTA />
    </main>
  );
}
