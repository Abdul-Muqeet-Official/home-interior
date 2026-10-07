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

  const { data, error } = await admin
    .from("products")
    .select("*, categories(name, slug)")
    .order("sort_order", { ascending: true });

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
