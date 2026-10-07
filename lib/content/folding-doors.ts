/**
 * lib/content/folding-doors.ts
 *
 * Canonical data source for the Folding Doors collection — the single file every
 * surface reads (homepage preview, collection page).
 *
 * Provenance — source folder:
 *   C:\Users\DELL\Pictures\Folding Door
 *   19 images + 2 MP4 walkthrough films (20 files total).
 *   2 exact-MD5 duplicate frames removed → 17 unique images + 2 films = 19 items.
 *
 * Derivatives published in public/media/folding-doors/:
 *   fd-01.jpeg … fd-17.jpeg — verbatim copies of the 17 unique source images
 *   fd-video-18.mp4            — verbatim copy of source film (H.264 / AAC)
 *   fd-video-18-poster.jpeg    — poster frame extracted at t=1s
 *   fd-video-19.mp4            — verbatim copy
 *   fd-video-19-poster.jpeg    — poster frame extracted at t=1s
 *
 * Source folder is never modified.
 */

import type { CollectionMediaItem } from "./types";

/** Canonical route for the full collection. */
export const FOLDING_DOORS_ROUTE = "/materials/folding-doors";

/**
 * Published edit in editorial order — first entry is the featured lead.
 * Duplicate frames (exact MD5 matches) were set aside so every view earns its
 * place in the collection.
 */
export const FOLDING_DOORS_ITEMS: CollectionMediaItem[] = [
  {
    id: "fd-lead",
    type: "image",
    src: "/media/folding-doors/fd-17.jpeg",
    width: 1600,
    height: 1200,
    alt: "A pair of full-height folding glass doors opened wide against a pale stone floor, daylight spilling through the glazing into a living space.",
    caption: "Folding glass doors opened to the terrace.",
  },
  {
    id: "fd-video-18",
    type: "video",
    src: "/media/folding-doors/fd-video-18.mp4",
    poster: "/media/folding-doors/fd-video-18-poster.jpeg",
    width: 480,
    height: 864,
    alt: "Vertical walkthrough film showing a set of folding doors being opened and closed in a living space, natural light from the windows.",
    caption: "Walkthrough film — 0:26, vertical.",
  },
  {
    id: "fd-01",
    type: "image",
    src: "/media/folding-doors/fd-01.jpeg",
    width: 603,
    height: 926,
    alt: "Close-up detail of aluminium folding door frames and flush-fitting glass panels, showing the hinge and roller mechanism.",
    caption: "Frame and glass detail.",
  },
  {
    id: "fd-02",
    type: "image",
    src: "/media/folding-doors/fd-02.jpeg",
    width: 1280,
    height: 960,
    alt: "A wide view of a living room wall of folding doors fully open, blending interior and exterior spaces.",
    caption: "Fully opened wall of sightlines.",
  },
  {
    id: "fd-03",
    type: "image",
    src: "/media/folding-doors/fd-03.jpeg",
    width: 1024,
    height: 1536,
    alt: "Portrait view of a tall folding door system mounted on a track, showing the panel alignment and top roller.",
    caption: "Track and panel alignment.",
  },
  {
    id: "fd-04",
    type: "image",
    src: "/media/folding-doors/fd-04.jpeg",
    width: 728,
    height: 1353,
    alt: "Vertical shot of a folding door panel stack, the aluminium frames and hardware visible in profile.",
    caption: "Aluminium hardware in profile.",
  },
  {
    id: "fd-05",
    type: "image",
    src: "/media/folding-doors/fd-05.jpeg",
    width: 1197,
    height: 1315,
    alt: "A pair of folding doors viewed from outside, showing the flush thresholds and weather seals between indoor and outdoor flooring.",
    caption: "Indoor-outdoor transition.",
  },
  {
    id: "fd-video-19",
    type: "video",
    src: "/media/folding-doors/fd-video-19.mp4",
    poster: "/media/folding-doors/fd-video-19-poster.jpeg",
    width: 474,
    height: 850,
    alt: "Vertical walkthrough film of a timber-framed folding door opening across a wide aperture, daylight and shadow.",
    caption: "Walkthrough film — 0:23, vertical.",
  },
  {
    id: "fd-06",
    type: "image",
    src: "/media/folding-doors/fd-06.jpeg",
    width: 960,
    height: 1280,
    alt: "Close-up of a folding door handle and lock set, the brushed metal finish catching light.",
    caption: "Handle and lock detail.",
  },
  {
    id: "fd-07",
    type: "image",
    src: "/media/folding-doors/fd-07.jpeg",
    width: 960,
    height: 1280,
    alt: "A single folding door leaf lifted slightly, showing the pivot hinge and floor guide.",
    caption: "Pivot hinge and floor guide.",
  },
  {
    id: "fd-08",
    type: "image",
    src: "/media/folding-doors/fd-08.jpeg",
    width: 960,
    height: 1280,
    alt: "Two-panel folding door with a slim vertical mullion, the joint between leaves nearly invisible when closed.",
    caption: "Slim vertical joint when closed.",
  },
  {
    id: "fd-09",
    type: "image",
    src: "/media/folding-doors/fd-09.jpeg",
    width: 960,
    height: 1280,
    alt: "Aluminium framed folding door header detail showing the concealed top track and mounting brackets.",
    caption: "Concealed top track detail.",
  },
  {
    id: "fd-10",
    type: "image",
    src: "/media/folding-doors/fd-10.jpeg",
    width: 960,
    height: 1280,
    alt: "A narrow vertical slice of a folding door leaf showing the slim profile and glass retention.",
    caption: "Leaf section profile.",
  },
  {
    id: "fd-11",
    type: "image",
    src: "/media/folding-doors/fd-11.jpeg",
    width: 1200,
    height: 1600,
    alt: "Full-height view of a multi-leaf folding door system stacked against a wall when fully opened.",
    caption: "Leaves stacked against the wall.",
  },
  {
    id: "fd-12",
    type: "image",
    src: "/media/folding-doors/fd-12.jpeg",
    width: 960,
    height: 1280,
    alt: "A folding door in mid-fold, the hinges and rollers catching the light against a neutral interior.",
    caption: "Hinges in mid-fold.",
  },
  {
    id: "fd-13",
    type: "image",
    src: "/media/folding-doors/fd-13.jpeg",
    width: 966,
    height: 1288,
    alt: "Floor guide and threshold detail of a folding door system, the brushed steel plate set flush with the floor.",
    caption: "Flush floor guide.",
  },
  {
    id: "fd-14",
    type: "image",
    src: "/media/folding-doors/fd-14.jpeg",
    width: 1288,
    height: 966,
    alt: "A wide-angle interior showing folding doors opened onto a terrace beyond, the sightline extending to the garden.",
    caption: "Terrace sightline.",
  },
  {
    id: "fd-15",
    type: "image",
    src: "/media/folding-doors/fd-15.jpeg",
    width: 1200,
    height: 1600,
    alt: "Overhead view of a stack of folded door leaves, the aluminium frames and glass panels aligned in sequence.",
    caption: "Overhead view of stacked leaves.",
  },
  {
    id: "fd-16",
    type: "image",
    src: "/media/folding-doors/fd-16.jpeg",
    width: 966,
    height: 1288,
    alt: "Close-up of the top track and roller assembly of a folding door, the mechanism gliding smoothly.",
    caption: "Roller assembly detail.",
  },
];

