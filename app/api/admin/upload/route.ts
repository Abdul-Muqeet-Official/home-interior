/**
 * app/api/admin/upload/route.ts
 *
 * Catalog media upload. Writes the object into the project's existing Supabase
 * Storage buckets (supabase/remote-storage.sql) and records the canonical
 * `public.media` row, so the Media Library and the product / collection forms all
 * read from one table. The service-role key stays server-side; the browser only
 * ever posts the file.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mediaDbErrorHint, toMediaView } from "@/lib/supabase/media-row";
import { adminGuardWithSession } from "@/lib/supabase/guard";
import { logAudit } from "@/lib/supabase/audit";
import { revalidateCatalogue } from "@/lib/supabase/revalidate";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

const NOT_CONFIGURED = NextResponse.json(
  {
    error:
      "Uploads are disabled: SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env (never NEXT_PUBLIC_) and restart.",
    code: "admin-not-configured",
  },
  { status: 503 }
);

/**
 * Buckets that actually exist in this project's Supabase project
 * (verified against storage.listBuckets: site-assets, wallpaper-catalogue,
 * carpet-catalogue, laminate-flooring). Uploading to a non-existent bucket
 * fails at the storage layer, so the allow-list must match reality.
 */
const ALLOWED_BUCKETS = new Set([
  "site-assets",
  "wallpaper-catalogue",
  "carpet-catalogue",
  "laminate-flooring",
]);
const DEFAULT_BUCKET = "site-assets";
const MAX_BYTES = 50 * 1024 * 1024;
/**
 * SVG is intentionally excluded. It is an XML document that can carry script,
 * so serving an operator-uploaded .svg from the same origin as the site is a
 * stored-XSS vector. Upload a raster logo instead.
 */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
]);

/** Extension must agree with the declared MIME type. */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(request: NextRequest) {
  try {
    // Defence in depth: middleware already gates /api/admin/*, but this handler
    // runs on the service-role client, so it must verify the session itself.
    const guard = await adminGuardWithSession(request);
    if ("response" in guard) return guard.response;
    const session = guard.session;

    const admin = supabaseAdmin;
    if (!admin) return NOT_CONFIGURED;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const requestedBucket = String(formData.get("bucket") ?? DEFAULT_BUCKET);
    const bucket = ALLOWED_BUCKETS.has(requestedBucket) ? requestedBucket : DEFAULT_BUCKET;

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}` },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // The browser controls both `file.name` and `file.type`, so neither is trusted:
    //  - the extension is derived from the allow-listed MIME, not read from the name;
    //  - the stored name is generated here, keeping the original only as metadata.
    // This removes path traversal and double-extension tricks ("a.png.html").
    const expectedExtension = EXTENSION_BY_MIME[file.type];
    const declaredExtension = (file.name.split(".").pop() ?? "").toLowerCase();
    const acceptedExtensions =
      file.type === "image/jpeg" ? new Set(["jpg", "jpeg"]) : new Set([expectedExtension]);
    if (declaredExtension && !acceptedExtensions.has(declaredExtension)) {
      return NextResponse.json(
        {
          error: `File extension ".${declaredExtension}" does not match content type "${file.type}"`,
          code: "extension-mismatch",
        },
        { status: 400 }
      );
    }

    const scope = String(formData.get("scope") ?? "uploads");
    const safeScope = /^[a-z0-9-]{1,40}$/.test(scope) ? scope : "uploads";
    const storageName = `${Date.now()}-${crypto.randomUUID()}.${expectedExtension}`;
    const storagePath = `${safeScope}/${storageName}`;

    const { data: uploaded, error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
        cacheControl: "31536000",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message, code: "storage-error" },
        { status: 409 }
      );
    }

    const entityType = formData.get("entity_type");
    const entityId = formData.get("entity_id");
    const altText = formData.get("alt_text");
    const caption = formData.get("caption");

    const { data: row, error: insertError } = await admin
      .from("media")
      .insert({
        // The operator's original name is kept for the library label only; the
        // object itself is addressed by the generated path above.
        file_name: file.name.slice(0, 240) || storageName,
        storage_path: uploaded.path,
        bucket,
        mime_type: file.type,
        file_size: file.size,
        alt_text: typeof altText === "string" && altText.trim() ? altText.trim() : null,
        caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
        media_type: file.type.startsWith("video/") ? "video" : "image",
        entity_type: typeof entityType === "string" && entityType ? entityType : null,
        entity_id: typeof entityId === "string" && entityId ? entityId : null,
        is_published: true,
      })
      .select()
      .single();

    // Never leave an orphaned object behind when the catalogue row cannot be written.
    if (insertError) {
      await admin.storage.from(bucket).remove([uploaded.path]);
      const message = insertError.message ?? "Unknown database error";
      return NextResponse.json(
        { error: `${message}${mediaDbErrorHint(message)}`, code: "db-error" },
        { status: 409 }
      );
    }

    await logAudit("MEDIA_UPLOADED", session.userId, {
      entity: "media",
      entity_id: (row as { id?: string }).id ?? null,
      media_type: file.type.startsWith("video/") ? "video" : "image",
      bucket,
    });

    // A new media row is a catalogue change: the public pages must see it.
    revalidateCatalogue();
    return NextResponse.json({ media: toMediaView(row) }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
