/**
 * scripts/sync-false-ceiling.mjs
 *
 * One-way sync: SOURCE FOLDER -> public/media/false-ceiling.
 * The Windows source folder is the single source truth and is NEVER modified.
 *
 *   1. read every frame/film in the source folder and hash it (md5)
 *   2. drop exact duplicate frames (first file in natural order wins)
 *   3. regenerate the webp derivative for every published source frame
 *   4. re-copy the film when the source film changed, refreshing its poster
 *   5. prune production assets whose source was deleted or renamed
 *   6. report source frames that are not published yet (editorial call)
 *   7. report production paths referenced by the code but missing on disk
 *
 *   node scripts/sync-false-ceiling.mjs           # report only
 *   node scripts/sync-false-ceiling.mjs --apply   # write derivatives + manifest
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const SOURCE_DIR = "C:\\Users\\DELL\\Pictures\\False ceiling";
const OUT_DIR = path.resolve("public/media/false-ceiling");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");
const EDITORIAL_PATH = path.resolve("lib/content/false-ceiling.ts");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);
const APPLY = process.argv.includes("--apply");

/** Natural (numeric-aware) order so "…42 AM (1)" sorts before "…42 AM (10)". */
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const md5 = (buffer) => crypto.createHash("md5").update(buffer).digest("hex");

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function listSource() {
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
    const buffer = await fs.readFile(path.join(SOURCE_DIR, entry.name));
    files.push({ name: entry.name, ext, buffer, hash: md5(buffer), size: buffer.length });
  }
  return files.sort((a, b) => natural(a.name, b.name));
}

