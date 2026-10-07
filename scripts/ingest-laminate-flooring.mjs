/**
 * scripts/ingest-laminate-flooring.mjs
 *
 * Laminate Flooring catalogue ingestion.
 *
 * Design mirrors the proven Wallpaper pipeline (scripts/ingest-wallpapers.mjs) rather
 * than duplicating it: deterministic SHA-256 source identity, resumable manifests,
 * page-level failure isolation, WebP page + thumbnail derivatives, a real cover taken
 * from the catalogue's own strongest page, and an idempotent Supabase import.
 *
 * Identity rules
 *   collection : source_hash (unique PDF)  ->  one row in public.categories
 *   page       : collection_id + page_number
 *   storage    : laminate-flooring/<slug>/...    -> deterministic, no local paths exposed
 *
 * Duplicate source files ("Aurora (1).pdf", "Greenland (1).pdf", ...) are collapsed by
 * SHA-256. Two files that merely look alike but hash differently stay separate.
 *
 * Usage
 *   node scripts/ingest-laminate-flooring.mjs            # process + dry run
 *   node scripts/ingest-laminate-flooring.mjs --apply    # process + upload + insert
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createCanvas, Image as CanvasImage } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.env.LAMINATE_FLOORING_SOURCE ?? "C:\\Users\\DELL\\Pictures\\LAMINATE FLOORING";
const WORK = path.resolve(process.env.LAMINATE_FLOORING_WORK ?? ".catalogue-work/laminate-flooring");
const APPLY = process.argv.includes("--apply");
// `--audit-only` stops after the recursive source scan and SHA-256 grouping, so the
// source library can be re-audited without rendering anything or touching Supabase.
const AUDIT_ONLY = process.argv.includes("--audit-only");
// `--dry-run` renders and stages derivatives locally but never mutates Supabase.
const DRY_RUN = process.argv.includes("--dry-run");
const SCALE = Number(process.env.LAMINATE_FLOORING_DPI ?? 144) / 72;
const BUCKET = "laminate-flooring";
const CATEGORY_SLUG = "laminate-flooring";
const COLLECTION_PREFIX = "laminate-flooring-";
/** Cover long edge cap. Cards render well below this; it keeps covers under ~250 kB. */
const MAX_COVER_EDGE = 1400;

/* ---------------------------------------------------------------- helpers */

const hash = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const slugify = (value) =>
  value
    .normalize("NFKC")
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "collection";
const baseName = (file) => path.basename(file, path.extname(file)).trim();

/**
 * Human-facing collection name.
 * "Aurora.PDF.pdf" is a real double-extension download; the studio-facing name is
 * "Aurora". The untouched original is always preserved in source_filename.
 *
 * Only alphabetic extensions are collapsed, so a genuine name such as
 * "G1061N2 F PP 9.27" keeps its ".27".
 */
function displayName(file) {
  let stem = baseName(file);
  // `path.extname` includes the leading dot, so the pattern must match it too.
  while (/^\.[A-Za-z]{2,5}$/.test(path.extname(stem))) {
    const next = path.basename(stem, path.extname(stem)).trim();
    if (!next || next === stem) break;
    stem = next;
  }
  return stem || baseName(file);
}
const pageFile = (n) => `page-${String(n).padStart(4, "0")}.webp`;
const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};
const write = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
};

/**
 * Prefer the original filename over a "(1)" style re-download.
 * The test runs on the stem (extension removed), otherwise "Aurora (1).pdf"
 * never matches because the name ends in ".pdf".
 */
const duplicateSuffixRank = (name) =>
  (/\s\(\d+\)$/.test(path.basename(name, path.extname(name))) ? 1 : 0);

async function loadEnv() {
  const text = await fs.readFile(path.resolve(".env"), "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
      })
  );
}


/* ------------------------------------------------------------------ audit */

