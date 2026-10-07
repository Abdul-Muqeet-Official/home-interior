/**
 * lib/content/false-ceiling.ts
 *
 * Canonical data source for the False Ceiling collection — the single file every
 * surface reads (homepage preview, False Ceiling collection page, Our Work card).
 * Provenance, exclusions and derivative details are documented at the
 * bottom of this file; source originals are never modified.
 */

export type FalseCeilingItemType = "image" | "video";

export interface FalseCeilingItem {
  /** Stable identifier — "fc-NN" (source index) or "fc-film". */
  id: string;
  type: FalseCeilingItemType;
  /** Production path under /public. */
  src: string;
  /** Video poster (video items only). */
  poster?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Original filename in the source folder — provenance, never rendered. */
  sourceFile: string;
}

/** Canonical route for the full collection (the only SEO canonical for it). */
export const FALSE_CEILING_ROUTE = "/materials/false-ceiling";

/** Parent in the canonical hierarchy: Materials → Gypsum Ceilings → collection. */
export const FALSE_CEILING_CATEGORY_ROUTE = "/materials/false-ceiling";

const PREFIX = "False Ceiling Image 2026-09-22 at ";

/** Full published edit in editorial order — first entry is the featured lead. */
const ITEMS: FalseCeilingItem[] = [
  {
    id: "fc-09",
    type: "image",
    src: "/media/false-ceiling/09-coffered-lattice.webp",
    width: 960,
    height: 960,
    alt: "Coffered gypsum ceiling with a dark timber lattice centrepiece, spotlights and warm concealed cove lighting.",
    caption: "A dark lattice centrepiece, lifted on warm cove light.",
    sourceFile: `${PREFIX}12.01.45 AM.jpeg`,
  },
  {
    id: "fc-12",
    type: "image",
    src: "/media/false-ceiling/12-corridor-pendants.webp",
    width: 720,
    height: 535,
    alt: "Hallway ceiling with ring pendant lights, warm cove lighting and wallpapered walls.",
    caption: "Ring pendants draw the hallway forward.",
    sourceFile: `${PREFIX}12.01.46 AM.jpeg`,
  },
  {
    id: "fc-film",
    type: "video",
    src: "/media/false-ceiling/false-ceiling-film.mp4",
    poster: "/media/false-ceiling/false-ceiling-film-poster.webp",
    width: 478,
    height: 850,
    alt: "Vertical walkthrough film of a white false ceiling with recessed dark cove channels and tray details.",
    caption: "Walkthrough film — 0:29, vertical.",
    sourceFile: "False Ceiling Video 2026-09-22 at 12.01.41 AM.mp4",
  },
  {
    id: "fc-04",
    type: "image",
    src: "/media/false-ceiling/04-amber-cove.webp",
    width: 720,
    height: 960,
    alt: "Portrait view of a floating white ceiling tray washed by warm amber cove light above a seating area.",
    caption: "Amber cove light lifts a floating tray.",
    sourceFile: `${PREFIX}12.01.43 AM (1).jpeg`,
  },
  {
    id: "fc-16",
    type: "image",
    src: "/media/false-ceiling/16-rounded-cove-fans.webp",
    width: 1200,
    height: 1600,
    alt: "Portrait view of a rounded false ceiling tray washed by continuous cove light, with two ceiling fans, a starburst chandelier and recessed pin lights.",
    caption: "One rounded tray, drawn in a single line of cove light.",
    sourceFile: `${PREFIX}12.01.47 AM (2).jpeg`,
  },
  {
    id: "fc-13",
    type: "image",
    src: "/media/false-ceiling/13-bedroom-timber.webp",
    width: 480,
    height: 360,
    alt: "Bedroom ceiling with dark timber corner accents, a central fan and warm cove light above the bed.",
    caption: "Timber corner accents over the bed.",
    sourceFile: `${PREFIX}12.01.47 AM (1).jpeg`,
  },
  {
    id: "fc-10",
    type: "image",
    src: "/media/false-ceiling/10-corner-angle-tray.webp",
    width: 640,
    height: 442,
    alt: "Square tray ceiling with dark timber angles at the corners framing a plain white centre panel.",
    caption: "Dark angles frame a quiet white centre.",
    sourceFile: `${PREFIX}12.01.46 AM (1).jpeg`,
  },
  {
    id: "fc-14",
    type: "image",
    src: "/media/false-ceiling/14-terracotta-inlay.webp",
    width: 1280,
    height: 808,
    alt: "Ceiling with terracotta-toned square accents and warm concealed cove lighting beside a doorway.",
    caption: "Terracotta inlay warms the passage.",
    sourceFile: `${PREFIX}12.01.47 AM.jpeg`,
  },
  {
    id: "fc-03",
    type: "image",
    src: "/media/false-ceiling/03-grey-downlights.webp",
    width: 735,
    height: 575,
    alt: "Grey tray ceiling with round recessed downlights beside a blue-curtained window.",
    caption: "Round downlights on a grey tray.",
    sourceFile: `${PREFIX}12.01.42 AM.jpeg`,
  },
  {
    id: "fc-15",
    type: "image",
    src: "/media/false-ceiling/15-angular-white.webp",
    width: 1280,
    height: 1280,
    alt: "White angular ceiling planes broken by black accent lines with a central fan.",
    caption: "White planes broken by black reveals.",
    sourceFile: `${PREFIX}12.01.48 AM (1).jpeg`,
  },
  {
    id: "fc-02",
    type: "image",
    src: "/media/false-ceiling/02-led-perimeter.webp",
    width: 1125,
    height: 1076,
    alt: "Bright white tray ceiling with a glowing LED perimeter above a wallpapered feature wall.",
    caption: "An LED perimeter over wallpaper.",
    sourceFile: `${PREFIX}12.01.42 AM (2).jpeg`,
  },
  {
    id: "fc-11",
    type: "image",
    src: "/media/false-ceiling/11-blush-cove.webp",
    width: 811,
    height: 493,
    alt: "Ceiling cove glowing blush pink across a white slatted panel with small pin lights.",
    caption: "A blush wash across slatted plaster.",
    sourceFile: `${PREFIX}12.01.46 AM (2).jpeg`,
  },
  {
    id: "fc-06",
    type: "image",
    src: "/media/false-ceiling/06-violet-accent.webp",
    width: 600,
    height: 600,
    alt: "Square ceiling detail lit violet, with perforated panels and dark red beams.",
    caption: "Violet accent light on perforated panels.",
    sourceFile: `${PREFIX}12.01.44 AM (1).jpeg`,
  },
  {
    id: "fc-01",
    type: "image",
    src: "/media/false-ceiling/01-tray-pinlights.webp",
    width: 1600,
    height: 1199,
    alt: "Wide living space under a white tray ceiling with warm pin lights and contractor lettering painted on the wall.",
    caption: "Pin lights across the living ceiling.",
    sourceFile: `${PREFIX}12.01.42 AM (1).jpeg`,
  },
  {
    id: "fc-08",
    type: "image",
    src: "/media/false-ceiling/08-tiered-cove.webp",
    width: 1600,
    height: 1000,
    alt: "Tiered white ceiling with dark timber bands and warm cove light around a recessed centre.",
    caption: "Tiered rings finished with a timber band.",
    sourceFile: `${PREFIX}12.01.45 AM (1).jpeg`,
  },
  {
    id: "fc-05",
    type: "image",
    src: "/media/false-ceiling/05-geometric-squares.webp",
    width: 1536,
    height: 1126,
    alt: "Interlocking timber-look ceiling squares around a central fan under warm cove light.",
    caption: "Interlocking squares around a fan.",
    sourceFile: `${PREFIX}12.01.43 AM (2).jpeg`,
  },
  {
    id: "fc-07",
    type: "image",
    src: "/media/false-ceiling/07-project-collage.webp",
    width: 1600,
    height: 899,
    alt: "Collage of false ceiling project photographs arranged as a single project sheet.",
    caption: "Project sheet — selected ceiling work.",
    sourceFile: `${PREFIX}12.01.44 AM.jpeg`,
  },

];

