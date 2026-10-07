/**
 * lib/content/pvc-wall-panels.ts
 *
 * Canonical data source for the PVC Wall Panels collection — parent category and
 * five series sub-collections.
 *
 * Hierarchy:
 *   PVC Wall Panels (parent)
 *     ├── Aura Series         (11 images)
 *     ├── Enigma Series       (10 images)
 *     ├── Prestige            (13 images)
 *     ├── Regular Vol 1       (4 images)
 *     ├── Royal Series        (5 images)
 *     └── Slatted Series      (14 images)
 *
 * Source folder:
 *   C:\Users\DELL\Pictures\PVC Panels
 *   Folder names preserved as series. Source folder is never modified.
 */

import type { CollectionMediaItem } from "./types";

export interface PVCSeries {
  slug: string;
  name: string;
  description: string;
  cover: string;
  coverAlt: string;
  items: CollectionMediaItem[];
  stats: {
    photographs: number;
    films: number;
    sourceFrames: number;
  };
  copy: {
    eyebrow: string;
    heading: string;
    lede: string;
    editHeading: string;
    editNote: string;
    railAria: string;
    categoryAction: string;
  };
}

/** Canonical route for the parent collection. */
export const PVC_WALL_PANELS_ROUTE = "/materials/pvc-wall-panels";

function buildStats(items: CollectionMediaItem[], sourceFrames: number) {
  return {
    photographs: items.filter((i) => i.type === "image").length,
    films: items.filter((i) => i.type === "video").length,
    sourceFrames,
  };
}

/* ==========================================================================
 * AURA SERIES
 * ========================================================================== */
const AURA_ITEMS: CollectionMediaItem[] = [
  {
    id: "aura-lead",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-01.jpeg",
    width: 1280,
    height: 1223,
    alt: "A seamless PVC wall panel installation in a soft grey matte, the vertical joints invisible beneath a single plane of light.",
    caption: "Aura matte — seamless flush joint.",
  },
  {
    id: "aura-02",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-02.jpeg",
    width: 1280,
    height: 1255,
    alt: "Close-up of an Aura Series panel edge showing the tongue-and-groove profile and matte surface finish.",
    caption: "Profile detail.",
  },
  {
    id: "aura-03",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-03.jpeg",
    width: 1280,
    height: 1014,
    alt: "Aura Series panels running vertically along a hallway wall, the soft neutral tone receding into the architecture.",
    caption: "Vertical runs down the hallway.",
  },
  {
    id: "aura-04",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-04.jpeg",
    width: 1142,
    height: 1280,
    alt: "A corner installation of Aura Series panels, the mitre joint cut clean and tight.",
    caption: "Mitred corner joinery.",
  },
  {
    id: "aura-05",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-05.jpeg",
    width: 1173,
    height: 1280,
    alt: "Aura Series panels used as a feature behind a bed head, the low-sheen surface catching ambient light evenly.",
    caption: "Bedhead feature wall.",
  },
  {
    id: "aura-06",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-06.jpeg",
    width: 1188,
    height: 1280,
    alt: "A horizontal Aura Series installation in a bathroom, the panels running the full width of the vanity wall.",
    caption: "Bathroom vanity wall.",
  },
  {
    id: "aura-07",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-07.jpeg",
    width: 1280,
    height: 1168,
    alt: "Aura Series panel texture under raking light, the subtle grain structure visible across the surface.",
    caption: "Texture under raking light.",
  },
  {
    id: "aura-08",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-08.jpeg",
    width: 1078,
    height: 1280,
    alt: "A tall Aura Series installation from floor to ceiling, the single vertical seam marking the panel height.",
    caption: "Full-height run.",
  },
  {
    id: "aura-09",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-09.jpeg",
    width: 1132,
    height: 1280,
    alt: "Close-up of an Aura Series panel showing the matte surface and the fine scratch-resistance coating.",
    caption: "Surface coating detail.",
  },
  {
    id: "aura-10",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-10.jpeg",
    width: 1157,
    height: 1280,
    alt: "Aura Series panels meeting a window reveal, the clean edge detail continuing to the trim.",
    caption: "Window reveal junction.",
  },
  {
    id: "aura-11",
    type: "image",
    src: "/media/pvc-wall-panels/aura-series/pvc-11.jpeg",
    width: 1079,
    height: 1280,
    alt: "End-on view of an Aura Series panel stack, the tongue-and-groove edges aligned in sequence.",
    caption: "Panel stack alignment.",
  },
];