async function auditSource() {
  const files = [];
  let status = "SUCCESS";
  let error = null;
  const walk = async (dir) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const buffer = await fs.readFile(full);
      files.push({
        filename: entry.name,
        relative_path: path.relative(ROOT, full),
        extension: ext,
        is_pdf: ext === ".pdf",
        bytes: buffer.length,
        sha256: hash(buffer),
      });
    }
  };
  try {
    await walk(ROOT);
  } catch (err) {
    status = "FAILED";
    error = err.message;
  }

  files.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

  // Group by content hash. Only byte-identical files are duplicates.
  const byHash = new Map();
  for (const file of files) {
    if (!file.is_pdf) continue;
    if (!byHash.has(file.sha256)) byHash.set(file.sha256, []);
    byHash.get(file.sha256).push(file);
  }

  const groups = [];
  for (const [sha256, members] of byHash) {
    members.sort(
      (a, b) =>
        duplicateSuffixRank(a.filename) - duplicateSuffixRank(b.filename) ||
        a.filename.localeCompare(b.filename, undefined, { numeric: true })
    );
    groups.push({
      source_hash: sha256,
      canonical_filename: members[0].filename,
      duplicate_filenames: members.slice(1).map((m) => m.filename),
      bytes: members[0].bytes,
      members: members.map((m) => m.filename),
    });
  }
  groups.sort((a, b) =>
    a.canonical_filename.localeCompare(b.canonical_filename, undefined, { numeric: true })
  );

  return {
    generated_at: new Date().toISOString(),
    source_root: ROOT,
    status,
    error,
    files,
    groups,
    totals: {
      files: files.length,
      pdf_files: files.filter((f) => f.is_pdf).length,
      non_pdf_files: files.filter((f) => !f.is_pdf).length,
      unique_pdfs: groups.length,
      duplicate_pdfs: groups.reduce((n, g) => n + g.duplicate_filenames.length, 0),
    },
  };
}

/* --------------------------------------------------------------- renderer */

