import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ConsultationCTA from "@/components/ui/ConsultationCTA";
import EditorialTicker from "@/components/ui/EditorialTicker";
import MaterialRail from "@/components/ui/MaterialRail";
import SectionHeading from "@/components/ui/SectionHeading";
import { MATERIALS_PAGE } from "@/lib/content/editorial";
import { getCategories } from "@/lib/supabase/queries";
import { getSupabaseServerClient } from "@/lib/supabase/public";
import { ensureAbsoluteImagePath } from "@/lib/content/image-src";
import { artworkForCategorySlug } from "@/lib/content/media";
import MaterialsExplorer, { type ExplorerCollection } from "@/components/ui/MaterialsExplorer";
import {
  buildGroups,
  buildTags,
  classifyCategory,
  PRIMARY_CATEGORIES,
} from "@/lib/content/material-groups";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Materials & Products",
  description: "A considered palette of surfaces, textures and architectural finishes.",
  alternates: { canonical: "/materials" },
};

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  image_path: string | null;
  parent_id: string | null;
  sort_order: number;
  country?: string | null;
};

async function CategoryRailStream() {
  const categories = await getCategories();
  return (
    <>
      <SectionHeading heading="Explore by Category" />
      <div className="container-wide pb-20">
        <MaterialRail categories={categories} />
      </div>
    </>
  );
}

async function ExplorerStream() {
  const client = getSupabaseServerClient();
  const [
    categories,
    { data },
    { data: productRows },
    { data: categoryIds },
  ] = await Promise.all([
    getCategories(),
    client
      ? client
          .from("categories")
          .select("id, name, slug, image_path, parent_id, sort_order, country")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: null }),
    client
      ? client
          .from("products")
          .select("id, name, title, slug, image_path, is_published, sort_order, category, category_id")
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: null }),
    client
      ? client
          .from("categories")
          .select("id, slug, name, parent_id, country")
          .eq("is_active", true)
          .limit(2000)
      : Promise.resolve({ data: null }),
  ]);

  const collections: CollectionRow[] = (data as CollectionRow[]) || [];
  const categoryIndex = new Map<string, { slug: string; name: string; parentId: string | null; country?: string | null }>();
  for (const row of (categoryIds ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    country?: string | null;
  }>) {
    categoryIndex.set(row.id, {
      slug: row.slug,
      name: row.name,
      parentId: row.parent_id,
      country: row.country,
    });
  }

  const resolveRoot = (catId: string): { slug: string; name: string } | null => {
    let current = categoryIndex.get(catId);
    let guard = 0;
    while (current && current.parentId && guard < 10) {
      const parent = categoryIndex.get(current.parentId);
      if (!parent) break;
      current = parent;
      guard++;
    }
    return current ? { slug: current.slug, name: current.name } : null;
  };

  const explorerCollections: ExplorerCollection[] = [];

  for (const row of collections) {
    const classification = classifyCategory({ slug: row.slug, name: row.name });
    const isRoot = !row.parent_id;
    const root = row.parent_id ? resolveRoot(row.parent_id) : null;
    const rootSlug = root?.slug ?? classification.groupKey;

    let subKey: string | null = null;
    let subLabel: string | null = null;

    if (rootSlug === "wallpaper") {
      if (row.country === "china" || row.slug.includes("-china")) {
        subKey = "china";
        subLabel = "China";
      } else if (row.country === "korea" || row.slug.includes("-korea")) {
        subKey = "korea";
        subLabel = "Korea";
      }
    } else if (row.parent_id) {
      subKey = row.slug;
      subLabel = row.name;
    }

    let href = `/materials/${rootSlug}`;
    if (rootSlug === "wallpaper" && subKey) {
      href = `/materials/wallpaper/${subKey}/${row.slug}`;
    } else if (!isRoot) {
      href = `/materials/${rootSlug}/${row.slug}`;
    }

    explorerCollections.push({
      id: row.id,
      kind: "collection",
      name: row.name,
      parentName: isRoot ? classification.groupLabel : (root?.name ?? classification.groupLabel),
      href,
      image: ensureAbsoluteImagePath(row.image_path, {
        fallback: artworkForCategorySlug(isRoot ? row.slug : rootSlug),
      }),
      groupKey: classification.groupKey,
      groupLabel: classification.groupLabel,
      subKey,
      subLabel,
      tags: classification.tags,
    });
  }

  const explorerProducts: ExplorerCollection[] = [];
  for (const row of (productRows ?? []) as Array<{
    id: string;
    name: string | null;
    title: string | null;
    slug: string | null;
    image_path: string | null;
    category?: string | null;
    category_id?: string | null;
  }>) {
    const label = (row.name ?? "").trim() || (row.title ?? "").trim();
    if (!label || !row.slug) continue;

    let matchedPrimary: { key: string; label: string } | null = null;
    if (row.category_id && categoryIndex.has(row.category_id)) {
      const root = resolveRoot(row.category_id) || categoryIndex.get(row.category_id);
      matchedPrimary = PRIMARY_CATEGORIES.find((p) => p.key === root?.slug) ?? null;
    }
    if (!matchedPrimary && row.category) {
      const norm = row.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      matchedPrimary =
        PRIMARY_CATEGORIES.find(
          (p) => p.key === norm || p.label.toLowerCase() === row.category?.toLowerCase()
        ) ?? null;
    }
    if (!matchedPrimary && row.slug) {
      matchedPrimary = PRIMARY_CATEGORIES.find((p) => row.slug?.startsWith(p.key)) ?? null;
    }

    const groupKey = matchedPrimary?.key ?? "other";
    const groupLabel = matchedPrimary?.label ?? "Product";

    explorerProducts.push({
      id: row.id,
      kind: "product",
      name: label,
      parentName: "Product",
      href: `/products/${row.slug}`,
      image: ensureAbsoluteImagePath(row.image_path, {
        bucket: "products",
        fallback: artworkForCategorySlug(groupKey),
      }),
      groupKey,
      groupLabel,
      subKey: null,
      subLabel: null,
      tags: [],
    });
  }

  const explorerItems: ExplorerCollection[] = [...explorerCollections, ...explorerProducts].sort(
    (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );

  const explorerGroups = buildGroups(categories);
  const explorerTags = buildTags(categories);

  return (
    <>
      <SectionHeading heading="All Collections" />
      <div className="container-wide pb-20">
        <MaterialsExplorer
          collections={explorerItems}
          groups={explorerGroups}
          tags={explorerTags}
        />
      </div>
    </>
  );
}