const AURA_COPY = {
  eyebrow: "PVC WALL PANELS · AURA SERIES",
  heading: "Aura Series",
  lede:
    "Eleven photographs of the Aura Series PVC wall panels installed across Karachi residences — matte finishes, seamless joints and full-height runs. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from an eleven-frame source archive. Every frame is a distinct installation view; no duplicates were set aside.",
  railAria: "Aura Series stills",
  categoryAction: "View the Aura Series",
};

export const AURA: PVCSeries = {
  slug: "aura-series",
  name: "Aura Series",
  description:
    "Matte-finish PVC wall panels with seamless tongue-and-groove joints and full-height vertical runs.",
  cover: "/media/pvc-wall-panels/aura-series/pvc-01.jpeg",
  coverAlt:
    "A seamless PVC wall panel installation in a soft grey matte, the vertical joints invisible beneath a single plane of light.",
  items: AURA_ITEMS,
  stats: buildStats(AURA_ITEMS, 11),
  copy: AURA_COPY,
};

/* ==========================================================================
 * REGULAR VOL 1
 * ========================================================================== */
const REGULAR_VOL_1_ITEMS: CollectionMediaItem[] = [
  {
    id: "rv1-lead",
    type: "image",
    src: "/media/pvc-wall-panels/regular-vol-1/pvc-01.jpeg",
    width: 1722,
    height: 3834,
    alt: "A tall portrait shot of a Regular Vol 1 PVC panel installed from floor to ceiling, the vertical grain running the full height of the wall.",
    caption: "Full-height Regular Vol 1 panel.",
  },
  {
    id: "rv1-02",
    type: "image",
    src: "/media/pvc-wall-panels/regular-vol-1/pvc-02.jpeg",
    width: 1697,
    height: 3753,
    alt: "Close-up of a Regular Vol 1 panel showing the woodgrain print and the surface texture under natural light.",
    caption: "Woodgrain texture detail.",
  },
  {
    id: "rv1-03",
    type: "image",
    src: "/media/pvc-wall-panels/regular-vol-1/pvc-03.jpeg",
    width: 1712,
    height: 3889,
    alt: "End-on view of a Regular Vol 1 panel, the thickness and core structure visible at the edge.",
    caption: "Edge profile detail.",
  },
  {
    id: "rv1-04",
    type: "image",
    src: "/media/pvc-wall-panels/regular-vol-1/pvc-04.jpeg",
    width: 1714,
    height: 3831,
    alt: "A Regular Vol 1 panel installation in a kitchen, the vertical grain complementing the cabinetry lines.",
    caption: "Kitchen installation.",
  },
];

const REGULAR_VOL_1_COPY = {
  eyebrow: "PVC WALL PANELS · REGULAR VOL 1",
  heading: "Regular Vol 1",
  lede:
    "Four full-height photographs of Regular Vol 1 PVC wall panels — a woodgrain print on a robust core, installed from floor to ceiling in residential kitchens and living spaces. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a four-frame source archive. Each frame captures a distinct wall face; no duplicates were set aside.",
  railAria: "Regular Vol 1 stills",
  categoryAction: "View the Regular Vol 1",
};

export const REGULAR_VOL_1: PVCSeries = {
  slug: "regular-vol-1",
  name: "Regular Vol 1",
  description:
    "Woodgrain-print PVC wall panels on a rigid core, installed full-height in residential interiors.",
  cover: "/media/pvc-wall-panels/regular-vol-1/pvc-01.jpeg",
  coverAlt:
    "A tall portrait shot of a Regular Vol 1 PVC panel installed from floor to ceiling, the vertical grain running the full height of the wall.",
  items: REGULAR_VOL_1_ITEMS,
  stats: buildStats(REGULAR_VOL_1_ITEMS, 4),
  copy: REGULAR_VOL_1_COPY,
};

/* ==========================================================================
 * PRESTIGE
 * ========================================================================== */