/** Shared editorial copy for every surface that presents the collection. */
export const FALSE_CEILING_COPY = {
  eyebrow: "FALSE CEILING · COLLECTION",
  heading: "False Ceiling",
  lede:
    "Sixteen photographs and one walkthrough film from the studio's false ceiling work — cove-lit trays, coffered details and concealed services, photographed as built. This is an editorial collection of completed work; gypsum ceiling rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a nineteen-frame source archive: one exact duplicate and two near-identical re-saves were set aside so that every view in the collection earns its place.",
  railAria: "False ceiling collection — stills and walkthrough film",
  homeHeading: "Light, held in plaster.",
  homeDescription:
    "A curated view of the studio's false ceiling work — cove-lit trays and coffered details from the full collection.",
  homeAction: "View the full collection",
  categoryBody:
    "Sixteen photographs and a walkthrough film from the studio's gypsum ceiling work — cove lighting, trays and coffered details as built.",
  categoryAction: "View the collection",
  ourWorkBody:
    "Sixteen stills and a vertical walkthrough film — cove-lit trays and coffered gypsum details from the studio's recent ceiling work.",
  ourWorkAction: "View the collection",
} as const;

/** Facts used by the collection header and the edit note. */
export const FALSE_CEILING_STATS = {
  photographs: ITEMS.filter((item) => item.type === "image").length,
  films: ITEMS.filter((item) => item.type === "video").length,
  sourceFrames: 19,
  filmDuration: "0:29",
} as const;

