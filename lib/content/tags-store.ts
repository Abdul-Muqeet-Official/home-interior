import fs from "fs";
import path from "path";

const TAGS_FILE = path.join(process.cwd(), "lib", "content", "tags.json");

export const DEFAULT_TAGS: string[] = [
  "waterproof",
  "wood-look",
  "marble-look",
  "commercial",
  "residential",
  "herringbone",
  "matte",
  "glossy",
  "premium",
  "roller",
  "blackout",
  "light-filtering",
  "motorized",
  "office",
  "bedroom",
  "living-room",
  "acoustic",
  "modular",
  "seamless",
  "luxury",
];

function sanitizeTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, "")
    .replace(/\s+/g, "-");
}

export function getStoredTags(): string[] {
  try {
    if (fs.existsSync(TAGS_FILE)) {
      const data = fs.readFileSync(TAGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[tags-store] Failed to read tags file, using defaults:", err);
  }
  return [...DEFAULT_TAGS];
}

export function saveStoredTags(tags: string[]): string[] {
  const unique = Array.from(
    new Set(tags.map(sanitizeTag).filter(Boolean))
  ).sort();
  try {
    fs.writeFileSync(TAGS_FILE, JSON.stringify(unique, null, 2), "utf-8");
  } catch (err) {
    console.error("[tags-store] Failed to write tags file:", err);
  }
  return unique;
}

export function addTag(name: string): string[] {
  const current = getStoredTags();
  const clean = sanitizeTag(name);
  if (!clean || current.includes(clean)) return current;
  return saveStoredTags([...current, clean]);
}

export function updateTag(oldName: string, newName: string): string[] {
  const current = getStoredTags();
  const cleanOld = sanitizeTag(oldName);
  const cleanNew = sanitizeTag(newName);
  if (!cleanNew) return current;
  const updated = current.map((t) => (t === cleanOld ? cleanNew : t));
  return saveStoredTags(updated);
}

export function removeTag(name: string): string[] {
  const current = getStoredTags();
  const clean = sanitizeTag(name);
  const filtered = current.filter((t) => t !== clean);
  return saveStoredTags(filtered);
}

