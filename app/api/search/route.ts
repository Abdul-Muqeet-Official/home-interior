import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/public";
import type { SearchResult } from "@/lib/content/types";
import { STUDIO_CATEGORIES } from "@/lib/content/catalog";
import { STUDIO_SERVICES } from "@/lib/content/services";
import { slugify } from "@/lib/utils";

export const runtime = "edge";

type CategoryRow = { id: string; name: string; slug: string; parent_id: string | null };

/**
 * Escape a user string for a PostgREST `ilike` pattern so `%` / `_` typed into
 * the search field are matched literally instead of becoming wildcards.
 */
function escapeLike(term: string): string {
  return term.replace(/([\\%_])/g, "\\$1");
}

/**
 * Build the public href for a category row, resolving the full ancestor chain so
 * three-level catalogues (wallpaper > china > collection) link correctly.
 */
function buildHref(row: CategoryRow, byId: Map<string, CategoryRow>): string | null {
  if (!row.parent_id) return `/materials/${row.slug}`;

  const parent = byId.get(row.parent_id);
  if (!parent) return null;

  const childSlug = row.slug.startsWith(`${parent.slug}-`)
    ? row.slug.slice(parent.slug.length + 1)
    : row.slug;

  // Parent is itself a collection (wallpaper > china > collection).
  if (parent.parent_id) {
    const grandParent = byId.get(parent.parent_id);
    if (!grandParent) return `/materials/${parent.slug}/${childSlug}`;
    const countrySlug = parent.slug.startsWith(`${grandParent.slug}-`)
      ? parent.slug.slice(grandParent.slug.length + 1)
      : parent.slug;
    return `/materials/${grandParent.slug}/${countrySlug}/${childSlug}`;
  }

  return `/materials/${parent.slug}/${childSlug}`;
}

/** Studio-catalogue fallback used when Supabase is unreachable or unconfigured. */
function studioOnlyResults(q: string): SearchResult[] {
  const term = q.trim().toLowerCase();
  const results: SearchResult[] = [];

  for (const category of STUDIO_CATEGORIES) {
    if (!term || category.name.toLowerCase().includes(term)) {
      results.push({
        group: "Materials",
        title: category.name,
        subtitle: category.meta,
        href: `/materials/${category.slug}`,
      });
    }
  }

  for (const service of STUDIO_SERVICES) {
    if (!term || service.title.toLowerCase().includes(term) || service.slug.includes(term)) {
      results.push({ group: "Services", title: service.title, subtitle: service.meta, href: "/services" });
    }
  }

  return results;
}



