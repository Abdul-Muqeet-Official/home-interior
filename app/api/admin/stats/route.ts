import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminGuard } from "@/lib/supabase/guard";

/** Counts are live and account-specific: never cached, never hard-coded. */
export const dynamic = "force-dynamic";

/**
 * Real dashboard counts.
 *
 * The dashboard previously rendered fixed placeholder numbers ("0", "10"),
 * which misrepresented the live catalogue. Every figure below is counted from
 * the database at request time. Categories are reported as active/total because
 * that is what the public site actually shows.
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "Statistics are unavailable: SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env (never NEXT_PUBLIC_) and restart.",
        code: "admin-not-configured",
      },
      { status: 503 },
    );
  }

  const [products, publishedProducts, categories, activeCategories, projects, publishedProjects, reviews, publishedReviews, media, publishedMedia] =
    await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("media").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("media").select("id", { count: "exact", head: true }).eq("is_published", true),
    ]);

  // A missing table must not silently read as zero.
  const failure = [products, categories, projects, reviews, media].find((r) => r.error);
  if (failure?.error) {
    return NextResponse.json({ error: failure.error.message, code: "db-error" }, { status: 409 });
  }

  return NextResponse.json({
    products: { total: products.count ?? 0, published: publishedProducts.count ?? 0 },
    categories: { total: categories.count ?? 0, published: activeCategories.count ?? 0 },
    projects: { total: projects.count ?? 0, published: publishedProjects.count ?? 0 },
    reviews: { total: reviews.count ?? 0, published: publishedReviews.count ?? 0 },
    media: { total: media.count ?? 0, published: publishedMedia.count ?? 0 },
  });
}
