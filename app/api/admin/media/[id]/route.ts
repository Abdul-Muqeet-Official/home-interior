import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toMediaView } from "@/lib/supabase/media-row";
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
      "Media management is disabled: SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env (never NEXT_PUBLIC_) and restart.",
    code: "admin-not-configured",
  },
  { status: 503 }
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid media id" }, { status: 400 });

  // Storage object first, so a failed row delete never leaves an orphaned file.
  const { data: row, error: fetchError } = await admin
    .from("media")
    .select("bucket, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 409 });
  }

  if (row?.bucket && row.storage_path) {
    const { error: storageError } = await admin.storage
      .from(row.bucket)
      .remove([row.storage_path]);
    if (storageError) {
      return NextResponse.json(
        { error: `Could not remove the stored file: ${storageError.message}` },
        { status: 409 }
      );
    }
  }

  const { error } = await admin.from("media").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });

  revalidateCatalogue();
  return NextResponse.json({ success: true, removed: toMediaView(row ?? {}) });
}
