import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { productToRow } from "@/lib/supabase/catalogue-row";
import { adminGuard } from "@/lib/supabase/guard";
import { revalidateProduct } from "@/lib/supabase/revalidate";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

/**
 * Catalogue writes go through the server-side service-role client only.
 * The key never reaches the browser, and no RLS write policy is opened to anon.
 */
function requireAdmin() {
  return supabaseAdmin;
}

/** 503 when the server-only service role key is absent — never a silent success. */
const NOT_CONFIGURED = NextResponse.json(
  {
    error:
      "Catalogue writes are disabled: SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env (never NEXT_PUBLIC_) and restart.",
    code: "admin-not-configured",
  },
  { status: 503 }
);

/** Surface the real database error so a missing migration is obvious, not a generic 500. */
function dbError(error: { message?: string } | null) {
  const message = error?.message ?? "Unknown database error";
  const hint = /column|does not exist|schema cache/i.test(message)
    ? " Run supabase/migrations/20260923_catalogue_pricing.sql first."
    : "";
  return NextResponse.json({ error: `${message}${hint}`, code: "db-error" }, { status: 409 });
}

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10), 1), 500);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  let query = admin
    .from("products")
    .select(
      "id, name, slug, description, category_id, code, price, currency, unit, is_published, sort_order, categories(name, slug), created_at, updated_at"
    )
    .order("sort_order", { ascending: true })
    .range(offset, offset + limit - 1);

  if (status === "published") {
    query = query.eq("is_published", true);
  } else if (status === "draft") {
    query = query.eq("is_published", false);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) return dbError(error);
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const row = productToRow(await request.json());
  if (!row.name || !row.slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const { data, error } = await admin.from("products").insert(row).select().single();
  if (error) return dbError(error);
  revalidateProduct(data.slug);
  return NextResponse.json({ product: data }, { status: 201 });
}
