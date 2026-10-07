import type { CollectionMediaItem } from "./types";

export const ROLLER_BLINDS_ROUTE = "/materials/window-blinds/roller-blinds";
export const ROLLER_BLINDS_ITEMS: CollectionMediaItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: `roller-blinds-${String(index + 1).padStart(2, "0")}`,
  type: "image" as const,
  src: `/media/roller-blinds/roller-${String(index + 1).padStart(2, "0")}.webp`,
  width: 1200,
  height: 900,
  alt: `Roller Blinds collection — reference image ${index + 1}`,
  caption: `Roller Blinds — reference image ${String(index + 1).padStart(2, "0")}`,
}));