const PRESTIGE_ITEMS: CollectionMediaItem[] = [
  {
    id: "prestige-lead",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-01.jpeg",
    width: 1280,
    height: 887,
    alt: "A Prestige Series PVC wall installation in a living room, the large-format panels creating a smooth contemporary feature wall.",
    caption: "Large-format Prestige feature wall.",
  },
  {
    id: "prestige-02",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-02.jpeg",
    width: 1280,
    height: 877,
    alt: "Close-up of a Prestige panel showing the fine surface texture and the minimal edge profile.",
    caption: "Fine surface texture.",
  },
  {
    id: "prestige-03",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-03.jpeg",
    width: 1280,
    height: 906,
    alt: "Prestige panels running horizontally across a dining room wall, the grain aligned to the room's proportions.",
    caption: "Horizontal run in the dining room.",
  },
  {
    id: "prestige-04",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-04.jpeg",
    width: 1280,
    height: 696,
    alt: "A Prestige panel wall meeting a window frame, the clean reveal detail continuing to the plaster.",
    caption: "Window frame junction.",
  },
  {
    id: "prestige-05",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-05.jpeg",
    width: 1280,
    height: 683,
    alt: "Close-up of the Prestige panel joint, the tongue-and-groove profile hidden beneath a shadow line.",
    caption: "Hidden joint detail.",
  },
  {
    id: "prestige-06",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-06.jpeg",
    width: 1280,
    height: 827,
    alt: "A long horizontal Prestige panel run in a hallway, the surface reflecting ambient light evenly.",
    caption: "Hallway panel run.",
  },
  {
    id: "prestige-07",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-07.jpeg",
    width: 1280,
    height: 832,
    alt: "Prestige panels in a bedroom, the vertical orientation drawing the eye upward to the ceiling line.",
    caption: "Vertical bedroom installation.",
  },
  {
    id: "prestige-08",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-08.jpeg",
    width: 1280,
    height: 706,
    alt: "Close-up of a Prestige panel edge showing the minimal thickness and the flush joint profile.",
    caption: "Minimal edge profile.",
  },
  {
    id: "prestige-09",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-09.jpeg",
    width: 1280,
    height: 716,
    alt: "A Prestige wall panel corner, the mitered joint cut at a precise 45 degrees.",
    caption: "Mitred corner.",
  },
  {
    id: "prestige-10",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-10.jpeg",
    width: 1280,
    height: 717,
    alt: "Prestige panels installed behind a floating vanity in a bathroom, the waterproof core suited to the damp environment.",
    caption: "Bathroom vanity feature.",
  },
  {
    id: "prestige-11",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-11.jpeg",
    width: 1280,
    height: 799,
    alt: "A Prestige panel surface under raking light, the texture and print depth visible.",
    caption: "Print depth under raking light.",
  },
  {
    id: "prestige-12",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-12.jpeg",
    width: 1280,
    height: 825,
    alt: "End-on view of a Prestige panel stack, the consistent core thickness and edge finish visible.",
    caption: "Panel stack edge-on.",
  },
  {
    id: "prestige-13",
    type: "image",
    src: "/media/pvc-wall-panels/prestige/pvc-13.jpeg",
    width: 1280,
    height: 751,
    alt: "A Prestige installation in a kitchen, the panels running behind the hob surround and continuing through the open-plan space.",
    caption: "Kitchen hob surround.",
  },
];

const PRESTIGE_COPY = {
  eyebrow: "PVC WALL PANELS · PRESTIGE",
  heading: "Prestige",
  lede:
    "Thirteen photographs of Prestige Series PVC wall panels installed across residential kitchens, hallways and bathrooms — large-format prints, minimal edge profiles and shadow-groove joints. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a thirteen-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
  railAria: "Prestige stills",
  categoryAction: "View the Prestige collection",
};

export const PRESTIGE: PVCSeries = {
  slug: "prestige",
  name: "Prestige",
  description:
    "Large-format PVC wall panels with a minimal edge profile and shadow-groove joint system.",
  cover: "/media/pvc-wall-panels/prestige/pvc-01.jpeg",
  coverAlt:
    "A Prestige Series PVC wall installation in a living room, the large-format panels creating a smooth contemporary feature wall.",
  items: PRESTIGE_ITEMS,
  stats: buildStats(PRESTIGE_ITEMS, 13),
  copy: PRESTIGE_COPY,
};

