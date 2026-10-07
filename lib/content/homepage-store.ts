import fs from "fs";
import path from "path";
import { HERO, MATERIALS_PAGE, WORK, EDITORIAL_INTRO } from "@/lib/content/editorial";

export interface HomepageSlide {
  src: string;
  caption: string;
}

export interface StoredHomepageSettings {
  hero: {
    eyebrow: string;
    heading: string;
    highlight: string;
    subtext: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    slides: HomepageSlide[];
  };
  materials: {
    eyebrow: string;
    heading: string;
    subtext: string;
    description: string;
  };
  work: {
    eyebrow: string;
    heading: string;
    subtext: string;
    description: string;
  };
  updated_at?: string;
}

const HOMEPAGE_FILE_PATH = path.join(process.cwd(), "lib", "content", "homepage_settings.json");

export const DEFAULT_HOMEPAGE_SETTINGS: StoredHomepageSettings = {
  hero: {
    eyebrow: HERO.eyebrow,
    heading: HERO.heading,
    highlight: HERO.highlight,
    subtext: HERO.subtext,
    primaryCta: { ...HERO.primaryCta },
    secondaryCta: { ...HERO.secondaryCta },
    slides: HERO.slides.map((s) => ({ ...s })),
  },
  materials: {
    eyebrow: MATERIALS_PAGE.eyebrow,
    heading: MATERIALS_PAGE.heading,
    subtext: MATERIALS_PAGE.subtext,
    description: MATERIALS_PAGE.description,
  },
  work: {
    eyebrow: WORK.eyebrow,
    heading: WORK.heading,
    subtext: WORK.subtext,
    description: WORK.description,
  },
  updated_at: new Date().toISOString(),
};

let inMemoryHomepageSettings: StoredHomepageSettings | null = null;

export function getStoredHomepageSettings(): StoredHomepageSettings {
  if (inMemoryHomepageSettings) return inMemoryHomepageSettings;

  try {
    if (fs.existsSync(HOMEPAGE_FILE_PATH)) {
      const data = fs.readFileSync(HOMEPAGE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const merged: StoredHomepageSettings = {
        hero: { ...DEFAULT_HOMEPAGE_SETTINGS.hero, ...(parsed.hero || {}) },
        materials: { ...DEFAULT_HOMEPAGE_SETTINGS.materials, ...(parsed.materials || {}) },
        work: { ...DEFAULT_HOMEPAGE_SETTINGS.work, ...(parsed.work || {}) },
        updated_at: parsed.updated_at || new Date().toISOString(),
      };
      inMemoryHomepageSettings = merged;
      return merged;
    }
  } catch (error) {
    console.warn("[homepage-store] Failed to read homepage settings, using defaults:", error);
  }

  const fallback: StoredHomepageSettings = { ...DEFAULT_HOMEPAGE_SETTINGS };
  inMemoryHomepageSettings = fallback;
  return fallback;
}

export async function saveStoredHomepageSettings(
  patch: Partial<StoredHomepageSettings>
): Promise<StoredHomepageSettings> {
  const current = getStoredHomepageSettings();

  const updated: StoredHomepageSettings = {
    hero: { ...current.hero, ...(patch.hero || {}) },
    materials: { ...current.materials, ...(patch.materials || {}) },
    work: { ...current.work, ...(patch.work || {}) },
    updated_at: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(HOMEPAGE_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (error) {
    console.error("[homepage-store] Failed to write homepage settings file:", error);
  }

  inMemoryHomepageSettings = updated;
  return updated;
}

