import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const source = "C:\\Users\\DELL\\Pictures\\OUR WORK SHOWCASE";
const destination = path.resolve("public/media/work-showcase");
const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".mp4", ".webm"]);
const apply = process.argv.includes("--apply");

const slugify = (value) => value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const hashFile = async (filePath) => createHash("sha256").update(await fs.readFile(filePath)).digest("hex");

const entries = (await fs.readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && supported.has(path.extname(entry.name).toLowerCase()))
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

const seen = new Set();
const inventory = [];
for (const [index, entry] of entries.entries()) {
  const sourcePath = path.join(source, entry.name);
  const hash = await hashFile(sourcePath);
  if (seen.has(hash)) {
    inventory.push({ file: entry.name, status: "duplicate", hash });
    continue;
  }
  seen.add(hash);
  const extension = path.extname(entry.name).toLowerCase();
  const output = `${String(inventory.filter((item) => item.status === "ready").length + 1).padStart(2, "0")}-${slugify(entry.name)}${extension}`;
  inventory.push({ file: entry.name, status: "ready", hash, output, type: extension === ".jpeg" || extension === ".jpg" || extension === ".png" || extension === ".webp" || extension === ".avif" ? "image" : "video" });
  if (apply) {
    await fs.mkdir(destination, { recursive: true });
    await fs.copyFile(sourcePath, path.join(destination, output));
  }
}

console.table(inventory.map(({ file, status, type, output }) => ({ file, status, type: type ?? "", output: output ?? "" })));
console.log(`INSPECTED=${entries.length} READY=${inventory.filter((item) => item.status === "ready").length} DUPLICATES=${inventory.filter((item) => item.status === "duplicate").length}`);
console.log(apply ? `COPIED_TO=${destination}` : "DRY_RUN=true; rerun with --apply to copy validated media");
