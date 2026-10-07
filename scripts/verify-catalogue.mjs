import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(process.env.CATALOGUE_WORK ?? ".catalogue-work");
const read = async (file, fallback) => { try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; } };
const env = Object.fromEntries((await fs.readFile(path.resolve(".env"), "utf8")).split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null;
const source = await read(path.join(root, "sources", "catalogue-source-inventory.json"), { reports: [] });
const wallpaper = await read(path.join(root, "wallpapers", "manifest.json"), { totals: {}, catalogues: [] });
const carpetAudit = await read(path.join(root, "carpet-tile", "carpet-tile-source-audit.json"), { totals: {}, groups: [] });
const carpetManifest = await read(path.join(root, "carpet-tile", "manifest.json"), { totals: {}, collections: [] });
const staging = await (async () => { let files = 0; let bytes = 0; async function walk(dir) { let entries = []; try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; } for (const entry of entries) { const full = path.join(dir, entry.name); if (entry.isDirectory()) await walk(full); else if (entry.name.endsWith(".webp")) { files += 1; bytes += (await fs.stat(full)).size; } } } await walk(path.join(root, "wallpapers")); return { files, bytes }; })();
let live = { available: false, error: null, wallpaper_collections: 0, china_collections: 0, korea_collections: 0, rendered_page_media: 0, cover_media: 0, published_media: 0, missing_covers: 0, missing_pages: 0, duplicate_source_hashes: 0, duplicate_page_numbers: 0, missing_storage_paths: 0, storage_bucket: false };
if (db) {
  const categories = await db.from("categories").select("id,source_hash,country,page_count", { count: "exact" }).in("country", ["china", "korea"]).range(0, 199);
  const mediaRows = [];
  for (let offset = 0; offset < 10000; offset += 1000) {
    const page = await db.from("media").select("id,entity_id,media_type,page_number,is_published,storage_path", { count: "exact" }).eq("bucket", "wallpaper-catalogue").range(offset, offset + 999);
    if (page.error) { live.error = page.error.message; break; }
    mediaRows.push(...(page.data ?? []));
    if ((page.data ?? []).length < 1000) break;
  }
  const media = { error: null, data: mediaRows };
  if (categories.error || media.error) live.error = categories.error?.message ?? media.error?.message;
  else {
    const rows = (categories.data ?? []).filter((row) => row.source_hash); const pages = (media.data ?? []).filter((row) => row.media_type === "rendered-page"); const covers = (media.data ?? []).filter((row) => row.media_type === "cover");
    const hashGroups = new Map(); rows.forEach((row) => hashGroups.set(row.source_hash, (hashGroups.get(row.source_hash) ?? 0) + 1));
    const pageGroups = new Map(); pages.forEach((row) => { const key = `${row.entity_id}:${row.page_number}`; pageGroups.set(key, (pageGroups.get(key) ?? 0) + 1); });
    live = { available: true, error: null, wallpaper_collections: rows.length, china_collections: rows.filter((row) => row.country === "china").length, korea_collections: rows.filter((row) => row.country === "korea").length, rendered_page_media: pages.length, cover_media: covers.length, published_media: (media.data ?? []).filter((row) => row.is_published === true).length, missing_covers: rows.filter((row) => !covers.some((cover) => cover.entity_id === row.id)).length, missing_pages: rows.reduce((n, row) => n + Math.max(0, (row.page_count ?? 0) - pages.filter((page) => page.entity_id === row.id).length), 0), duplicate_source_hashes: [...hashGroups.values()].filter((count) => count > 1).length, duplicate_page_numbers: [...pageGroups.values()].filter((count) => count > 1).length, missing_storage_paths: (media.data ?? []).filter((row) => !row.storage_path).length, storage_bucket: true };
  }
}
const reports = source.reports ?? [];

