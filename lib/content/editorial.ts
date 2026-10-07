/**
 * lib/content/editorial.ts
 * Editorial copy used across the site: hero, running line, philosophy and process.
 * This is studio positioning language only — no awards, press, counts or client claims.
 */

export const HERO = {
  eyebrow: "CURATED COLLECTION 2026",
  heading: "Redefining Modern Living Spaces.",
  highlight: "Living Spaces.",
  subtext:
    "Bespoke interior architecture, refined materials and considered spaces crafted for contemporary living in Karachi.",
  primaryCta: { label: "EXPLORE MATERIALS", href: "/materials" },
  secondaryCta: { label: "VIEW OUR WORK", href: "/our-work" },
  slides: [
    {
      src: "/media/photos/hero-01.jpg",
      caption: "Material palette study — warm plaster, limestone and brushed brass",
    },
    {
      src: "/media/photos/hero-02.jpg",
      caption: "Surface study — stone, oak and shadow line detailing",
    },
    {
      src: "/media/photos/hero-03.jpg",
      caption: "Light study — louvred daylight across a quiet interior plane",
    },
  ],
} as const;

export const EDITORIAL_INTRO = {
  eyebrow: "THE STUDIO",
  heading: "Interiors composed with restraint, proportion and material honesty.",
  body: [
    "HOME INTERIOR is a Karachi-based bespoke living studio working across residential interiors, architectural finishes and material specification.",
    "We treat every residence as a sequence of rooms rather than a set of surfaces — planning light, proportion and storage first, then layering timber, stone, textile and metal with deliberate restraint.",
  ],
  facts: [
    { label: "Studio", value: "DHA Phase 5, Karachi" },
    { label: "Practice", value: "Residential interiors & finishes" },
    { label: "Engagements", value: "Private consultations by appointment" },
  ],
} as const;

/** Materials & Products — page and homepage section copy. */
export const MATERIALS_PAGE = {
  eyebrow: "MATERIALS & PRODUCTS",
  heading: "Materials & Products",
  subtext: "A considered palette of surfaces, textures and architectural finishes.",
  description:
    "Flooring, wall surfaces, ceilings and architectural finishes — selected as one composition.",
} as const;

/** Our Work — page and homepage section copy. */
export const WORK = {
  eyebrow: "OUR WORK",
  heading: "Our Work",
  subtext: "Selected residential interiors.",
  description:
    "Each project records its location, type, design approach and the materials specified.",
  /** Shown when the studio has not published projects yet. */
  showcaseNote: "Studio showcase",
  /** Hard editorial boundary: project pages never present pricing, rates or sale language. */
  noPricing: "No pricing, rates, discounts or sale language appears on Our Work pages.",
} as const;

/** Client Reviews — page and homepage section copy. */
export const REVIEWS = {
  eyebrow: "CLIENT REVIEWS",
  heading: "Client Impressions",
  subtext:
    "A selection of feedback from clients who have experienced the design process with Home Interior.",
} as const;

export const RUNNING_LINE = [
  "HOME INTERIOR",
  "BESPOKE INTERIORS",
  "MATERIALS",
  "ARCHITECTURAL DETAIL",
  "KARACHI",
  "PRIVATE CONSULTATIONS",
  "RESIDENTIAL DESIGN",
];

export const PHILOSOPHY = {
  eyebrow: "OUR PHILOSOPHY",
  heading: "Six principles that govern every drawing we issue.",
  pillars: [
    {
      index: "01",
      title: "MATERIALITY",
      description:
        "Materials are selected as a family, not individually — tone, grain and finish judged together under the light of the actual room.",
    },
    {
      index: "02",
      title: "PROPORTION",
      description:
        "Height, width and pause are set on drawings first, so that a room reads correctly before anything is placed in it.",
    },
    {
      index: "03",
      title: "LIGHT",
      description:
        "Daylight is directed and artificial light is layered in three registers — ambient, task and accent — never a single ceiling grid.",
    },
    {
      index: "04",
      title: "FUNCTION",
      description:
        "Storage, circulation and service routes are resolved to serve daily routines, so the finished interior stays uncluttered.",
    },
    {
      index: "05",
      title: "CRAFT",
      description:
        "Junctions, shadow gaps and edges are detailed for the craftsman who will build them, and reviewed on site as they are set out.",
    },
    {
      index: "06",
      title: "TIMELESSNESS",
      description:
        "We avoid short-lived gestures, favouring quiet surfaces that will still read correctly years after handover.",
    },
  ],
} as const;

export const PROCESS = {
  eyebrow: "OUR PROCESS",
  heading: "Five stages from first conversation to handover.",
  steps: [
    {
      index: "01",
      title: "DISCOVER",
      description:
        "We measure the space, review light and services, and discuss how the household actually uses each room.",
    },
    {
      index: "02",
      title: "DEFINE",
      description:
        "Brief, budget bands and material direction are agreed so the design scope is unambiguous.",
    },
    {
      index: "03",
      title: "DESIGN",
      description:
        "Layouts, elevations and lighting plans are developed with a coordinated material schedule.",
    },
    {
      index: "04",
      title: "DETAIL",
      description:
        "Joining details, finishes and specifications are finalised for procurement and site execution.",
    },
    {
      index: "05",
      title: "DELIVER",
      description:
        "Coordinated installation, quality inspection, snagging and handover of the completed interior.",
    },
  ],
} as const;

export const CONSULTATION = {
  eyebrow: "PRIVATE CONSULTATION",
  heading: "Let's design your space.",
  subtext:
    "Share a few details about your residence and we will arrange a private consultation at the studio or on site.",
  projectTypes: [
    "Apartment",
    "Villa / House",
    "Single Room",
    "Kitchen",
    "Office / Commercial",
    "Materials Only",
  ],
  contactMethods: ["WhatsApp", "Phone call", "Email"],
  /** Editorial clarification: the catalogue uses consultation pricing by default. */
  pricingNote:
    "Materials, finishes and availability are confirmed against the studio sample library at consultation.",
} as const;

export const EMPTY_STATES = {
  projects: {
    eyebrow: "OUR WORK",
    title: "Selected work will appear here as completed projects are published.",
    body:
      "Each project is published only once its owner has released it. In the meantime, the consultation below is the fastest way to see the studio's material library and recent site work.",
  },
  reviews: {
    eyebrow: "CLIENT REVIEWS",
    title: "Client impressions will appear here as approved feedback is published.",
    body: "We keep client feedback considered, factual and tied to completed work.",
    note: "No review on this site is written, edited or shortened by the studio on a client's behalf.",
  },
  products: {
    title: "Products will appear here as they are added",
    body:
      "Every entry in this collection is a live record from the studio catalogue, added and published by the studio. Until the first one appears, request a consultation for samples, technical data and current rates.",
  },
  pricing: {
    /** Single consistent missing-price label used by product and catalogue surfaces. */
    priceOnConsultation:
      "PRICE ON CONSULTATION",
  },
} as const;