export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const wantsRecommendations = searchParams.get("recommended") === "1";

  const client = getSupabaseServerClient();
  if (!client) {
    // No database: serve the studio's approved catalogue rather than an error,
    // so the overlay is never empty.
    return NextResponse.json(studioOnlyResults(wantsRecommendations ? "" : q));
  }

  try {
    // Empty query + explicit ask: real recommendations from live published data.
    if (!q && wantsRecommendations) {
      return NextResponse.json(await recommendations(client));
    }
    if (!q) return NextResponse.json([]);

    // Batched search: independent tables run concurrently, and the parent
    // lookup is ONE `in` query instead of one query per matched category (N+1).
    const [categoriesRes, productsRes, projectsRes] = await Promise.all([
      client
        .from("categories")
        .select("id, name, slug, parent_id")
        .eq("is_active", true)
        .ilike("name", `%${escapeLike(q)}%`)
        .limit(40),
      client
        .from("products")
        .select("name, slug, title")
        .eq("is_published", true)
        .ilike("name", `%${escapeLike(q)}%`)
        .limit(15),
      client
        .from("projects")
        .select("title")
        .eq("is_published", true)
        .ilike("title", `%${escapeLike(q)}%`)
        .limit(6),
    ]);

    const matched = (categoriesRes.data ?? []) as CategoryRow[];
    const byId = new Map<string, CategoryRow>();
    for (const c of matched) byId.set(c.id, c);

    // Resolve every ancestor in batched round trips, never inside a per-row loop.
    // The catalogue is at most three levels deep, so two batches cover every case.
    for (let depth = 0; depth < 2; depth++) {
      const parentIds: string[] = [];
      const seen = new Set<string>();
      byId.forEach((row) => {
        const pid = row.parent_id;
        if (pid && !seen.has(pid)) {
          seen.add(pid);
          parentIds.push(pid);
        }
      });

      const missing = parentIds.filter((id) => !byId.has(id));
      if (missing.length === 0) break;

      const { data } = await client
        .from("categories")
        .select("id, name, slug, parent_id")
        .in("id", missing);
      const resolved = (data ?? []) as CategoryRow[];
      if (resolved.length === 0) break;
      for (const row of resolved) byId.set(row.id, row);
    }

    const results: SearchResult[] = [];

    for (const row of matched) {
      const href = buildHref(row, byId);
      if (!href) continue;
      const isRoot = !row.parent_id;
      const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
      results.push({
        group: isRoot ? "Materials" : "Collections",
        title: row.name,
        subtitle: isRoot ? "Material Category" : (parent?.name ?? "Collection"),
        href,
      });
    }

    for (const p of productsRes.data ?? []) {
      // A row without a slug has no public route, so it must never produce a
      // broken `/products/null` link. Fall back to the legacy title column.
      const slug = typeof p.slug === "string" ? p.slug.trim() : "";
      if (!slug) continue;
      const name = (typeof p.name === "string" ? p.name.trim() : "") || (typeof p.title === "string" ? p.title.trim() : "");
      if (!name) continue;
      results.push({ group: "Products", title: name, subtitle: "Product", href: `/products/${slug}` });
    }

    for (const p of (projectsRes.data ?? []) as Array<{ title?: string; name?: string; slug?: string }>) {
      const title = (p.title || p.name || "").trim();
      const pSlug = p.slug || slugify(title);
      if (title && pSlug) {
        results.push({ group: "Our Work", title, subtitle: "Portfolio Project", href: `/our-work/${pSlug}` });
      }
    }

    // Services come from the studio's approved catalogue: this project has no
    // `services` table, so querying it only produced a schema-cache error.
    for (const service of STUDIO_SERVICES) {
      if (service.title.toLowerCase().includes(q) || service.slug.includes(q)) {
        results.push({ group: "Services", title: service.title, subtitle: service.meta, href: "/services" });
      }
    }

    return NextResponse.json(results);
  } catch {
    // Never surface a raw database error to the overlay; degrade to studio content.
    return NextResponse.json(studioOnlyResults(q));
  }
}

/**
 * Recommendations shown before the user types. Every entry is a real published
 * destination: the live material categories with their real collection counts,
 * published products, and the studio's approved disciplines.
 */
async function recommendations(
  client: NonNullable<ReturnType<typeof getSupabaseServerClient>>
): Promise<SearchResult[]> {
  const [rootsRes, childrenRes, productsRes] = await Promise.all([
    client
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true })
      .limit(11),
    client
      .from("categories")
      .select("parent_id")
      .eq("is_active", true)
      .not("parent_id", "is", null)
      .limit(2000),
    client
      .from("products")
      .select("name, slug, title")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(6),
  ]);

  const roots = (rootsRes.data ?? []) as CategoryRow[];

  // Real counts, counted from actual rows.
  const childCount = new Map<string, number>();
  for (const row of (childrenRes.data ?? []) as Array<{ parent_id: string }>) {
    childCount.set(row.parent_id, (childCount.get(row.parent_id) ?? 0) + 1);
  }

  const results: SearchResult[] = roots.map((row) => {
    const count = childCount.get(row.id) ?? 0;
    return {
      group: "Materials",
      title: row.name,
      subtitle: count > 0 ? `${count} ${count === 1 ? "collection" : "collections"}` : "Material Category",
      href: `/materials/${row.slug}`,
    };
  });

  for (const p of productsRes.data ?? []) {
    // Same guard as the search path: no slug means no public route.
    const slug = typeof p.slug === "string" ? p.slug.trim() : "";
    if (!slug) continue;
    const name = (typeof p.name === "string" ? p.name.trim() : "") || (typeof p.title === "string" ? p.title.trim() : "");
    if (!name) continue;
    results.push({ group: "Products", title: name, subtitle: "Product", href: `/products/${slug}` });
  }

  for (const service of STUDIO_SERVICES.slice(0, 4)) {
    results.push({ group: "Services", title: service.title, subtitle: service.meta, href: "/services" });
  }

  return results;
}