/** Featured lead — first entry of the editorial order. */
export const FOLDING_DOORS_FEATURED: CollectionMediaItem = FOLDING_DOORS_ITEMS[0];

/** Curated homepage subset: stills only (no videos), in editorial order. */
export function foldingDoorsPreview(count = 4): CollectionMediaItem[] {
  return FOLDING_DOORS_ITEMS.filter((item) => item.type === "image").slice(0, count);
}

/** Shared editorial copy for every surface that presents the collection. */
export const FOLDING_DOORS_COPY = {
  eyebrow: "FOLDING DOORS · COLLECTION",
  heading: "Folding Doors",
  lede:
    "Seventeen photographs and two walkthrough films of aluminium and timber folding door systems installed across Karachi residences. This is editorial reference photography of completed work; door rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a nineteen-frame source archive (two MP4 walkthrough films plus seventeen still photographs). Two exact-MD5 duplicate frames were set aside so every view in the collection earns its place.",
  railAria: "Folding doors collection — stills and walkthrough film",
  homeHeading: "Architecture framed by movement.",
  homeDescription:
    "A curated view of the studio's folding door installations — aluminium frames, timber leaves and indoor-outdoor transitions.",
  homeAction: "View the full collection",
  categoryBody:
    "Seventeen photographs and two walkthrough films of aluminium and timber folding door systems as built across residential Karachi projects.",
  categoryAction: "View the collection",
  ourWorkBody:
    "Reference photography of folding door installations — frames, hardware and indoor-outdoor transitions from recent projects.",
  ourWorkAction: "View the collection",
} as const;

/** Facts used by the collection header and edit note. */
export const FOLDING_DOORS_STATS = {
  photographs: FOLDING_DOORS_ITEMS.filter((item) => item.type === "image").length,
  films: FOLDING_DOORS_ITEMS.filter((item) => item.type === "video").length,
  sourceFrames: 19,
} as const;

/** Documented exclusions (originals preserved in source folder). */
export const FOLDING_DOORS_EXCLUSIONS: { file: string; reason: string }[] = [
  {
    file: "Folding Door Image 2026-09-21 at 11.42.04 PM (2).jpeg",
    reason: "Exact MD5 duplicate of the frame published as fd-15 (same door, same framing).",
  },
  {
    file: "Folding Door Image 2026-09-21 at 11.42.04 PM (3).jpeg",
    reason: "Exact MD5 duplicate of the frame published as fd-13 (same door, same framing).",
  },
];
