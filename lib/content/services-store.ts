import fs from "fs";
import path from "path";
import { STUDIO_SERVICES } from "@/lib/content/services";
import type { Service } from "@/lib/content/types";

const SERVICES_FILE_PATH = path.join(process.cwd(), "lib", "content", "services_settings.json");

let inMemoryServices: Service[] | null = null;

export function getStoredServices(): Service[] {
  if (inMemoryServices) return inMemoryServices;

  try {
    if (fs.existsSync(SERVICES_FILE_PATH)) {
      const data = fs.readFileSync(SERVICES_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryServices = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.warn("[services-store] Failed to read services file, using defaults:", error);
  }

  const fallback = [...STUDIO_SERVICES];
  inMemoryServices = fallback;
  return fallback;
}

export async function saveStoredServices(services: Service[]): Promise<Service[]> {
  try {
    fs.writeFileSync(SERVICES_FILE_PATH, JSON.stringify(services, null, 2), "utf-8");
  } catch (error) {
    console.error("[services-store] Failed to write services file:", error);
  }

  inMemoryServices = services;
  return services;
}

