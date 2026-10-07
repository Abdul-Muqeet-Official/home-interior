/**
 * lib/content/artificial-grass.ts
 *
 * Canonical data source for the Artificial Grass collection — the single file
 * every surface reads (homepage preview, Artificial Grass collection page).
 *
 * Provenance — source folder:
 *   C:\Users\DELL\Pictures\Artificial grass
 *   10 JPEG frames (no film in this collection).
 *
 * Derivatives published in public/media/artificial-grass/:
 *   cover.jpeg      — the exact cover asset (the lead featured image)
 *   ag-02.jpeg … ag-10.jpeg — editorial stills, verbatim copies of source frames
 *
 * Source folder is never modified.
 */

import type { CollectionMediaItem } from "./types";

/** Canonical route for the full collection. */
export const ARTIFICIAL_GRASS_ROUTE = "/materials/artificial-grass";

/**
 * Published edit in editorial order — first entry is the featured lead.
 * Source frames retained as distinct scenes. Same-dimension pairs at the
 * same timestamp are near-identical re-saves; the sharper frame is kept where
 * a choice existed.
 */
export const ARTIFICIAL_GRASS_ITEMS: CollectionMediaItem[] = [
  {
    id: "ag-01",
    type: "image",
    src: "/media/artificial-grass/cover.jpeg",
    width: 736,
    height: 736,
    alt: "Close-up of artificial turf fibres catching morning light, showing the spring-green blade texture against a neutral backdrop.",
    caption: "Blade texture, backlit at dawn.",
  },
  {
    id: "ag-02",
    type: "image",
    src: "/media/artificial-grass/ag-02.jpeg",
    width: 736,
    height: 920,
    alt: "A rolling lawn of artificial turf edged against pale stone paving, shadow lines running across the surface.",
    caption: "Lawns edged against stone.",
  },
  {
    id: "ag-03",
    type: "image",
    src: "/media/artificial-grass/ag-03.jpeg",
    width: 720,
    height: 1280,
    alt: "Vertical tuft of artificial grass held against a balustrade, the pile depth visible in a tight study.",
    caption: "Pile depth, held to the light.",
  },
  {
    id: "ag-04",
    type: "image",
    src: "/media/artificial-grass/ag-04.jpeg",
    width: 736,
    height: 805,
    alt: "A wide terrace of artificial turf extending towards a boundary wall, the surface even and unruffled.",
    caption: "Terrace run, evening shadow.",
  },
  {
    id: "ag-05",
    type: "image",
    src: "/media/artificial-grass/ag-05.jpeg",
    width: 736,
    height: 981,
    alt: "Detail of artificial grass along a step riser, fibres brushed in one direction showing the lay.",
    caption: "Step riser, brushed lay.",
  },
  {
    id: "ag-06",
    type: "image",
    src: "/media/artificial-grass/ag-06.jpeg",
    width: 736,
    height: 1268,
    alt: "Full-height shot of a balcony planted entirely in artificial turf, railings and planters framing the green.",
    caption: "Balcony planted in turf.",
  },
  {
    id: "ag-07",
    type: "image",
    src: "/media/artificial-grass/ag-07.jpeg",
    width: 735,
    height: 981,
    alt: "A path cutting through a garden of artificial grass, stone pavers set in a herringbone pattern.",
    caption: "Herringbone path through turf.",
  },
  {
    id: "ag-08",
    type: "image",
    src: "/media/artificial-grass/ag-08.jpeg",
    width: 736,
    height: 736,
    alt: "Macro of the backing mesh of artificial turf, the fibre attachment and drainage holes visible in cross-section.",
    caption: "Backing, drainage and stitch detail.",
  },
  {
    id: "ag-09",
    type: "image",
    src: "/media/artificial-grass/ag-09.jpeg",
    width: 736,
    height: 736,
    alt: "A curved lawn edging in artificial turf, the boundary between grass and hardscape softened by a radius.",
    caption: "Curved edging detail.",
  },
  {
    id: "ag-10",
    type: "image",
    src: "/media/artificial-grass/ag-10.jpeg",
    width: 736,
    height: 920,
    alt: "Two tones of artificial grass meeting at a seam, the join invisible under the brushing.",
    caption: "Two-tone seam, brushed to blend.",
  },
];

/** Featured lead — first entry of the editorial order. */
export const ARTIFICIAL_GRASS_FEATURED: CollectionMediaItem = ARTIFICIAL_GRASS_ITEMS[0];

/** Curated homepage subset: stills only, in editorial order. */
export function artificialGrassPreview(count = 4): CollectionMediaItem[] {
  return ARTIFICIAL_GRASS_ITEMS.filter((item) => item.type === "image").slice(0, count);
}

/** Shared editorial copy for every surface that presents the collection. */
export const ARTIFICIAL_GRASS_COPY = {
  eyebrow: "ARTIFICIAL GRASS · COLLECTION",
  heading: "Artificial Grass",
  lede:
    "Ten photographs of artificial turf installed across Karachi residences — terraces, balconies, courtyards and green interiors. This is editorial reference photography of completed work; artificial grass rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a ten-frame source archive: the '20 Backyard Turf Ideas' frame is a different source and was excluded, leaving ten distinct studio frames that earn their place in the collection.",
  railAria: "Artificial grass collection — stills",
  homeHeading: "Soft, maintained greenery that endures.",
  homeDescription:
    "A curated view of the studio's artificial turf work — balcony planters, terrace lawns and courtyard surfaces.",
  homeAction: "View the full collection",
  categoryBody:
    "Ten photographs of artificial turf as built across residential terraces and balconies, photographed from installation.",
  categoryAction: "View the collection",
  ourWorkBody:
    "Reference photography of artificial turf installations — terraces, balconies and courtyard greens from recent projects.",
  ourWorkAction: "View the collection",
} as const;

/** Facts used by the collection header and edit note. */
export const ARTIFICIAL_GRASS_STATS = {
  photographs: ARTIFICIAL_GRASS_ITEMS.filter((item) => item.type === "image").length,
  films: ARTIFICIAL_GRASS_ITEMS.filter((item) => item.type === "video").length,
  sourceFrames: 10,
} as const;

/**
 * Provenance exclusions (originals preserved in source folder):
 */
export const ARTIFICIAL_GRASS_EXCLUSIONS: { file: string; reason: string }[] = [
  {
    file: "20 Backyard Turf Ideas for Low-Maintenance Greenery.jpg.jpeg",
    reason:
      "Different source — a mood/reference image rather than a studio installation photograph. Excluded to keep the collection to on-site shots only.",
  },
];
