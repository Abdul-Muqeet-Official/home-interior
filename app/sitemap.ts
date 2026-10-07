/**
 * app/sitemap.ts
 * Generated from the static route list plus live Supabase collections.
 */

import type { MetadataRoute } from "next";
import { getCategories, getCarpetTileCollections, getProducts, getProjects } from "@/lib/supabase/queries";
import { SITE_URL } from "@/lib/site.config";
import { PVC_SERIES } from "@/lib/content/pvc-wall-panels";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/materials", priority: 0.9, changeFrequency: "weekly" },
  { path: "/our-work", priority: 0.9, changeFrequency: "weekly" },
  { path: "/materials/carpet-tile", priority: 0.8, changeFrequency: "weekly" },
   { path: "/materials/false-ceiling", priority: 0.7, changeFrequency: "monthly" },
   { path: "/materials/pvc-wall-panels", priority: 0.8, changeFrequency: "monthly" },
   { path: "/materials/folding-doors", priority: 0.7, changeFrequency: "monthly" },
  { path: "/philosophy", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/reviews", priority: 0.6, changeFrequency: "monthly" },
  { path: "/consultation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, projects, carpet] = await Promise.all([
    getCategories(),
    getProducts(),
    getProjects(),
    getCarpetTileCollections(),
  ]);

  const now = new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}/materials/${category.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...projects.map((project) => ({
      url: `${SITE_URL}/our-work/${project.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...carpet.map((collection) => ({
      url: `${SITE_URL}/materials/carpet-tile/${collection.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...PVC_SERIES.map((series) => ({
      url: `${SITE_URL}/materials/pvc-wall-panels/${series.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
