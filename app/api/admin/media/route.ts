import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mediaDbErrorHint, toMediaView, type MediaRow } from "@/lib/supabase/media-row";
import { adminGuard } from "@/lib/supabase/guard";
import { revalidateCatalogue } from "@/lib/supabase/revalidate";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

/** Route handlers may only export HTTP verbs, so shared mappers live in lib/supabase. */
const MEDIA_BUCKETS = new Set(["products", "product-media", "project-media", "site-media", "site-assets", "wallpaper-catalogue"]);
const MEDIA_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "application/pdf"]);
const safePath = (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*\.[a-zA-Z0-9]+$/.test(value) && !value.includes("..");
const mediaInput = z.object({
  storage_path: z.string().min(3).max(500).refine(safePath, "Invalid storage path"),
  bucket: z.string().refine((value) => MEDIA_BUCKETS.has(value), "Unsupported storage bucket"),
  mime_type: z.string().refine((value) => MEDIA_MIMES.has(value), "Unsupported media type"),
  file_name: z.string().min(1).max(240).optional(),
  file_size: z.number().int().nonnegative().max(250_000_000).nullable().optional(),
  alt_text: z.string().max(500).nullable().optional(),
  entity_type: z.enum(["category", "product", "project", "collection"]).nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(100000).optional(),
  media_type: z.enum(["image", "video", "source-pdf", "rendered-page", "thumbnail", "cover", "extracted-image", "poster"]).optional(),
  page_number: z.number().int().positive().nullable().optional(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/i).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  poster_path: z.string().max(500).nullable().optional(),
});

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

function dbError(error: { message?: string } | null) {
  const message = error?.message ?? "Unknown database error";
  return NextResponse.json(
    { error: `${message}${mediaDbErrorHint(message)}`, code: "db-error" },
    { status: 409 }
  );
}

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const { data, error } = await admin
    .from("media")
    .select("id,file_name,storage_path,bucket,mime_type,file_size,alt_text,entity_type,entity_id,width,height,caption,poster_path,sort_order,created_at,media_type,page_number,checksum,is_published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return dbError(error);
  return NextResponse.json({ media: (data ?? []).map((row) => toMediaView(row as MediaRow)) });
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const raw = await request.json().catch(() => null);
  const parsed = mediaInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid media payload", code: "validation-error" }, { status: 400 });
  }
  const body = parsed.data;
  if (!body.storage_path || !body.bucket || !body.mime_type) {
    return NextResponse.json({ error: "storage_path, bucket and mime_type are required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("media")
    .insert({
      file_name: body.file_name ?? body.storage_path,
      storage_path: body.storage_path,
      bucket: body.bucket,
      mime_type: body.mime_type,
      file_size: body.file_size ?? null,
      alt_text: body.alt_text ?? null,
      entity_type: body.entity_type ?? null,
      entity_id: body.entity_id ?? null,
      is_featured: Boolean(body.is_featured),
      is_published: body.is_published === true,
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
      media_type: body.media_type ?? null,
      page_number: body.page_number ?? null,
      checksum: body.checksum ?? null,
      caption: body.caption ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      poster_path: body.poster_path ?? null,
    })
    .select()
    .single();

  if (error) return dbError(error);
  // Media changes the collection pages and every rail that renders it.
  revalidateCatalogue();
  return NextResponse.json({ media: toMediaView(data as MediaRow) }, { status: 201 });
}

/**
 * Bulk reorder — the Media Library sends the whole ordered id list so ordering is
 * persisted in the database rather than only in client state.
 * Body: { order: string[] }
 */
export async function PATCH(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const admin = requireAdmin();
  if (!admin) return NOT_CONFIGURED;

  const body = await request.json().catch(() => ({}));
  const order: unknown = body?.order;
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "order must be an array of media ids" }, { status: 400 });
  }

  const ids = order as string[];

  // One batched upsert instead of a sequential update per row (was N round trips).
  const rows = ids.map((mediaId, index) => ({ id: mediaId, sort_order: index }));
  const { error } = await admin.from("media").upsert(rows, { onConflict: "id" });
  if (error) return dbError(error);

  revalidateCatalogue();
  return NextResponse.json({ success: true, reordered: order.length });
}