/** Every /media/false-ceiling/... path the application code references. */
async function referencedPaths() {
  const code = await fs.readFile(EDITORIAL_PATH, "utf8");
  const found = [...code.matchAll(/["'`](\/media\/false-ceiling\/[^"'`]+)["'`]/g)].map((m) => m[1]);
  return [...new Set(found)].map((p) => p.replace("/media/false-ceiling/", ""));
}

async function dimensions(buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width ?? null, height: meta.height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

const sourceFiles = await listSource();
const manifest = await readJson(MANIFEST_PATH, { version: 1, published: [] });

/* Exact duplicate frames — first occurrence in natural order wins. */
const byHash = new Map();
const duplicates = [];
for (const file of sourceFiles) {
  if (byHash.has(file.hash)) {
    duplicates.push({ file: file.name, duplicateOf: byHash.get(file.hash).name });
  } else {
    byHash.set(file.hash, file);
  }
}

/* Resolve published manifest entries against the current source folder. */
const resolved = [];
const stalePublished = [];
for (const entry of manifest.published ?? []) {
  const source = sourceFiles.find((file) => file.name === entry.source);
  if (!source) {
    stalePublished.push(entry);
    continue;
  }
  const dim = await dimensions(source.buffer);
  resolved.push({
    id: entry.id,
    src: entry.src,
    source: source.name,
    sourceHash: source.hash,
    width: dim.width,
    height: dim.height,
    buffer: source.buffer,
  });
}

const covered = new Set(resolved.map((e) => e.source));
const filmEntry = manifest.film ?? null;
if (filmEntry) covered.add(filmEntry.source);
duplicates.forEach((d) => covered.add(d.file));
const unpublished = sourceFiles.filter((file) => !covered.has(file.name));

const onDisk = await fs.readdir(OUT_DIR).catch(() => []);
const referenced = await referencedPaths();
const codeMissing = referenced.filter((name) => !onDisk.includes(name));

const expected = new Set([...resolved.map((e) => e.src), "manifest.json"]);
if (filmEntry?.src) expected.add(filmEntry.src);
if (filmEntry?.poster) expected.add(filmEntry.poster);
referenced.forEach((name) => expected.add(name));
const orphans = onDisk.filter((name) => !expected.has(name));

/* Film freshness. */
const filmSource = filmEntry ? sourceFiles.find((f) => f.name === filmEntry.source) : null;
let filmStale = !filmSource;
if (filmSource && filmEntry?.src) {
  try {
    filmStale = md5(await fs.readFile(path.join(OUT_DIR, filmEntry.src))) !== filmSource.hash;
  } catch {
    filmStale = true;
  }
}

const statusOf = async (entry) => {
  if (!onDisk.includes(entry.src)) return "MISSING";
  try {
    const produced = await fs.readFile(path.join(OUT_DIR, entry.src));
    const rebuilt = await sharp(entry.buffer).webp({ quality: 82 }).toBuffer();
    return Buffer.compare(produced, rebuilt) === 0 ? "ok" : "STALE";
  } catch {
    return "STALE?";
  }
};

console.log(`SOURCE ${SOURCE_DIR}`);
console.log(
  `  images=${sourceFiles.filter((f) => IMAGE_EXT.has(f.ext)).length}` +
    ` videos=${sourceFiles.filter((f) => VIDEO_EXT.has(f.ext)).length}`
);

console.log(`\nEXACT DUPLICATES (${duplicates.length})`);
duplicates.forEach((d) => console.log(`  ${d.file}  ==  ${d.duplicateOf}`));

console.log(`\nPUBLISHED (${resolved.length})`);
for (const entry of resolved) {
  console.log(
    `  ${entry.id}  ${entry.src}  <-  ${entry.source}` +
      `  ${entry.width}x${entry.height}  [${await statusOf(entry)}]`
  );
}

if (stalePublished.length) {
  console.log(`\nSOURCE DELETED -> remove production reference (${stalePublished.length})`);
  stalePublished.forEach((e) => console.log(`  ${e.id}  src=${e.src}  source=${e.source}`));
}

console.log(`\nNOT PUBLISHED (${unpublished.length})`);
unpublished.forEach((u) => console.log(`  ${u.name}  md5=${u.hash}  ${u.size}b`));

console.log(`\nFILM ${filmEntry?.src ?? "(none)"} [${filmStale ? "STALE -> rebuild" : "ok"}]`);
console.log(`\nCODE REFERENCES MISSING ON DISK (${codeMissing.length})`);
codeMissing.forEach((name) => console.log(`  /media/false-ceiling/${name}`));
console.log(`\nORPHANS -> PRUNE (${orphans.length})`);
orphans.forEach((name) => console.log(`  ${name}`));

if (!APPLY) {
  console.log("\n(report only — re-run with --apply to write)");
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });

for (const entry of resolved) {
  const webp = await sharp(entry.buffer).webp({ quality: 82 }).toBuffer();
  await fs.writeFile(path.join(OUT_DIR, entry.src), webp);
  console.log(`WROTE ${entry.src}`);
}

if (filmSource && filmEntry?.src) {
  await fs.writeFile(path.join(OUT_DIR, filmEntry.src), filmSource.buffer);
  console.log(`WROTE ${filmEntry.src}`);
  if (filmEntry.poster && filmStale) {
    const result = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        path.join(SOURCE_DIR, filmSource.name),
        "-ss",
        "4",
        "-frames:v",
        "1",
        path.join(OUT_DIR, filmEntry.poster),
      ],
      { encoding: "utf8" }
    );
    console.log(
      result.status === 0 ? `WROTE ${filmEntry.poster}` : `POSTER SKIP: ${String(result.stderr).slice(-200)}`
    );
  }
}

for (const name of orphans) {
  await fs.rm(path.join(OUT_DIR, name), { force: true });
  console.log(`PRUNED ${name}`);
}

await fs.writeFile(
  MANIFEST_PATH,
  `${JSON.stringify(
    {
      version: 1,
      updatedAt: new Date().toISOString(),
      sourceFolder: SOURCE_DIR,
      counts: {
        sourceImages: sourceFiles.filter((f) => IMAGE_EXT.has(f.ext)).length,
        sourceVideos: sourceFiles.filter((f) => VIDEO_EXT.has(f.ext)).length,
        published: resolved.length,
      },
      published: resolved.map((e) => ({
        id: e.id,
        src: e.src,
        source: e.source,
        sourceMd5: e.sourceHash,
        width: e.width,
        height: e.height,
      })),
      removed: stalePublished.map((e) => ({ id: e.id, source: e.source, reason: "source deleted" })),
      film: filmEntry ? { ...filmEntry, sourceMd5: filmSource ? filmSource.hash : null } : null,
      duplicates,
      unpublished: unpublished.map((u) => u.file),
      exclusions: manifest.exclusions ?? [],
    },
    null,
    2
  )}\n`
);
console.log("WROTE manifest.json");

