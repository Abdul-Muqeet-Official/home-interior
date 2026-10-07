/**
 * scripts/ensure-carpet-tile-bucket.mjs
 *
 * Creates the `carpet-catalogue` public bucket and its public-read policy.
 * Idempotent and additive: it never drops, truncates or alters wallpaper-catalogue,
 * site-assets, or any table data. Re-running is a no-op.
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "carpet-catalogue";

const env = Object.fromEntries(
  (await fs.readFile(path.resolve(".env"), "utf8"))
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const before = await db.storage.listBuckets();
if (before.error) throw new Error(`LIST BUCKETS FAILED: ${before.error.message}`);
const existing = before.data.find((b) => b.id === BUCKET);

if (existing) {
  console.log(`bucket ${BUCKET} already exists (public=${existing.public})`);
  if (!existing.public) {
    const updated = await db.storage.updateBucket(BUCKET, { public: true });
    if (updated.error) throw new Error(`UPDATE BUCKET FAILED: ${updated.error.message}`);
    console.log(`bucket ${BUCKET} set to public`);
  }
} else {
  const created = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 15728640, // 15 MB — matches the derivative ceiling
    allowedMimeTypes: ["image/webp"],
  });
  if (created.error) throw new Error(`CREATE BUCKET FAILED: ${created.error.message}`);
  console.log(`bucket ${BUCKET} created (public, image/webp only)`);
}

const after = await db.storage.listBuckets();
console.log(`buckets now: ${after.data.map((b) => b.id).join(", ")}`);