export const FALSE_CEILING_ITEMS: FalseCeilingItem[] = ITEMS;

/** Featured lead — first entry of the editorial order. */
export const FALSE_CEILING_FEATURED: FalseCeilingItem = ITEMS[0];

/** Curated homepage subset: stills only, in editorial order. */
export function falseCeilingPreview(count = 4): FalseCeilingItem[] {
  return ITEMS.filter((item) => item.type === "image").slice(0, count);
}

/**
 * Provenance — source folder untouched:
 *   C:\Users\DELL\Pictures\False ceiling — 20 files: 19 JPEG frames + 1 MP4 film.
 *   Distinct source frames: 19 (one exact MD5 duplicate pair exists in the folder).
 *   Published: 16 stills + 1 film (17 items) in the editorial order above.
 *
 * Derivatives in public/media/false-ceiling/ (generated with sharp / ffmpeg):
 *   NN-*.webp                 — sharp webp q82 at original pixel dimensions
 *   false-ceiling-film.mp4    — verbatim copy of the source film (H.264 / AAC)
 *   false-ceiling-film-poster.webp — poster frame (ffmpeg, t = 4s)
 *   manifest.json             — canonical publication list for this folder
 *
 * Re-sync after the source folder changes (never modifies the source):
 *   node scripts/sync-false-ceiling.mjs           report
 *   node scripts/sync-false-ceiling.mjs --apply   regenerate + prune
 *
 * The manifest records each source frame's MD5 so a changed, deleted or new
 * source is detected on the next run instead of silently going stale.
 *
 * Documented exclusions (originals preserved in the source folder):
 */
export const FALSE_CEILING_EXCLUSIONS: { file: string; reason: string }[] = [
  {
    file: `12.01.43 AM.jpeg`,
    reason: `Exact MD5 duplicate of the frame published as fc-02 (${PREFIX}12.01.42 AM (2).jpeg).`,
  },
  {
    file: `${PREFIX}12.01.48 AM.jpeg`,
    reason:
      "Low-resolution near-identical re-save of the scene published as fc-09 (same ceiling, same framing) - kept out so the collection keeps one frame per view.",
  },
  {
    file: `${PREFIX}12.01.49 AM.jpeg`,
    reason:
      "Near-identical re-save of the scene published as fc-15 (same ceiling, same framing) - kept out so the collection keeps one frame per view.",
  },
];

