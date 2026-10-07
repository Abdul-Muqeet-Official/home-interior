import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.env.WALLPAPER_SOURCE ?? "C:\\Users\\DELL\\Pictures\\Wallpapers";
const WORK = path.resolve(process.env.WALLPAPER_WORK ?? ".catalogue-work/wallpapers");
const APPLY = process.argv.includes("--apply");
const SCALE = Number(process.env.WALLPAPER_DPI ?? 144) / 72;
const countries = ["china", "korea"];
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const slugify = (v) => v.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "collection";
const nameOf = (f) => path.basename(f, path.extname(f)).trim();
const exists = async (f) => { try { await fs.access(f); return true; } catch { return false; } };
const write = async (f, data) => { await fs.mkdir(path.dirname(f), { recursive: true }); await fs.writeFile(f, data); };
const env = Object.fromEntries(await fs.readFile(path.resolve(".env"), "utf8").then((text) => text.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")]; })));
const db = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null;
const requiredCategoryColumns = ["country", "source_filename", "source_hash", "page_count", "source_pdf_path"];
const requiredMediaColumns = ["media_type", "page_number", "checksum", "is_published"];
async function preflight() {
  if (!db) throw new Error("PREFLIGHT FAILED: server Supabase environment is unavailable");
  const category = await db.from("categories").select(requiredCategoryColumns.join(",")).limit(1);
  const media = await db.from("media").select(requiredMediaColumns.join(",")).limit(1);
  if (category.error) throw new Error(`PREFLIGHT FAILED categories: ${category.error.message}`);
  if (media.error) throw new Error(`PREFLIGHT FAILED media: ${media.error.message}`);
  const buckets = await db.storage.listBuckets();
  if (buckets.error) throw new Error(`PREFLIGHT FAILED storage: ${buckets.error.message}`);
  if (!buckets.data.some((bucket) => bucket.id === "wallpaper-catalogue")) throw new Error("PREFLIGHT FAILED bucket: wallpaper-catalogue not found");
  return { project: new URL(env.SUPABASE_URL).hostname, categoryColumns: requiredCategoryColumns, mediaColumns: requiredMediaColumns, bucket: "wallpaper-catalogue" };
}

async function processPdf(sourcePath, country, filename) {
  const slug = slugify(nameOf(filename));
  const sourceBuffer = await fs.readFile(sourcePath);
  const sourceHash = hash(sourceBuffer);
  const dir = path.join(WORK, country, slug);
  const manifestPath = path.join(dir, "manifest.json");
  const prior = await exists(manifestPath) ? JSON.parse(await fs.readFile(manifestPath, "utf8")) : null;
  if (prior?.source_hash === sourceHash && prior.processing_status === "PROCESSED") return prior;
  const out = { collection_name: nameOf(filename), slug, country, original_filename: filename, source_path: sourcePath, source_hash: sourceHash, source_size: sourceBuffer.length, mime: "application/pdf", processing_status: "PROCESSING", generated_at: new Date().toISOString(), page_count: 0, rendered_page_count: 0, extracted_image_count: 0, extracted_video_count: 0, cover: null, warnings: [], errors: [], assets: [] };
  try {
    await write(path.join(dir, "source", filename), sourceBuffer);
    const doc = await getDocument({ data: new Uint8Array(sourceBuffer), disableWorker: true, isEvalSupported: false }).promise;
    out.page_count = doc.numPages;
    for (let number = 1; number <= doc.numPages; number++) {
      try {
        const page = await doc.getPage(number);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        const full = canvas.toBuffer("image/webp", 88);
        const thumbCanvas = createCanvas(Math.max(1, Math.ceil(viewport.width * .28)), Math.max(1, Math.ceil(viewport.height * .28)));
        thumbCanvas.getContext("2d").drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        const thumb = thumbCanvas.toBuffer("image/webp", 78);
        const base = `page-${String(number).padStart(4, "0")}.webp`;
        await write(path.join(dir, "pages", base), full);
        await write(path.join(dir, "thumbnails", base), thumb);
        out.assets.push({ page_number: number, media_type: "rendered-page", width: canvas.width, height: canvas.height, checksum: hash(full), thumbnail: { path: `thumbnails/${base}`, checksum: hash(thumb), width: thumbCanvas.width, height: thumbCanvas.height } });
        if (number === 1) { await write(path.join(dir, "cover.webp"), full); out.cover = { path: "cover.webp", checksum: hash(full), source_page: 1 }; }
        out.rendered_page_count++;
      } catch (error) { out.warnings.push(`Page ${number}: ${error.message}`); }
    }
    out.processing_status = out.rendered_page_count === out.page_count ? "PROCESSED" : out.rendered_page_count ? "WARNING" : "FAILED";
  } catch (error) { out.processing_status = "FAILED"; out.errors.push(error.message); }
  await write(manifestPath, JSON.stringify(out, null, 2));
  return out;
}

async function uploadFile(buffer, storagePath) {
  const result = await db.storage.from("wallpaper-catalogue").upload(storagePath, buffer, { contentType: "image/webp", upsert: true });
  if (result.error) throw new Error(`UPLOAD ${storagePath}: ${result.error.message}`);
}
async function importWallpaper() {
  const parentSlug = "wallpaper";
  const { data: existingParent, error: parentError } = await db.from("categories").select("id,name,slug").eq("slug", parentSlug).maybeSingle();
  if (parentError) throw parentError;
  const parent = existingParent ?? (await db.from("categories").insert({ name: "Wallpaper", slug: parentSlug, description: "Wallpaper catalogue collections.", is_active: true, sort_order: 4 }).select("id").single()).data;
  const countryIds = {};
  for (const [country, name, order] of [["china", "China", 1], ["korea", "Korea", 2]]) {
    const slug = `wallpaper-${country}`;
    const { data: row, error } = await db.from("categories").select("id,name,slug").eq("slug", slug).maybeSingle();
    if (error) throw error;
    countryIds[country] = row?.id ?? (await db.from("categories").insert({ name, slug, parent_id: parent.id, country, is_active: true, sort_order: order }).select("id").single()).data.id;
  }
  let insertedCollections = 0;
  let insertedMedia = 0;
  let existingCovers = 0;
  for (const collection of results) {
    const collectionSlug = `wallpaper-${collection.country}-${collection.slug}`;
    const { data: existing, error } = await db.from("categories").select("id").eq("source_hash", collection.source_hash).maybeSingle();
    if (error) throw error;
    const row = { name: collection.collection_name, slug: collectionSlug, parent_id: countryIds[collection.country], country: collection.country, source_filename: collection.original_filename, source_hash: collection.source_hash, page_count: collection.page_count, source_pdf_path: null, is_active: true, sort_order: 0 };
    const category = existing ?? (await db.from("categories").insert(row).select("id").single()).data;
    if (!existing) insertedCollections++;
    const base = `${collection.country}/${collection.slug}`;
    for (const asset of collection.assets ?? []) {
      const file = `page-${String(asset.page_number).padStart(4, "0")}.webp`;
      const pagePath = `${base}/pages/${file}`;
      const thumbPath = `${base}/thumbnails/${file}`;
      const pageBuffer = await fs.readFile(path.join(WORK, collection.country, collection.slug, "pages", file));
      const thumbBuffer = await fs.readFile(path.join(WORK, collection.country, collection.slug, "thumbnails", file));
      await uploadFile(pageBuffer, pagePath);
      await uploadFile(thumbBuffer, thumbPath);
      const mediaRow = { file_name: file, storage_path: pagePath, bucket: "wallpaper-catalogue", mime_type: "image/webp", file_size: pageBuffer.length, alt_text: `${collection.collection_name} wallpaper catalogue — page ${asset.page_number}`, entity_type: "category", entity_id: category.id, media_type: "rendered-page", page_number: asset.page_number, checksum: asset.checksum, width: asset.width, height: asset.height, caption: `Page ${asset.page_number}`, sort_order: asset.page_number, is_published: true };
      const { data: existingMedia } = await db.from("media").select("id").eq("entity_id", category.id).eq("page_number", asset.page_number).eq("media_type", "rendered-page").maybeSingle();
      if (existingMedia) await db.from("media").update(mediaRow).eq("id", existingMedia.id);
      else { const insert = await db.from("media").insert(mediaRow); if (insert.error) throw insert.error; insertedMedia++; }
    }
    const coverPath = `${base}/cover.webp`;
    const coverBuffer = await fs.readFile(path.join(WORK, collection.country, collection.slug, "cover.webp"));
    await uploadFile(coverBuffer, coverPath);
    const { data: coverMedia } = await db.from("media").select("id").eq("entity_id", category.id).eq("media_type", "cover").maybeSingle();
    const coverRow = { file_name: "cover.webp", storage_path: coverPath, bucket: "wallpaper-catalogue", mime_type: "image/webp", file_size: coverBuffer.length, alt_text: `${collection.collection_name} wallpaper catalogue cover`, entity_type: "category", entity_id: category.id, media_type: "cover", page_number: 1, checksum: collection.cover.checksum, width: collection.assets?.[0]?.width ?? null, height: collection.assets?.[0]?.height ?? null, caption: "Collection cover", sort_order: 0, is_published: true };
    if (coverMedia) { await db.from("media").update(coverRow).eq("id", coverMedia.id); existingCovers++; }
    else { const insert = await db.from("media").insert(coverRow); if (insert.error) throw insert.error; insertedMedia++; }
  }
  console.log(JSON.stringify({ insertedCollections, insertedMedia, existingCovers }, null, 2));
}
const results = [];
for (const country of countries) {
  const dir = path.join(ROOT, country);
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch (error) { console.error(`SOURCE FAILED ${country}: ${error.message}`); continue; }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf") results.push(await processPdf(path.join(dir, entry.name), country, entry.name));
  }
}
const totals = { catalogues: results.length, china: results.filter(x => x.country === "china").length, korea: results.filter(x => x.country === "korea").length, processed: results.filter(x => x.processing_status === "PROCESSED").length, warnings: results.filter(x => x.processing_status === "WARNING").length, failed: results.filter(x => x.processing_status === "FAILED").length, page_count: results.reduce((n, x) => n + (x.page_count || 0), 0), rendered_page_count: results.reduce((n, x) => n + (x.rendered_page_count || 0), 0), extracted_image_count: 0, extracted_video_count: 0, duplicate_source_groups: 0 };
const manifest = { source_root: ROOT, generated_at: new Date().toISOString(), renderer: "@napi-rs/canvas + pdfjs-dist", dpi: Number(process.env.WALLPAPER_DPI ?? 144), totals, catalogues: results };
await write(path.join(WORK, "manifest.json"), JSON.stringify(manifest, null, 2));
await write(path.join(WORK, "wallpaper-ingestion-report.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(totals, null, 2));
if (APPLY) {
  try {
    const diagnostics = await preflight();
    console.log(JSON.stringify({ preflight: diagnostics, dryRun: { collections: results.length, pages: totals.rendered_page_count, covers: results.filter((x) => x.cover).length } }, null, 2));
    await importWallpaper();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
} else console.log(`DRY-RUN: real page derivatives written under ${WORK}; source library untouched.`);