/* Carpet Tile live verification (read-only). */
let carpet = { available: false, error: null };
if (db) {
  const parent = await db.from("categories").select("id").eq("slug", "carpet-tile").maybeSingle();
  if (parent.error) {
    carpet.error = parent.error.message;
  } else if (!parent.data) {
    carpet.error = "carpet-tile parent category not found";
  } else {
    const children = await db
      .from("categories")
      .select("id, slug, name, source_filename, source_hash, page_count, source_pdf_path")
      .eq("parent_id", parent.data.id);
    const ids = (children.data ?? []).map((row) => row.id);
    let mediaRows = [];
    if (ids.length) {
      const page = await db
        .from("media")
        .select("id, entity_id, media_type, page_number, is_published, storage_path, width, height")
        .eq("bucket", "carpet-catalogue")
        .in("entity_id", ids)
        .range(0, 4999);
      if (page.error) carpet.error = page.error.message;
      else mediaRows = page.data ?? [];
    }
    const pages = mediaRows.filter((row) => row.media_type === "rendered-page");
    const covers = mediaRows.filter((row) => row.media_type === "cover");
    const hashGroups = new Map();
    (children.data ?? []).forEach((row) =>
      hashGroups.set(row.source_hash, (hashGroups.get(row.source_hash) ?? 0) + 1)
    );
    const storage = db.storage.from("carpet-catalogue");
    let storageFolders = 0;
    const listed = await storage.list("carpet-tile", { limit: 100 });
    storageFolders = (listed.data ?? []).length;
    carpet = {
      available: true,
      error: null,
      collections: (children.data ?? []).length,
      rendered_page_media: pages.length,
      cover_media: covers.length,
      published_media: mediaRows.filter((row) => row.is_published === true).length,
      missing_covers: (children.data ?? []).filter((row) => !covers.some((c) => c.entity_id === row.id)).length,
      missing_pages: (children.data ?? []).reduce(
        (n, row) => n + Math.max(0, (row.page_count ?? 0) - pages.filter((p) => p.entity_id === row.id).length),
        0
      ),
      duplicate_source_hashes: [...hashGroups.values()].filter((count) => count > 1).length,
      missing_storage_paths: mediaRows.filter((row) => !row.storage_path).length,
      exposed_source_paths: (children.data ?? []).filter((row) => row.source_pdf_path).length,
      missing_dimensions: mediaRows.filter((row) => !row.width || !row.height).length,
      storage_folders: storageFolders,
    };
  }
}
const report = { generated_at: new Date().toISOString(), source_inventory: { source_files: reports.reduce((n, r) => n + r.totals.files, 0), unique_source_files: reports.reduce((n, r) => n + r.totals.files - r.totals.duplicate_files, 0), duplicate_files: reports.reduce((n, r) => n + r.totals.duplicate_files, 0), categories: reports.map((r) => ({ id: r.collection, files: r.totals.files, images: r.totals.images, videos: r.totals.videos, duplicates: r.totals.duplicate_files, source_status: r.status })) }, wallpaper: { source_catalogues: wallpaper.totals?.catalogues ?? 0, china_source_catalogues: wallpaper.totals?.china ?? 0, korea_source_catalogues: wallpaper.totals?.korea ?? 0, expected_pages: wallpaper.totals?.page_count ?? 0, rendered_pages: wallpaper.totals?.rendered_page_count ?? 0, live_database: live }, carpet_tile: carpet, staging, integrity: { missing_covers: live.missing_covers, missing_pages: live.missing_pages, duplicate_source_hashes: live.duplicate_source_hashes, duplicate_page_numbers: live.duplicate_page_numbers, missing_storage_paths: live.missing_storage_paths } };
await fs.mkdir(root, { recursive: true }); await fs.writeFile(path.join(root, "final-catalogue-verification.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report.wallpaper, null, 2)); console.log(JSON.stringify(report.integrity, null, 2));
console.log("CARPET TILE");
console.log(JSON.stringify({
  source: carpetAudit.totals,
  derived: carpetManifest.totals,
  live_database: carpet,
}, null, 2)); console.log(`REPORT ${path.join(root, "final-catalogue-verification.json")}`);

/* Hard gate: fail the run when the derived or live catalogue is inconsistent. */
const failures = [];
if (live.available) {
  for (const key of ["missing_covers", "missing_pages", "duplicate_source_hashes", "duplicate_page_numbers", "missing_storage_paths"]) {
    if (live[key]) failures.push(`wallpaper ${key}=${live[key]}`);
  }
}
if (carpet.available) {
  for (const key of ["missing_covers", "missing_pages", "duplicate_source_hashes", "missing_storage_paths", "exposed_source_paths", "missing_dimensions"]) {
    if (carpet[key]) failures.push(`carpet-tile ${key}=${carpet[key]}`);
  }
  if (carpet.collections !== carpetAudit.totals?.unique_pdfs) {
    failures.push(`carpet-tile collections=${carpet.collections} expected=${carpetAudit.totals?.unique_pdfs}`);
  }
  if (carpet.rendered_page_media !== carpetManifest.totals?.rendered_page_count) {
    failures.push(`carpet-tile pages=${carpet.rendered_page_media} expected=${carpetManifest.totals?.rendered_page_count}`);
  }
} else if (carpet.error) {
  failures.push(`carpet-tile ${carpet.error}`);
}
if (failures.length) {
  console.error(`VERIFICATION FAILED: ${failures.join("; ")}`);
  process.exitCode = 1;
}