/** Coarse visual-detail measure (colour spread) used for cover page scoring. */
function measureDetail(canvas) {
  const probe = createCanvas(24, 24);
  const ctx = probe.getContext("2d");
  ctx.drawImage(canvas, 0, 0, 24, 24);
  const { data } = ctx.getImageData(0, 0, 24, 24);
  const seen = new Set();
  for (let i = 0; i < data.length; i += 4) {
    seen.add(((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3));
  }
  return seen.size;
}

/**
 * Pick the strongest page for the cover.
 *
 * A Laminate Flooring cover should show product, not a blank sheet or a sliver. We prefer a
 * page whose shape suits the square card crop (penalising extreme strips such as the
 * 2400x13252 Greenland page) and that actually carries visible pixel detail. Ties break
 * on page number, so the choice is deterministic across runs.
 */
function chooseCoverIndex(pages) {
  if (pages.length === 0) return -1;
  const scored = pages.map((p, index) => {
    const long = Math.max(p.width, p.height);
    const short = Math.max(1, Math.min(p.width, p.height));
    const aspect = long / short;
    // 0 for extreme strips, rising as the page approaches a square.
    const shapeScore = aspect <= 1.6 ? 1000 : Math.max(0, 1000 - (aspect - 1.6) * 120);
    return { index, score: shapeScore + p.detail * 2 };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0].index;
}

/** Decode a WebP buffer into a canvas-backed image (awaited, unlike a bare .src assign). */
function decodeImage(buffer) {
  return new Promise((resolve, reject) => {
    const image = new CanvasImage();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(new Error(`COVER DECODE FAILED: ${error?.message ?? "unknown"}`));
    image.src = buffer;
  });
}

/** Square cover crop with a stable 1:1 aspect ratio for the card grid. */
function toCoverSquare(canvas) {
  const size = Math.max(1, Math.min(canvas.width, canvas.height));
  // Cap the long edge so a huge source page cannot produce a multi-megabyte cover.
  const target = Math.min(size, MAX_COVER_EDGE);
  const out = createCanvas(target, target);
  out.getContext("2d").drawImage(canvas, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size, 0, 0, target, target);
  return out;
}

async function processCollection(group) {
  const sourcePath = path.join(ROOT, group.canonical_filename);
  const collectionName = displayName(group.canonical_filename);
  const slug = slugify(displayName(group.canonical_filename));
  const dir = path.join(WORK, slug);
  const manifestPath = path.join(dir, "manifest.json");

  const sourceBuffer = await fs.readFile(sourcePath);
  const sourceHash = hash(sourceBuffer);
  if (sourceHash !== group.source_hash) {
    throw new Error(`SOURCE CHANGED for ${group.canonical_filename}`);
  }

  const prior = (await exists(manifestPath))
    ? JSON.parse(await fs.readFile(manifestPath, "utf8"))
    : null;
  if (prior?.source_hash === sourceHash && prior.processing_status === "PROCESSED") {
    return { ...prior, resumed: true };
  }

  const out = {
    collection_name: collectionName,
    slug,
    category_slug: CATEGORY_SLUG,
    original_filename: group.canonical_filename,
    duplicate_filenames: group.duplicate_filenames,
    source_hash: sourceHash,
    source_size: sourceBuffer.length,
    mime: "application/pdf",
    processing_status: "PROCESSING",
    generated_at: new Date().toISOString(),
    page_count: 0,
    rendered_page_count: 0,
    failed_pages: [],
    cover: null,
    warnings: [],
    errors: [],
    assets: [],
  };

  try {
    const doc = await getDocument({
      data: new Uint8Array(sourceBuffer),
      disableWorker: true,
      isEvalSupported: false,
    }).promise;
    out.page_count = doc.numPages;

    const rendered = [];
    for (let number = 1; number <= doc.numPages; number++) {
      try {
        const page = await doc.getPage(number);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

        const full = canvas.toBuffer("image/webp", 86);
        const thumbCanvas = createCanvas(
          Math.max(1, Math.ceil(viewport.width * 0.28)),
          Math.max(1, Math.ceil(viewport.height * 0.28))
        );
        thumbCanvas.getContext("2d").drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        const thumb = thumbCanvas.toBuffer("image/webp", 76);

        const file = pageFile(number);
        await write(path.join(dir, "pages", file), full);
        await write(path.join(dir, "thumbnails", file), thumb);

        const asset = {
          page_number: number,
          media_type: "rendered-page",
          width: canvas.width,
          height: canvas.height,
          checksum: hash(full),
          detail: measureDetail(canvas),
          thumbnail: {
            path: `thumbnails/${file}`,
            checksum: hash(thumb),
            width: thumbCanvas.width,
            height: thumbCanvas.height,
          },
        };
        out.assets.push(asset);
        rendered.push(asset);
        out.rendered_page_count++;
      } catch (error) {
        out.failed_pages.push({ page_number: number, error: error.message });
        out.warnings.push(`Page ${number}: ${error.message}`);
      }
    }

    // Cover: strongest page re-cropped from the real PDF to a stable 1:1 square.
    const coverIndex = chooseCoverIndex(rendered);
    if (coverIndex >= 0) {
      const chosen = rendered[coverIndex];
      const decoded = await decodeImage(await fs.readFile(path.join(dir, "pages", pageFile(chosen.page_number))));
      const square = toCoverSquare(decoded);
      const coverBuffer = square.toBuffer("image/webp", 80);
      await write(path.join(dir, "cover.webp"), coverBuffer);
      out.cover = {
        path: "cover.webp",
        checksum: hash(coverBuffer),
        source_page: chosen.page_number,
        width: square.width,
        height: square.height,
      };
    }

    // Catalogue integrity: publish only when every declared page rendered.
    if (out.rendered_page_count === out.page_count && out.cover) out.processing_status = "PROCESSED";
    else if (out.rendered_page_count > 0) out.processing_status = "INCOMPLETE";
    else out.processing_status = "FAILED";
  } catch (error) {
    out.processing_status = "FAILED";
    out.errors.push(error.message);
  }

  await write(manifestPath, JSON.stringify(out, null, 2));
  return out;
}

/* ----------------------------------------------------------------- import */

/** Path-traversal / injection guard for every object key we write. */
function assertSafeStoragePath(value) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`UNSAFE STORAGE PATH: ${value}`);
  if (value.includes("..") || value.includes("\\") || value.startsWith("/")) {
    throw new Error(`UNSAFE STORAGE PATH: ${value}`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*\.[a-zA-Z0-9]+$/.test(value)) {
    throw new Error(`UNSAFE STORAGE PATH: ${value}`);
  }
  return value;
}

async function preflight(db) {
  if (!db) throw new Error("PREFLIGHT FAILED: server Supabase environment is unavailable");
  const categories = await db
    .from("categories")
    .select("id,country,source_filename,source_hash,page_count,parent_id")
    .limit(1);
  const media = await db
    .from("media")
    .select("id,media_type,page_number,checksum,is_published")
    .limit(1);
  if (categories.error) throw new Error(`PREFLIGHT FAILED categories: ${categories.error.message}`);
  if (media.error) throw new Error(`PREFLIGHT FAILED media: ${media.error.message}`);

  const buckets = await db.storage.listBuckets();
  if (buckets.error) throw new Error(`PREFLIGHT FAILED storage: ${buckets.error.message}`);
  if (!buckets.data.some((b) => b.id === BUCKET)) {
    throw new Error(`PREFLIGHT FAILED bucket: ${BUCKET} not found`);
  }

  const wallpaperGuard = await db
    .from("categories")
    .select("id", { count: "exact", head: true })
    .in("country", ["china", "korea"]);
  if (wallpaperGuard.error) {
    throw new Error(`PREFLIGHT FAILED wallpaper guard: ${wallpaperGuard.error.message}`);
  }
  console.log(`[preflight] wallpaper collections before import: ${wallpaperGuard.count}`);
  return { bucket: BUCKET };
}

async function uploadFile(db, buffer, storagePath) {
  const safe = assertSafeStoragePath(storagePath);
  const result = await db.storage.from(BUCKET).upload(safe, buffer, {
    contentType: "image/webp",
    upsert: true,
  });
  if (result.error) throw new Error(`UPLOAD ${safe}: ${result.error.message}`);
}

async function importCarpetTile(db, results) {
  // 1. Parent category — idempotent, never overwrites operator copy.
  const { data: existingParent, error: parentError } = await db
    .from("categories")
    .select("id,name,slug")
    .eq("slug", CATEGORY_SLUG)
    .maybeSingle();
  if (parentError) throw parentError;

  let parent = existingParent;
  if (!parent) {
    const insert = await db
      .from("categories")
      .insert({
        name: "Laminate Flooring",
        slug: CATEGORY_SLUG,
        description: "Laminate Flooring catalogue collections.",
        eyebrow: "Laminate Flooring",
        is_active: true,
        sort_order: 11,
      })
      .select("id")
      .single();
    if (insert.error) throw insert.error;
    parent = insert.data;
    console.log(`[import] created parent category ${CATEGORY_SLUG} ${parent.id}`);
  } else {
    console.log(`[import] reusing parent category ${CATEGORY_SLUG} ${parent.id}`);
  }

  const stats = { collections_created: 0, collections_reused: 0, pages_created: 0, pages_reused: 0, covers_upserted: 0, skipped_incomplete: 0 };

  for (const collection of results) {
    if (collection.processing_status !== "PROCESSED") {
      stats.skipped_incomplete++;
      console.error(`[import] SKIPPED (${collection.processing_status}) ${collection.collection_name}`);
      continue;
    }

    // Collection identity = source_hash. Never decided from the filename.
    // The slug is a mutable, URL-facing attribute, so it is deliberately NOT part of
    // the lookup: a naming change must update the row, never orphan it into a duplicate.
    const collectionSlug = COLLECTION_PREFIX + collection.slug;
    const { data: existing, error: lookupError } = await db
      .from("categories")
      .select("id")
      .eq("source_hash", collection.source_hash)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const row = {
      name: collection.collection_name,
      slug: collectionSlug,
      parent_id: parent.id,
      source_filename: collection.original_filename,
      source_hash: collection.source_hash,
      page_count: collection.page_count,
      // Local source paths are never published.
      source_pdf_path: null,
      is_active: true,
      sort_order: 0,
    };

    let category = existing;
    if (existing) {
      const update = await db.from("categories").update(row).eq("id", existing.id).select("id").single();
      if (update.error) throw update.error;
      stats.collections_reused++;
    } else {
      const insert = await db.from("categories").insert(row).select("id").single();
      if (insert.error) throw insert.error;
      category = insert.data;
      stats.collections_created++;
    }

    const base = `${CATEGORY_SLUG}/${collection.slug}`;

    for (const asset of collection.assets ?? []) {
      const file = pageFile(asset.page_number);
      const pagePath = assertSafeStoragePath(`${base}/pages/${file}`);
      const thumbPath = assertSafeStoragePath(`${base}/thumbnails/${file}`);
      const pageBuffer = await fs.readFile(path.join(WORK, collection.slug, "pages", file));
      const thumbBuffer = await fs.readFile(path.join(WORK, collection.slug, "thumbnails", file));
      await uploadFile(db, pageBuffer, pagePath);
      await uploadFile(db, thumbBuffer, thumbPath);

      const mediaRow = {
        file_name: file,
        storage_path: pagePath,
        bucket: BUCKET,
        mime_type: "image/webp",
        file_size: pageBuffer.length,
        alt_text: `${collection.collection_name} Laminate Flooring catalogue — page ${asset.page_number}`,
        entity_type: "category",
        entity_id: category.id,
        media_type: "rendered-page",
        page_number: asset.page_number,
        checksum: asset.checksum,
        width: asset.width,
        height: asset.height,
        caption: `Page ${asset.page_number}`,
        sort_order: asset.page_number,
        is_published: true,
      };

      // Page identity = collection_id + page_number.
      const { data: existingMedia } = await db
        .from("media")
        .select("id")
        .eq("entity_id", category.id)
        .eq("page_number", asset.page_number)
        .eq("media_type", "rendered-page")
        .maybeSingle();
      if (existingMedia) {
        const update = await db.from("media").update(mediaRow).eq("id", existingMedia.id);
        if (update.error) throw update.error;
        stats.pages_reused++;
      } else {
        const insert = await db.from("media").insert(mediaRow);
        if (insert.error) throw insert.error;
        stats.pages_created++;
      }
    }

    const coverPath = assertSafeStoragePath(`${base}/cover.webp`);
    const coverBuffer = await fs.readFile(path.join(WORK, collection.slug, "cover.webp"));
    await uploadFile(db, coverBuffer, coverPath);
    const coverRow = {
      file_name: "cover.webp",
      storage_path: coverPath,
      bucket: BUCKET,
      mime_type: "image/webp",
      file_size: coverBuffer.length,
      alt_text: `${collection.collection_name} Laminate Flooring catalogue cover`,
      entity_type: "category",
      entity_id: category.id,
      media_type: "cover",
      page_number: collection.cover.source_page,
      checksum: collection.cover.checksum,
      width: collection.cover.width,
      height: collection.cover.height,
      caption: "Collection cover",
      sort_order: 0,
      is_published: true,
    };
    const { data: coverMedia } = await db
      .from("media")
      .select("id")
      .eq("entity_id", category.id)
      .eq("media_type", "cover")
      .maybeSingle();
    if (coverMedia) {
      const update = await db.from("media").update(coverRow).eq("id", coverMedia.id);
      if (update.error) throw update.error;
    } else {
      const insert = await db.from("media").insert(coverRow);
      if (insert.error) throw insert.error;
    }
    stats.covers_upserted++;
  }

  return stats;
}

/* ------------------------------------------------------------------- main */

const env = await loadEnv();
const db =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

const audit = await auditSource();
await write(path.join(WORK, "laminate-flooring-source-audit.json"), JSON.stringify(audit, null, 2));
console.log(
  `SOURCE AUDIT files=${audit.totals.files} pdf=${audit.totals.pdf_files} non_pdf=${audit.totals.non_pdf_files} unique_pdfs=${audit.totals.unique_pdfs} duplicate_pdfs=${audit.totals.duplicate_pdfs}`
);
for (const group of audit.groups) {
  console.log(
    `  - ${group.canonical_filename} [${group.source_hash.slice(0, 12)}] duplicates=${group.duplicate_filenames.length ? group.duplicate_filenames.join(", ") : "none"}`
  );
}

if (audit.totals.pdf_files === 0) {
  console.error("NO PDF SOURCES FOUND - nothing to ingest.");
  process.exit(1);
}

if (AUDIT_ONLY) {
  // Read-only mode: report the groups and stop. Nothing is rendered or uploaded.
  console.log(JSON.stringify({ source_root: ROOT, totals: audit.totals }, null, 2));
  for (const group of audit.groups) {
    console.log(
      `  UNIQUE ${group.canonical_filename} slug=${slugify(displayName(group.canonical_filename))} hash=${group.source_hash.slice(0, 16)}`
    );
  }
  console.log(`AUDIT ONLY: ${audit.groups.length} unique collections, ${audit.totals.duplicate_pdfs} duplicate source files collapsed. Nothing rendered.`);
  process.exit(0);
}

const results = [];
for (const group of audit.groups) {
  try {
    const processed = await processCollection(group);
    results.push(processed);
    console.log(
      `PROCESSED ${processed.collection_name} slug=${processed.slug} status=${processed.processing_status} pages=${processed.rendered_page_count}/${processed.page_count} cover_page=${processed.cover?.source_page ?? "none"}${processed.resumed ? " (resumed)" : ""}`
    );
  } catch (error) {
    // Failure isolation: one bad PDF must never break the whole catalogue.
    console.error(`FAILED ${group.canonical_filename}: ${error.message}`);
    results.push({
      collection_name: baseName(group.canonical_filename),
      slug: slugify(displayName(group.canonical_filename)),
      original_filename: group.canonical_filename,
      source_hash: group.source_hash,
      processing_status: "FAILED",
      page_count: 0,
      rendered_page_count: 0,
      errors: [error.message],
      warnings: [],
      failed_pages: [],
      assets: [],
      cover: null,
    });
  }
}

const totals = {
  collections: results.length,
  processed: results.filter((r) => r.processing_status === "PROCESSED").length,
  incomplete: results.filter((r) => r.processing_status === "INCOMPLETE").length,
  failed: results.filter((r) => r.processing_status === "FAILED").length,
  page_count: results.reduce((n, r) => n + (r.page_count ?? 0), 0),
  rendered_page_count: results.reduce((n, r) => n + (r.rendered_page_count ?? 0), 0),
  covers: results.filter((r) => r.cover).length,
  duplicate_source_files: audit.totals.duplicate_pdfs,
};
const manifest = {
  generated_at: new Date().toISOString(),
  source_root: ROOT,
  renderer: "@napi-rs/canvas + pdfjs-dist",
  dpi: Number(process.env.LAMINATE_FLOORING_DPI ?? 144),
  bucket: BUCKET,
  audit_totals: audit.totals,
  totals,
  collections: results,
};
await write(path.join(WORK, "manifest.json"), JSON.stringify(manifest, null, 2));
await write(path.join(WORK, "laminate-flooring-ingestion-report.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(totals, null, 2));

if (APPLY) {
  try {
    const diagnostics = await preflight(db);
    console.log(JSON.stringify({ preflight: diagnostics }, null, 2));
    const stats = await importCarpetTile(db, results);
    console.log(JSON.stringify({ import: stats }, null, 2));
  } catch (error) {
    console.error(`IMPORT FAILED: ${error.message}`);
    process.exitCode = 2;
  }
} else {
  console.log(
    `DRY RUN: ${totals.collections} collections / ${totals.rendered_page_count} page derivatives / ${totals.covers} covers staged under ${WORK}.`
  );
  console.log("DRY RUN: Supabase was not contacted. No rows, buckets or objects were written.");
  console.log("Expected upload objects on apply:", totals.rendered_page_count + totals.covers);
  console.log("Expected DB records on apply:", totals.collections, "collections,", totals.rendered_page_count + totals.covers, "media rows.");
  void DRY_RUN;
}

