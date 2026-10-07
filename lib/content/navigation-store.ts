import fs from "fs";
import path from "path";
import { NAV_PRIMARY, NAV_CONSULTATION, FOOTER_NAV, NavItem } from "@/lib/site.config";

export interface StoredNavigation {
  primary: NavItem[];
  consultation: NavItem;
  footer: NavItem[];
  updated_at?: string;
}

const NAVIGATION_FILE_PATH = path.join(process.cwd(), "lib", "content", "navigation_settings.json");

let inMemoryNavigation: StoredNavigation | null = null;

export const DEFAULT_NAVIGATION: StoredNavigation = {
  primary: [...NAV_PRIMARY],
  consultation: { ...NAV_CONSULTATION },
  footer: [...FOOTER_NAV],
  updated_at: new Date().toISOString(),
};

export function getStoredNavigation(): StoredNavigation {
  if (inMemoryNavigation) return inMemoryNavigation;

  try {
    if (fs.existsSync(NAVIGATION_FILE_PATH)) {
      const data = fs.readFileSync(NAVIGATION_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.primary)) {
        inMemoryNavigation = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.warn("[navigation-store] Failed to read navigation file, using defaults:", error);
  }

  const fallback = { ...DEFAULT_NAVIGATION };
  inMemoryNavigation = fallback;
  return fallback;
}

export async function saveStoredNavigation(nav: StoredNavigation): Promise<StoredNavigation> {
  const updated: StoredNavigation = {
    ...nav,
    updated_at: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(NAVIGATION_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (error) {
    console.error("[navigation-store] Failed to write navigation file:", error);
  }

  inMemoryNavigation = updated;
  return updated;
}

