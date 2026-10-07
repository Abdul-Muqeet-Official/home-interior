import fs from "fs";
import path from "path";
import { SITE } from "@/lib/site.config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface StoredSiteSettings {
  site_name: string;
  descriptor: string;
  tagline: string;
  site_description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  address_lines: string[];
  logo_url: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  seo_title: string;
  seo_description: string;
  updated_at?: string;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), "lib", "content", "site_settings.json");

export const DEFAULT_SETTINGS: StoredSiteSettings = {
  site_name: SITE.name,
  descriptor: SITE.descriptor,
  tagline: SITE.tagline,
  site_description: SITE.description,
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  email: "info@homeinterior.pk",
  address: SITE.addressOneLine,
  address_lines: [...SITE.addressLines],
  logo_url: "/brand/logo.png",
  instagram: "https://instagram.com/homeinterior.pk",
  facebook: "https://facebook.com/homeinteriorkhi",
  linkedin: "",
  seo_title: SITE.seo.title,
  seo_description: SITE.seo.description,
  updated_at: new Date().toISOString(),
};

let inMemorySettings: StoredSiteSettings | null = null;

export function getStoredSettings(): StoredSiteSettings {
  if (inMemorySettings) return inMemorySettings;

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      const merged: StoredSiteSettings = { ...DEFAULT_SETTINGS, ...parsed };
      inMemorySettings = merged;
      return merged;
    }
  } catch (error) {
    console.warn("[settings-store] Failed to read settings file, using defaults:", error);
  }

  const fallback: StoredSiteSettings = { ...DEFAULT_SETTINGS };
  inMemorySettings = fallback;
  return fallback;
}

export async function saveStoredSettings(
  patch: Partial<StoredSiteSettings>
): Promise<StoredSiteSettings> {
  const current = getStoredSettings();
  const addressOneLine = patch.address !== undefined ? patch.address : current.address;
  const addressLines = addressOneLine
    ? addressOneLine.split(/\r?\n|, /).map((s) => s.trim()).filter(Boolean)
    : current.address_lines;

  const updated: StoredSiteSettings = {
    ...current,
    ...patch,
    address: addressOneLine,
    address_lines: addressLines.length > 0 ? addressLines : current.address_lines,
    updated_at: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (error) {
    console.error("[settings-store] Failed to write settings file:", error);
  }

  inMemorySettings = updated;

  // Best effort sync with Supabase if site_settings table exists
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("site_settings").upsert({
        id: "00000000-0000-0000-0000-000000000001",
        brand_name: updated.site_name,
        tagline: updated.tagline,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        address: updated.address,
        updated_at: updated.updated_at,
      });
    } catch {
      // Non-blocking
    }
  }

  return updated;
}
