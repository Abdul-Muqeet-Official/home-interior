/**
 * lib/supabase/storage.ts
 * Storage helpers. Server-only: they use the privileged admin client.
 */

import { supabaseAdmin } from "./admin";

/**
 * Upload a file to a bucket. `path` is the full storage path (e.g. 'projects/hero.jpg').
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  mimeType: string
) {
  const admin = supabaseAdmin;
  if (!admin) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  const { data, error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    console.error("[home-interior] Supabase storage upload error:", error.message);
    throw error;
  }

  return data;
}

/** Public URL for a stored file, or null when the admin client is unavailable. */
export function getPublicUrl(bucket: string, path: string): string | null {
  const admin = supabaseAdmin;
  if (!admin) return null;
  return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? null;
}
