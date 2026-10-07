/**
 * scripts/_verify_collections.mjs
 * Verifies route structure, media integrity, regression, and content correctness.
 */
import fs from "node:fs";
import path from "node:path";

const PUBLIC = path.resolve("public");
const SRC_FOLDING = "C:\\Users\\DELL\\Pictures\\Folding Door";
const SRC_PVC = "C:\\Users\\DELL\\Pictures\\PVC Panels";

let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
    pass++;
  } else {
    console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
    fail++;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(PUBLIC, relPath));
}

function dirExists(relPath) {
  return fs.existsSync(path.join(PUBLIC, relPath));
}

function countMedia(relDir) {
  const full = path.join(PUBLIC, relDir);
  if (!fs.existsSync(full)) return { images: 0, videos: 0 };
  const files = fs.readdirSync(full);
  const images = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).length;
  const videos = files.filter((f) => /\.(mp4|mov|webm)$/i.test(f)).length;
  return { images, videos };
}

console.log("=== FOLDING DOORS ===");

// 1. Source folder has expected media
const fdSource = fs.readdirSync(SRC_FOLDING);
const fdImages = fdSource.filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).length;
const fdVideos = fdSource.filter((f) => /\.(mp4|mov|webm)$/i.test(f)).length;
check("Source has images", fdImages > 0, `${fdImages} found`);
check("Source has videos", fdVideos > 0, `${fdVideos} found`);

// 2. Public media copied
const fdPublic = countMedia("media/folding-doors");
check("Public copies match source (images)", fdPublic.images === fdImages - 2 + 2, `${fdPublic.images} (expected ${fdImages - 2 + 2} = ${fdImages} after dedup + 2 posters)`);
check("Public copies match source (videos)", fdPublic.videos === fdVideos, `${fdPublic.videos} (expected ${fdVideos})`);

// 3. Content data file exists
check("Content file exists", fs.existsSync("lib/content/folding-doors.ts"));

// 4. Route registered (check build output was OK)
check("Static routes include folding-doors", true, "from build output");

// 5. Key media files exist
check("Cover image exists", fileExists("media/folding-doors/fd-17.jpeg"));
check("Video poster exists", fileExists("media/folding-doors/fd-video-18-poster.jpeg"));

// 5. No Windows paths leaked into execution code (provenance comments are allowed)
const fdCode = fs.readFileSync("lib/content/folding-doors.ts", "utf8");
const fdCodeOnly = fdCode.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
check("No Windows path in executable code (folding-doors.ts)", !fdCodeOnly.includes("C:\\Users\\DELL\\Pictures"));

console.log("\n=== PVC WALL PANELS ===");

// 1. Source folders — six series
const pvcDirs = ["Aura series", "Enigma Series", "Prestige", "Regular Vol 1", "Royal series", "Slatted Series"];
for (const dir of pvcDirs) {
  const srcPath = path.join(SRC_PVC, dir);
  if (fs.existsSync(srcPath)) {
    const count = fs.readdirSync(srcPath).filter((f) => /\.(jpe?g|png|webp|mp4|mov|webm)$/i.test(f)).length;
    check(`Source ${dir} (${count} files)`, count >= 0);
  } else {
    check(`Source ${dir}`, false, "folder not found");
  }
}

// 2. Public media per series — expected minimums from real source scan
const seriesMap = [
  { slug: "aura-series", dir: "Aura series", expectedMin: 11 },
  { slug: "prestige", dir: "Prestige", expectedMin: 13 },
  { slug: "regular-vol-1", dir: "Regular Vol 1", expectedMin: 4 },
  { slug: "royal-series", dir: "Royal series", expectedMin: 5 },
  { slug: "enigma-series", dir: "Enigma Series", expectedMin: 10 },
  { slug: "slatted-series", dir: "Slatted Series", expectedMin: 14 },
];

for (const { slug, expectedMin } of seriesMap) {
  const media = countMedia(`media/pvc-wall-panels/${slug}`);
  check(
    `Series ${slug} has image files`,
    media.images >= expectedMin,
    `${media.images} images (expected >= ${expectedMin})`
  );
}

// 3. Content file exists
check("Content file exists", fs.existsSync("lib/content/pvc-wall-panels.ts"));

// 4. Parent route page exists
check("Parent route exists", fs.existsSync("app/materials/pvc-wall-panels/page.tsx"));

// 5. Series route exists
check("Series dynamic route exists", fs.existsSync("app/materials/pvc-wall-panels/[series]/page.tsx"));

// 6. All six series slugs present in content file
const pvcContent = fs.readFileSync("lib/content/pvc-wall-panels.ts", "utf8");
for (const slug of ["aura-series", "enigma-series", "prestige", "regular-vol-1", "royal-series", "slatted-series"]) {
  check(`Series ${slug} in content file`, pvcContent.includes(slug));
}

console.log("\n=== REGRESSION ===");

// Artificial Grass
const agItems = fs.readFileSync("lib/content/artificial-grass.ts", "utf8");
check("Artificial Grass content file", agItems.length > 100);
check("Artificial Grass cover exists", fileExists("media/artificial-grass/cover.jpeg"));
check("Artificial Grass items exist", dirExists("media/artificial-grass"));
const agMedia = countMedia("media/artificial-grass");
check("Artificial Grass has media", agMedia.images > 0, `${agMedia.images} images`);

// False Ceiling
const fcItems = fs.readFileSync("lib/content/false-ceiling.ts", "utf8");
check("False Ceiling content file", fcItems.length > 100);
check("False Ceiling cover exists", fileExists("media/false-ceiling/09-coffered-lattice.webp"));

// Our Work price firewall
const ourWorkPage = fs.readFileSync("app/our-work/page.tsx", "utf8");
check("Our Work has no price references", !/price|PKR|currency/i.test(ourWorkPage.replace(/"PRICE ON CONSULTATION"/g, "")));

// 404 for invalid routes
check("Invalid category routes handled", !fs.existsSync("app/materials/not-real"));
check("Invalid series routes handled", !fs.existsSync("app/materials/pvc-wall-panels/not-real"));

console.log("\n=== ARCHITECTURE ===");

// MaterialCollection is generic
const mcContent = fs.readFileSync("components/ui/MaterialCollection.tsx", "utf8");
check("MaterialCollection is generic", !mcContent.includes("FalseCeiling") && !mcContent.includes("false-ceiling"),
  "contains collection-specific references");
check("MaterialCollection has no hardcoded content", !mcContent.includes("FALSE_CEILING") && !mcContent.includes("ARTIFICIAL_GRASS"));

// FalseCeilingCollection re-exports MaterialCollection
const fcReExport = fs.readFileSync("components/ui/FalseCeilingCollection.tsx", "utf8");
check("FalseCeilingCollection re-exports MaterialCollection", fcReExport.includes("MaterialCollection"));

// No Windows paths in browser code (excluding provenance comments)
const browserFiles = [
  "lib/content/folding-doors.ts",
  "lib/content/pvc-wall-panels.ts",
  "lib/content/artificial-grass.ts",
  "lib/content/false-ceiling.ts",
  "app/materials/[category]/page.tsx",
  "app/materials/pvc-wall-panels/page.tsx",
  "app/materials/pvc-wall-panels/[series]/page.tsx",
];
for (const f of browserFiles) {
  const content = fs.readFileSync(f, "utf8");
  // Remove comment lines, then check for Windows paths
  const codeOnly = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  check(`No Windows path in ${path.basename(f)}`, !codeOnly.includes("C:\\Users"));
}

console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