/* ==========================================================================
 * ROYAL SERIES (5 images — populated from source)
 * ========================================================================== */
const ROYAL_SERIES_ITEMS: CollectionMediaItem[] = [
  {
    id: "royal-lead",
    type: "image",
    src: "/media/pvc-wall-panels/royal-series/pvc-01.jpeg",
    width: 890,
    height: 1600,
    alt: "A Royal Series PVC wall panel installation, full-height vertical planks with a smooth matte face and narrow reveal between boards.",
    caption: "Full-height Royal Series wall.",
  },
  {
    id: "royal-02",
    type: "image",
    src: "/media/pvc-wall-panels/royal-series/pvc-02.jpeg",
    width: 848,
    height: 1600,
    alt: "End-on view of Royal Series panels stacked in sequence, the consistent board thickness and edge detail visible.",
    caption: "Panel stack edge-on.",
  },
  {
    id: "royal-03",
    type: "image",
    src: "/media/pvc-wall-panels/royal-series/pvc-03.jpeg",
    width: 846,
    height: 1600,
    alt: "Royal Series panels in a narrow vertical strip beside a window, the boards running the full floor-to-ceiling height.",
    caption: "Window-side installation.",
  },
  {
    id: "royal-04",
    type: "image",
    src: "/media/pvc-wall-panels/royal-series/pvc-04.jpeg",
    width: 880,
    height: 1600,
    alt: "Close-up of a Royal Series panel surface, the fine grain print and matte texture visible under raking light.",
    caption: "Surface texture detail.",
  },
  {
    id: "royal-05",
    type: "image",
    src: "/media/pvc-wall-panels/royal-series/pvc-05.jpeg",
    width: 886,
    height: 1600,
    alt: "A Royal Series corner installation, the vertical boards meeting at a clean mitre.",
    caption: "Corner joinery.",
  },
];

const ROYAL_SERIES_COPY = {
  eyebrow: "PVC WALL PANELS · ROYAL SERIES",
  heading: "Royal Series",
  lede:
    "Five photographs of Royal Series PVC wall panels installed across residential Karachi projects — full-height vertical planks with a matte face and narrow reveal. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a five-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
  railAria: "Royal Series stills",
  categoryAction: "View the Royal Series",
};

export const ROYAL_SERIES: PVCSeries = {
  slug: "royal-series",
  name: "Royal Series",
  description: "Matte-finish PVC wall panels in full-height vertical boards with a narrow reveal profile.",
  cover: "/media/pvc-wall-panels/royal-series/pvc-01.jpeg",
  coverAlt:
    "A Royal Series PVC wall panel installation, full-height vertical planks with a smooth matte face and narrow reveal between boards.",
  items: ROYAL_SERIES_ITEMS,
  stats: buildStats(ROYAL_SERIES_ITEMS, 5),
  copy: ROYAL_SERIES_COPY,
};

/* ==========================================================================
 * ENIGMA SERIES (10 images — populated from source)
 * ========================================================================== */
