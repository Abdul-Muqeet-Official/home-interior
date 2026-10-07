import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { productToRow } from "@/lib/supabase/catalogue-row";
import { adminGuard } from "@/lib/supabase/guard";
import { revalidateProduct } from "@/lib/supabase/revalidate";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

function requireAdmin() {
  if (!supabaseAdmin) return null;
  return supabaseAdmin;
}

const NOT_CONFIGURED = NextResponse.json(
  {
    error:
      "Catalogue writes are disabled: SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env (never NEXT_PUBLIC_) and restart.",
    code: "admin-not-configured",
  },
  { status: 503 }
);

function dbError(error: { message?: string } | null) {
  const message = error?.message ?? "Unknown database error";
  const hint = /column|does not exist|schema cache/i.test(message)
    ? " Run supabase/migrations/20260923_catalogue_pricing.sql first."
    : "";
  return NextResponse.json({ error: `${message}${hint}`, code: "db-error" }, { status: 409 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const { data, error } = await admin
    .from("products")
    .select("*, categories(name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (error) return dbError(error);
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const row = productToRow(await request.json());
  if (!row.name || !row.slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const { data, error } = await admin.from("products").update(row).eq("id", id).select().single();
  if (error) return dbError(error);
  revalidateProduct(data.slug);
  return NextResponse.json({ product: data });
}

/**
 * Partial update — used by the list view's publish/unpublish action so the table
 * can flip visibility without resending the whole record.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.is_published === "boolean") patch.is_published = body.is_published;
  if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
    patch.sort_order = Number(body.sort_order);
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await admin.from("products").update(patch).eq("id", id).select().single();
  if (error) return dbError(error);
  revalidateProduct(data.slug);
  return NextResponse.json({ product: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const { data, error } = await admin.from("products").delete().eq("id", id).select("slug").maybeSingle();
  if (error) return dbError(error);
  revalidateProduct(data?.slug ?? null);
  return NextResponse.json({ success: true });
}
