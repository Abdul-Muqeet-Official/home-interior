import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PICTURES = process.env.CATALOGUE_SOURCE_ROOT ?? "C:\\Users\\DELL\\Pictures";
const WORK = path.resolve(process.env.CATALOGUE_WORK ?? ".catalogue-work/sources");
const SOURCES = {
  "folding-door": "Folding Door",
  "roller-blinds": "Roller blinds",
  "pvc-panels": "PVC Panels",
  "artificial-grass": "Artificial grass",
  "false-ceiling": "False ceiling",
};
const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"]);
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const slug = (value) => value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const reports = [];
for (const [collection, directoryName] of Object.entries(SOURCES)) {
  const root = path.join(PICTURES, directoryName);
  const files = [];
  let sourceError = null;
  try {
    const walk = async (current) => {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) { await walk(fullPath); continue; }
        if (!entry.isFile() || !supported.has(path.extname(entry.name).toLowerCase())) continue;
        const buffer = await fs.readFile(fullPath);
        files.push({ filename: path.relative(root, fullPath), extension: path.extname(entry.name).toLowerCase(), bytes: buffer.length, sha256: sha256(buffer), storage_path: `${collection}/${slug(path.relative(path.dirname(root), fullPath)).replace(/\.[^.]+$/, "")}` });
      }
    };
    await walk(root);
  } catch (error) { sourceError = error.message; }
  files.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
  const duplicates = files.filter((item, index) => files.findIndex((candidate) => candidate.sha256 === item.sha256) !== index);
  reports.push({ collection, source_root: root, generated_at: new Date().toISOString(), status: sourceError ? "FAILED" : "SUCCESS", error: sourceError, files, totals: { files: files.length, images: files.filter((f) => [".jpg", ".jpeg", ".png", ".webp"].includes(f.extension)).length, videos: files.filter((f) => [".mp4", ".mov", ".webm"].includes(f.extension)).length, duplicate_files: duplicates.length } });
}
await fs.mkdir(WORK, { recursive: true });
await fs.writeFile(path.join(WORK, "catalogue-source-inventory.json"), JSON.stringify({ generated_at: new Date().toISOString(), source_root: PICTURES, reports }, null, 2));
for (const report of reports) console.log(`${report.collection}: files=${report.totals.files} images=${report.totals.images} videos=${report.totals.videos} duplicates=${report.totals.duplicate_files} status=${report.status}`);
console.log(`REPORT ${path.join(WORK, "catalogue-source-inventory.json")}`);
