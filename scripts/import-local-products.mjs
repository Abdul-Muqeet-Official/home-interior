import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SOURCES = [
  {
    categorySlug: "vinyl-flooring",
    categoryName: "Vinyl Flooring",
    directory: "C:\\Users\\DELL\\Pictures\\PVC VNYL FLOORING",
  },
  {
    categorySlug: "spc-flooring",
    categoryName: "SPC Flooring",
    directory: "C:\\Users\\DELL\\Pictures\\SPC FLOORING",
  },
];

const MIME_TYPES = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const apply = process.argv.includes("--apply");

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function listSourceFiles(source) {
  const entries = await fs.readdir(source.directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && MIME_TYPES.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function buildManifest() {
  const manifest = [];
  for (const source of SOURCES) {
    const files = await listSourceFiles(source);
    files.forEach((fileName, index) => {
      const number = String(index + 1).padStart(2, "0");
      const slug = `${source.categorySlug}-sample-${number}`;
      manifest.push({
        categorySlug: source.categorySlug,
        categoryName: source.categoryName,
        fileName,
        sourcePath: path.join(source.directory, fileName),
        slug,
        name: `${source.categoryName} Sample ${number}`,
        storagePath: `products/${slug}/${fileName}`,
      });
    });
  }
  return manifest;
}

async function importProducts(manifest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("--apply requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: categories, error: categoryError } = await admin
    .from("categories")
    .select("id, slug, name")
    .in("slug", SOURCES.map((source) => source.categorySlug));
  if (categoryError) throw categoryError;

  const categoryBySlug = new Map((categories ?? []).map((category) => [category.slug, category]));
  for (const source of SOURCES) {
    if (!categoryBySlug.has(source.categorySlug)) {
      throw new Error(`Missing active category row for ${source.categorySlug}. Create it in admin first.`);
    }
  }

  let imported = 0;
  let skipped = 0;
  for (const item of manifest) {
    const { data: existing, error: existingError } = await admin
      .from("products")
      .select("id")
      .eq("slug", item.slug)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      skipped += 1;
      console.log(`SKIP existing ${item.slug}`);
      continue;
    }

    const fileBuffer = await fs.readFile(item.sourcePath);
    const contentType = MIME_TYPES.get(path.extname(item.fileName).toLowerCase());
    const { error: uploadError } = await admin.storage
      .from("products")
      .upload(item.storagePath, fileBuffer, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    const category = categoryBySlug.get(item.categorySlug);
    const { error: insertError } = await admin.from("products").insert({
      category_id: category.id,
      name: item.name,
      slug: item.slug,
      description: null,
      specs: { source_file: item.fileName },
      price_label: null,
      image_path: item.storagePath,
      gallery_paths: [item.storagePath],
      is_published: false,
      sort_order: imported,
    });
    if (insertError) {
      await admin.storage.from("products").remove([item.storagePath]);
      throw insertError;
    }

    imported += 1;
    console.log(`IMPORT ${item.slug}`);
  }

  console.log(`DONE imported=${imported} skipped=${skipped}`);
}

const manifest = await buildManifest();
console.log(`DISCOVERED ${manifest.length} source images`);
for (const item of manifest) {
  console.log(`${apply ? "READY" : "DRY-RUN"} ${item.categorySlug} ${item.fileName} -> ${item.slug}`);
}

if (apply) {
  await importProducts(manifest);
} else {
  console.log("No database or storage changes made. Re-run with --apply using server-only Supabase credentials.");
}