const ENIGMA_SERIES_ITEMS: CollectionMediaItem[] = [
  {
    id: "enigma-lead",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-01.jpeg",
    width: 1262,
    height: 1280,
    alt: "A dark-toned Enigma Series PVC wall panel installation, the subtle woodgrain print set against a deep charcoal surface under warm interior lighting.",
    caption: "Deep-tone Enigma Series wall.",
  },
  {
    id: "enigma-02",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-02.jpeg",
    width: 1280,
    height: 1229,
    alt: "Close-up of an Enigma Series panel edge, the profile and surface finish detailed under raking light.",
    caption: "Edge profile detail.",
  },
  {
    id: "enigma-03",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-03.jpeg",
    width: 1280,
    height: 1270,
    alt: "End-on view of a stack of Enigma Series panels, the consistent board thickness and edge finish aligned.",
    caption: "Panel stack alignment.",
  },
  {
    id: "enigma-04",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-04.jpeg",
    width: 1206,
    height: 1280,
    alt: "A tall Enigma Series installation running from floor to ceiling, the dark tone receding into the architecture.",
    caption: "Full-height run.",
  },
  {
    id: "enigma-05",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-05.jpeg",
    width: 1220,
    height: 1280,
    alt: "Close-up of an Enigma Series surface, the fine grain print and matte coating visible under direct light.",
    caption: "Surface print detail.",
  },
  {
    id: "enigma-06",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-06.jpeg",
    width: 1280,
    height: 1246,
    alt: "An Enigma Series panel wall meeting a window reveal, the clean edge detail continuing to the trim.",
    caption: "Window reveal junction.",
  },
  {
    id: "enigma-07",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-07.jpeg",
    width: 1249,
    height: 1280,
    alt: "A horizontal Enigma Series run in a hallway, the dark boards creating a continuous plane.",
    caption: "Hallway panel run.",
  },
  {
    id: "enigma-08",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-08.jpeg",
    width: 1179,
    height: 1280,
    alt: "Enigma Series panels installed behind a floating vanity, the dark tone providing restrained contrast.",
    caption: "Vanishing point installation.",
  },
  {
    id: "enigma-09",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-09.jpeg",
    width: 1232,
    height: 1280,
    alt: "Close-up of an Enigma Series panel showing the scratch-resistance coating and matte surface under raking light.",
    caption: "Surface coating detail.",
  },
  {
    id: "enigma-10",
    type: "image",
    src: "/media/pvc-wall-panels/enigma-series/pvc-10.jpeg",
    width: 1280,
    height: 1266,
    alt: "End-on view of an Enigma Series panel stack, the dark boards aligned in sequence against a neutral wall.",
    caption: "End-on panel alignment.",
  },
];

const ENIGMA_SERIES_COPY = {
  eyebrow: "PVC WALL PANELS · ENIGMA SERIES",
  heading: "Enigma Series",
  lede:
    "Ten photographs of Enigma Series PVC wall panels installed across residential Karachi projects — deep-tone finishes, full-height runs and narrow reveals. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a ten-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
  railAria: "Enigma Series stills",
  categoryAction: "View the Enigma Series",
};

export const ENIGMA_SERIES: PVCSeries = {
  slug: "enigma-series",
  name: "Enigma Series",
  description:
    "Deep-tone PVC wall panels with a matte surface finish and narrow reveal profile, installed full-height in residential interiors.",
  cover: "/media/pvc-wall-panels/enigma-series/pvc-01.jpeg",
  coverAlt:
    "A dark-toned Enigma Series PVC wall panel installation, the subtle woodgrain print set against a deep charcoal surface under warm interior lighting.",
  items: ENIGMA_SERIES_ITEMS,
  stats: buildStats(ENIGMA_SERIES_ITEMS, 10),
  copy: ENIGMA_SERIES_COPY,
};

/* ==========================================================================
 * SLATTED SERIES (14 images — populated from source)
 * ========================================================================== */