export default function MaterialsPage() {
  return (
    <main id="main">
      <section className="relative isolate flex h-[75svh] min-h-[500px] w-full items-end overflow-hidden">
        <Image
          src="/media/photos/wallpaper.jpg"
          alt="Premium material wall composition"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent" />
        <div className="container-editorial relative z-10 pb-16">
          <p className="eyebrow text-champagne">{MATERIALS_PAGE.eyebrow}</p>
          <h1 className="display-1 mt-4 max-w-3xl text-white text-shadow-editorial">{MATERIALS_PAGE.heading}</h1>
          <p className="mt-4 max-w-xl text-white/85">{MATERIALS_PAGE.subtext}</p>
        </div>
      </section>

      <div className="container-wide pt-10 pb-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Materials & Products" }]} />
      </div>

      <EditorialTicker />

      <Suspense
        fallback={
          <div className="container-wide py-12">
            <div className="h-64 bg-surface/40 animate-pulse rounded-editorial" />
          </div>
        }
      >
        <CategoryRailStream />
      </Suspense>

      <Suspense
        fallback={
          <div className="container-wide pb-20">
            <div className="min-h-[320px]">
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="rounded-card border border-line p-3">
                    <div className="mat-skeleton w-full rounded-panel" style={{ aspectRatio: "4 / 5" }} />
                    <div className="mt-5 min-h-[104px] px-1">
                      <div className="mat-skeleton h-3 w-24" />
                      <div className="mat-skeleton mt-3 h-5 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ExplorerStream />
      </Suspense>

      <ConsultationCTA />
    </main>
  );
}
