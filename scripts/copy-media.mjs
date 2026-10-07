/**
 * scripts/copy-media.mjs
 * One-time copy of source media to production public/media/ folders.
 * Detects duplicates by MD5, copies unique files with deterministic names.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.resolve("public/media");

const FOLDING_SRC = "C:\\Users\\DELL\\Pictures\\Folding Door";
const PVC_SRC = "C:\\Users\\DELL\\Pictures\\PVC Panels";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);

async function processFolder(srcDir, outDir, prefix) {
  if (!fs.existsSync(srcDir)) {
    return { unique: [], duplicates: [], exists: false };
  }
  const files = fs.readdirSync(srcDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext);
  });

  const byHash = new Map();
  const duplicates = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(srcDir, f));
    const hash = crypto.createHash("md5").update(buf).digest("hex");
    if (byHash.has(hash)) {
      duplicates.push({ file: f, duplicateOf: byHash.get(hash).name });
    } else {
      byHash.set(hash, { name: f, buffer: buf, ext: path.extname(f).toLowerCase() });
    }
  }

  const unique = Array.from(byHash.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );

  fs.mkdirSync(outDir, { recursive: true });

  const result = [];
  for (let i = 0; i < unique.length; i++) {
    const item = unique[i];
    const ext = item.ext;
    const isVideo = VIDEO_EXT.has(ext);
    const outName = isVideo
      ? `${prefix}-video-${String(i + 1).padStart(2, "0")}${ext}`
      : `${prefix}-${String(i + 1).padStart(2, "0")}${ext}`;
    const outPath = path.join(outDir, outName);
    fs.copyFileSync(path.join(srcDir, item.name), outPath);

    let dims = null;
    if (!isVideo) {
      try {
        const meta = await sharp(item.buffer).metadata();
        dims = { width: meta.width ?? null, height: meta.height ?? null };
      } catch (e) {}
    }

    result.push({
      original: item.name,
      output: outName,
      outputPath: outPath.replace(/\\/g, "/").replace(OUT_DIR, "/media").replace(/\\/g, "/"),
      size: item.buffer.length,
      hash: crypto.createHash("md5").update(item.buffer).digest("hex"),
      isVideo,
      ...dims,
    });
  }

  return { unique: result, duplicates, exists: true };
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  // Folding Doors
  const fdResult = await processFolder(FOLDING_SRC, path.join(OUT_DIR, "folding-doors"), "fd");
  console.log("=== FOLDING DOORS ===");
  console.log("Exists:", fdResult.exists);
  if (fdResult.exists) {
    console.log("Unique files:", fdResult.unique.length);
    console.log("Duplicates removed:", fdResult.duplicates.length);
    fdResult.duplicates.forEach((d) => console.log("  DUP:", d.file, "==", d.duplicateOf));
    fdResult.unique.forEach((f) =>
      console.log("  ", f.output, f.width + "x" + f.height, f.isVideo ? "(video)" : "", "|", f.original)
    );
  }

  // PVC Panels - each series subfolder
  const pvcSubdirs = fs.readdirSync(PVC_SRC, { withFileTypes: true });
  for (const entry of pvcSubdirs.filter((d) => d.isDirectory())) {
    const slug = slugify(entry.name);
    const result = await processFolder(
      path.join(PVC_SRC, entry.name),
      path.join(OUT_DIR, "pvc-wall-panels", slug),
      "pvc"
    );
    console.log(`=== PVC: ${entry.name} (${slug}) ===`);
    console.log("Exists:", result.exists);
    if (result.exists) {
      console.log("Unique files:", result.unique.length);
      console.log("Duplicates removed:", result.duplicates.length);
      result.duplicates.forEach((d) => console.log("  DUP:", d.file, "==", d.duplicateOf));
      result.unique.forEach((f) =>
        console.log("  ", f.output, f.width + "x" + f.height, f.isVideo ? "(video)" : "", "|", f.original)
      );
    }
  }
}

main().catch(console.error);
