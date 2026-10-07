/**
 * app/materials/gypsum-ceilings/false-ceiling/page.tsx
 *
 * Legacy URL for the False Ceiling collection. The collection now lives on the
 * shared dynamic category route /materials/false-ceiling so that every collection
 * has exactly one route and one canonical URL. This page exists only to keep old
 * links and the previous sitemap entry working - it renders no content of its own.
 */

import { permanentRedirect } from "next/navigation";

export default function FalseCeilingCollectionPage() {
  permanentRedirect("/materials/false-ceiling");
}