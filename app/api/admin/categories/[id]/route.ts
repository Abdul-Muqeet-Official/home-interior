import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { categoryToRow } from "@/lib/supabase/catalogue-row";
import { adminGuard } from "@/lib/supabase/guard";
import { revalidateCatalogue } from "@/lib/supabase/revalidate";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

function requireAdmin() {
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
    ? " Run supabase/migrations/20260923_catalogue_pricing.sql and 20260924_catalogue_hierarchy.sql first."
    : "";
  return NextResponse.json({ error: `${message}${hint}`, code: "db-error" }, { status: 409 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const { data, error } = await admin.from("categories").select("*").eq("id", id).maybeSingle();

  if (error) return dbError(error);
  if (!data) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  return NextResponse.json({ category: data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const row = categoryToRow(await request.json());
  if (!row.name || !row.slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const { data, error } = await admin.from("categories").update(row).eq("id", id).select().single();
  if (error) return dbError(error);
  revalidateCatalogue(data.slug);
  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;

  // Safe delete: refuse while child collections still reference this category,
  // rather than silently orphaning them.
  const { count: childCount, error: childError } = await admin
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (childError) return dbError(childError);

  if ((childCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `This category still has ${childCount} collection${childCount === 1 ? "" : "s"}. Unpublish it instead, or remove the collections first.`,
        code: "has-children",
        childCount,
      },
      { status: 409 },
    );
  }

  const { data, error } = await admin.from("categories").delete().eq("id", id).select("slug").maybeSingle();
  if (error) return dbError(error);
  revalidateCatalogue(data?.slug ?? null);
  return NextResponse.json({ success: true });
}

/** Partial update — publish/unpublish a collection from the list view. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
    patch.sort_order = Number(body.sort_order);
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await admin.from("categories").update(patch).eq("id", id).select().single();
  if (error) return dbError(error);
  revalidateCatalogue(data.slug);
  return NextResponse.json({ category: data });
}