const SLATTED_SERIES_ITEMS: CollectionMediaItem[] = [
  {
    id: "slatted-lead",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-01.jpeg",
    width: 858,
    height: 1280,
    alt: "A Slatted Series PVC wall installation with narrow parallel boards set at regular spacing, shadow lines creating depth.",
    caption: "Slatted profile wall.",
  },
  {
    id: "slatted-02",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-02.jpeg",
    width: 903,
    height: 1280,
    alt: "Close-up of Slatted Series boards, the slim profile and surface texture detailed.",
    caption: "Board profile detail.",
  },
  {
    id: "slatted-03",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-03.jpeg",
    width: 1199,
    height: 1280,
    alt: "A wide Slatted Series run across a living room wall, the parallel boards creating a linear feature.",
    caption: "Wide linear run.",
  },
  {
    id: "slatted-04",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-04.jpeg",
    width: 1065,
    height: 1280,
    alt: "End-on view of stacked Slatted Series boards, the consistent spacing and edge profile visible.",
    caption: "Stack alignment.",
  },
  {
    id: "slatted-05",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-05.jpeg",
    width: 960,
    height: 1280,
    alt: "Slatted Series panels meeting a window reveal, the clean edge detail continuing to the trim.",
    caption: "Window reveal junction.",
  },
  {
    id: "slatted-06",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-06.jpeg",
    width: 1058,
    height: 1280,
    alt: "A vertical Slatted Series installation in a bedroom, the boards drawing the eye upward.",
    caption: "Vertical bedroom run.",
  },
  {
    id: "slatted-07",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-07.jpeg",
    width: 960,
    height: 1280,
    alt: "Close-up of a Slatted Series board under raking light, the surface texture and spacing detail visible.",
    caption: "Surface under raking light.",
  },
  {
    id: "slatted-08",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-08.jpeg",
    width: 1026,
    height: 1280,
    alt: "A corner installation of Slatted Series panels, the boards meeting at a clean angle.",
    caption: "Corner installation.",
  },
  {
    id: "slatted-09",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-09.jpeg",
    width: 960,
    height: 1280,
    alt: "Slatted Series panels running vertically in a hallway, the parallel boards creating a linear perspective.",
    caption: "Hallway vertical run.",
  },
  {
    id: "slatted-10",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-10.jpeg",
    width: 960,
    height: 1280,
    alt: "End-on view of a stack of Slatted Series boards, the spacing and edge finish consistent.",
    caption: "Board stack edge-on.",
  },
  {
    id: "slatted-11",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-11.jpeg",
    width: 1023,
    height: 1280,
    alt: "A Slatted Series feature wall behind a bed head, the parallel boards creating a textured backdrop.",
    caption: "Bedhead feature wall.",
  },
  {
    id: "slatted-12",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-12.jpeg",
    width: 960,
    height: 1280,
    alt: "Close-up of a Slatted Series board edge, the minimal profile and surface finish detailed.",
    caption: "Edge profile detail.",
  },
  {
    id: "slatted-13",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-13.jpeg",
    width: 960,
    height: 1280,
    alt: "A Slatted Series installation in a kitchen, the boards running behind the hob surround.",
    caption: "Kitchen hob surround.",
  },
  {
    id: "slatted-14",
    type: "image",
    src: "/media/pvc-wall-panels/slatted-series/pvc-14.jpeg",
    width: 960,
    height: 1280,
    alt: "End-on view of a stack of Slatted Series boards, the final panel in the sequence.",
    caption: "Final panel in the sequence.",
  },
];

const SLATTED_SERIES_COPY = {
  eyebrow: "PVC WALL PANELS · SLATTED SERIES",
  heading: "Slatted Series",
  lede:
    "Fourteen photographs of Slatted Series PVC wall panels installed across residential Karachi projects — narrow parallel boards with shadow-line spacing, vertical runs and feature walls. This is editorial reference photography of completed work; panel rates are confirmed on consultation.",
  editHeading: "The edit",
  editNote:
    "Published as a single edit from a fourteen-frame source archive. Every frame captures a distinct installation view; no duplicates were set aside.",
  railAria: "Slatted Series stills",
  categoryAction: "View the Slatted Series",
};

export const SLATTED_SERIES: PVCSeries = {
  slug: "slatted-series",
  name: "Slatted Series",
  description:
    "Narrow parallel PVC wall panels with shadow-line spacing, installed vertically in residential interiors.",
  cover: "/media/pvc-wall-panels/slatted-series/pvc-01.jpeg",
  coverAlt:
    "A Slatted Series PVC wall installation with narrow parallel boards set at regular spacing, shadow lines creating depth.",
  items: SLATTED_SERIES_ITEMS,
  stats: buildStats(SLATTED_SERIES_ITEMS, 14),
  copy: SLATTED_SERIES_COPY,
};

/** All six published series, in canonical order. */
export const PVC_SERIES: PVCSeries[] = [
  AURA,
  ENIGMA_SERIES,
  PRESTIGE,
  REGULAR_VOL_1,
  ROYAL_SERIES,
  SLATTED_SERIES,
];

/** Parent collection editorial copy. */
export const PVC_WALL_PANELS_COPY = {
  eyebrow: "PVC WALL PANELS · COLLECTION",
  heading: "PVC Wall Panels",
  lede:
    "PVC wall panels across six series — Aura, Enigma, Prestige, Regular Vol 1, Royal and Slatted. Each series is photographed as built across residential Karachi projects. This is editorial reference photography; panel rates are confirmed on consultation.",
} as const;
