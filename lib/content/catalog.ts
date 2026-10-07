/**
 * lib/content/catalog.ts
 * The studio catalogue.
 *
 * Categories and services are the collections this studio actually offers — they are
 * reproduced here from the approved brief so the site stays complete and navigable even
 * when the Supabase catalogue is empty or unreachable. Product records, projects and
 * reviews are NEVER fabricated: those are read from Supabase and render elegant empty
 * states when absent.
 */

import type { Category, CollectionMediaItem, Service } from "./types";
import { CATEGORY_ARTWORK } from "./media";
import { FALSE_CEILING_ITEMS } from "./false-ceiling";
import { ARTIFICIAL_GRASS_ITEMS } from "./artificial-grass";
import { FOLDING_DOORS_ITEMS } from "./folding-doors";
import { ROLLER_BLINDS_ITEMS } from "./roller-blinds";

const tones: Category["tone"][] = [
  "stone",
  "graphite",
  "champagne",
  "clay",
  "sage",
  "stone",
  "champagne",
  "graphite",
  "clay",
  "sage",
  "stone",
  "champagne",
];

type Seed = {
  slug: string;
  name: string;
  description: string;
  meta: string;
  aliases: string[];
};

const CATEGORY_SEEDS: Seed[] = [
  {
    slug: "laminate-flooring",
    name: "Laminate Flooring",
    description:
      "High-pressure laminate planks engineered for depth of grain, dimensional stability and everyday durability.",
    meta: "Flooring · Plank",
    aliases: ["laminate", "laminate-flooring", "laminateflooring"],
  },
  {
    slug: "spc-flooring",
    name: "SPC Flooring",
    description:
      "Stone-polymer composite planks with a rigid core, waterproof performance and a quiet, solid underfoot feel.",
    meta: "Flooring · Waterproof",
    aliases: ["spc", "spc-floor", "spc-flooring", "spcflooring"],
  },
  {
    slug: "vinyl-flooring",
    name: "Vinyl Flooring",
    description:
      "Resilient vinyl in wood and stone evolutions — warm underfoot, low maintenance and suited to high-traffic rooms.",
    meta: "Flooring · Resilient",
    aliases: ["vinyl", "vinyl-flooring", "vinylflooring"],
  },
  {
    slug: "pvc-wall-panels",
    name: "PVC Wall Panels",
    description:
      "Seamless decorative panels that clad, cover and finish interior walls with crisp shadow lines.",
    meta: "Wall · Cladding",
    aliases: ["pvc", "pvc-panel", "pvc-wall-panel", "pvc-wall-panels", "wall-panel"],
  },
  {
    slug: "wallpaper",
    name: "Wallpaper",
    description:
      "Textured and patterned papers, from quiet linens and grasscloths to statement murals.",
    meta: "Wall · Finish",
    aliases: ["wallpaper", "wall-coverings", "murals"],
  },
  {
    slug: "folding-doors",
    name: "Folding Doors",
    description:
      "Space-efficient folding systems that open interiors to light, air and garden views.",
    meta: "Joinery · Door",
    aliases: ["door", "doors", "folding-door", "folding-doors", "foldingdoor"],
  },
  {
    slug: "false-ceiling",
    name: "False Ceiling",
    description:
      "Sculpted plasterboard ceilings with integrated cove lighting, shadow gaps and concealed services.",
    meta: "Ceiling · Architectural",
    aliases: [
      "ceiling",
      "ceilings",
      "falseceiling",
      "gypsum",
      "gypsum-ceiling",
      "gypsum-ceilings",
      "gypsum-false-ceiling",
    ],
  },
  {
    slug: "window-blinds",
    name: "Window Blinds",
    description:
      "Precision blinds in timber, woven and technical weaves for measured daylight control.",
    meta: "Window · Light Control",
    aliases: ["blinds", "window-blinds", "windowblind", "curtains"],
  },
  {
    slug: "3d-wall-picture",
    name: "3D Wall Picture",
    description:
      "Sculptural relief panels and framed wall art that give a feature wall a third dimension.",
    meta: "Wall · Sculptural",
    aliases: [
      "3d",
      "3dpicture",
      "3d-wall-picture",
      "3d-wall-panels",
      "3d-wall-panel",
      "wall-art",
    ],
  },
  {
    slug: "carpet-tile",
    name: "Carpet Tile",
    description:
      "Modular carpet tiles laid in grid and quarter-turn patterns, specified by collection and rendered from the studio catalogue library.",
    meta: "Flooring · Modular Tile",
    aliases: [
      "carpet",
      "carpets",
      "carpettile",
      "carpet-tiles",
      "carpet tile",
      "modular-carpet",
    ],
  },
  {
    slug: "artificial-grass",
    name: "Artificial Grass",
    description:
      "Soft, weather-stable turf for terraces, courtyards, balconies and green interiors.",
    meta: "Outdoor · Terrace",
    aliases: ["grass", "artificial-grass", "artificialgrass", "turf"],
  },
];

/**
 * Reference / collection media attached to a collection.
 *
 * This is deliberately NOT product data. A collection can carry real studio
 * photography without every photograph having to become a sellable product record.
 * Every collection with an entry here renders the same shared collection-media
 * section on its collection page, so nothing is a special case.
 */
const CATEGORY_MEDIA: Record<string, CollectionMediaItem[]> = {
  "false-ceiling": FALSE_CEILING_ITEMS,
  "artificial-grass": ARTIFICIAL_GRASS_ITEMS,
  "folding-doors": FOLDING_DOORS_ITEMS,
  "window-blinds": ROLLER_BLINDS_ITEMS,
};

export const STUDIO_CATEGORIES: Category[] = CATEGORY_SEEDS.map((seed, index) => ({
  slug: seed.slug,
  name: seed.name,
  description: seed.description,
  meta: seed.meta,
  artwork: CATEGORY_ARTWORK[seed.slug],
  tone: tones[index] ?? "stone",
  sortOrder: index + 1,
  productCount: 0,
  collectionMedia: CATEGORY_MEDIA[seed.slug] ?? [],
  source: "studio-catalogue" as const,
  parentId: null,
}));

/** Legacy/alternate slugs (old static site links) → canonical catalogue slug. */
export const CATEGORY_ALIASES: Record<string, string> = CATEGORY_SEEDS.reduce(
  (acc, seed) => {
    acc[seed.slug] = seed.slug;
    seed.aliases.forEach((alias) => {
      acc[alias] = seed.slug;
    });
    return acc;
  },
  {} as Record<string, string>
);

export function resolveCategorySlug(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = decodeURIComponent(input).toLowerCase().trim();
  return CATEGORY_ALIASES[key] ?? null;
}

export function findStudioCategory(slug: string | null | undefined): Category | null {
  const canonical = resolveCategorySlug(slug);
  if (!canonical) return null;
  return STUDIO_CATEGORIES.find((category) => category.slug === canonical) ?? null;
}

export const STUDIO_CATEGORY_SLUGS: string[] = CATEGORY_SEEDS.map((seed) => seed.slug);
