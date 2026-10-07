/**
 * lib/content/services.ts
 * Studio services — the disciplines the practice offers, as approved in the brief.
 */

import type { Service } from "./types";

export const STUDIO_SERVICES: Service[] = [
  {
    slug: "interior-architecture",
    title: "Interior Architecture",
    meta: "Spatial planning",
    description:
      "Space planning, circulation and built form resolved before a single finish is chosen — walls, openings and volumes drawn to suit how a room is actually lived in.",
  },
  {
    slug: "residential-interior-design",
    title: "Residential Interior Design",
    meta: "Full residence",
    description:
      "Complete residential interiors: layouts, joinery, lighting, finishes and furnishing, developed as one coordinated scheme from entry hall to private rooms.",
  },
  {
    slug: "living-room-design",
    title: "Living Room Design",
    meta: "Principal reception",
    description:
      "Seating compositions, feature walls, concealed lighting and material layering that give the principal reception room presence without noise.",
  },
  {
    slug: "bedroom-interiors",
    title: "Bedroom Interiors",
    meta: "Private rooms",
    description:
      "Calm, tactile bedrooms: bedside joinery, wardrobes, layered lighting and acoustic softness for rest.",
  },
  {
    slug: "kitchen-renovation",
    title: "Kitchen Renovation",
    meta: "Kitchen & utility",
    description:
      "Ergonomic kitchen layouts with custom cabinetry, durable work surfaces and a considered lighting plan for both working and gathering.",
  },
  {
    slug: "gypsum-ceiling-design",
    title: "Gypsum Ceiling Design",
    meta: "Ceilings",
    description:
      "Designed ceilings that shape daylight and artificial light — coves, shadow gaps and concealed service routes.",
  },
  {
    slug: "wall-surface-finishes",
    title: "Wall & Surface Finishes",
    meta: "Finishes",
    description:
      "Panelling, wallpaper, textured plaster and stone-look surfaces installed with precise junction detailing.",
  },
  {
    slug: "turnkey-project-management",
    title: "Turnkey Project Management",
    meta: "Execution",
    description:
      "One point of coordination from drawing to handover — procurement, site supervision, quality checks and snagging.",
  },
];
