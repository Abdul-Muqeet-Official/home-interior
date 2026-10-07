/**
 * scripts/test-image-src.mjs
 *
 * Unit checks for the canonical image-path sanitiser, including the exact
 * string from the reported next/image crash.
 *
 * Run with:  node --experimental-strip-types scripts/test-image-src.mjs
 */
import {
  ensureAbsoluteImagePath,
  isSafeImageSrc,
  DEFAULT_MEDIA_BUCKET,
} from "../lib/content/image-src.ts";

const BASE = "https://oqfxtdcbpcjoxmnxbpte.supabase.co";
const options = { baseUrl: BASE };

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`      expected: ${expected}\n      actual:   ${actual}`);
}

// The exact value from the production crash report.
check(
  "reported crash path expands to a real storage URL",
  ensureAbsoluteImagePath("materials/folding-doors/folding-doors-systems/f24bcbe4c69bec47.jpeg", options),
  `${BASE}/storage/v1/object/public/${DEFAULT_MEDIA_BUCKET}/materials/folding-doors/folding-doors-systems/f24bcbe4c69bec47.jpeg`,
);

check("covers/ path expands", ensureAbsoluteImagePath("covers/pvc-wall-panels-0060a64a.jpg", options),
  `${BASE}/storage/v1/object/public/${DEFAULT_MEDIA_BUCKET}/covers/pvc-wall-panels-0060a64a.jpg`);

check("absolute https passes through", ensureAbsoluteImagePath(`${BASE}/storage/v1/object/public/site-assets/covers/x.jpg`, options),
  `${BASE}/storage/v1/object/public/site-assets/covers/x.jpg`);

check("site-relative path unchanged", ensureAbsoluteImagePath("/media/photos/hero-01.jpg", options), "/media/photos/hero-01.jpg");
check("protocol-relative upgraded to https", ensureAbsoluteImagePath("//cdn.example.com/a.jpg", options), "https://cdn.example.com/a.jpg");
check("custom bucket honoured", ensureAbsoluteImagePath("china/cover.webp", { ...options, bucket: "wallpaper-catalogue" }),
  `${BASE}/storage/v1/object/public/wallpaper-catalogue/china/cover.webp`);
check("leading ./ stripped", ensureAbsoluteImagePath("./covers/a.jpg", options), `${BASE}/storage/v1/object/public/${DEFAULT_MEDIA_BUCKET}/covers/a.jpg`);
check("whitespace trimmed", ensureAbsoluteImagePath("  covers/a.jpg  ", options), `${BASE}/storage/v1/object/public/${DEFAULT_MEDIA_BUCKET}/covers/a.jpg`);

check("javascript: rejected", ensureAbsoluteImagePath("javascript:alert(1)", options), "");
check("data: rejected", ensureAbsoluteImagePath("data:image/png;base64,AAAA", options), "");
check("file: rejected", ensureAbsoluteImagePath("file:///etc/passwd", options), "");
check("vbscript: rejected", ensureAbsoluteImagePath("vbscript:msgbox", options), "");
check("null rejected", ensureAbsoluteImagePath(null, options), "");
check("undefined rejected", ensureAbsoluteImagePath(undefined, options), "");
check("empty rejected", ensureAbsoluteImagePath("   ", options), "");
check("non-string rejected", ensureAbsoluteImagePath(42, options), "");
check("fallback honoured on rejection",
  ensureAbsoluteImagePath("javascript:alert(1)", { ...options, fallback: "/media/texture-plaster.svg" }),
  "/media/texture-plaster.svg");
check("no base url -> fallback rather than broken src",
  ensureAbsoluteImagePath("covers/a.jpg", { baseUrl: "", fallback: "/media/x.svg" }), "/media/x.svg");

check("isSafe absolute", isSafeImageSrc("https://x.supabase.co/a.jpg"), true);
check("isSafe root-relative", isSafeImageSrc("/a.jpg"), true);
check("isSafe rejects bare path", isSafeImageSrc("a/b.jpg"), false);
check("isSafe rejects javascript:", isSafeImageSrc("javascript:alert(1)"), false);

// Every relative shape currently stored in categories.image_path.
const realDbPaths = [
  "materials/window-blinds/roller-blinds-series/fa350ff0be4e0380.jpeg",
  "materials/artificial-grass/artificial-grass-installations/6a8b6247a6cb9c83.jpeg",
  "materials/folding-doors/folding-doors-systems/f24bcbe4c69bec47.jpeg",
  "materials/false-ceiling/false-ceiling-projects/1d4d6c504530a506.jpeg",
  "covers/pvc-wall-panels-0060a64a.jpg",
  "covers/3d-wall-picture-6f5247e6.jpg",
  "covers/carpet-tile-86709f94.jpg",
  "covers/laminate-flooring-02210848.jpg",
  "covers/spc-flooring-3507f990.jpg",
  "covers/vinyl-flooring-7d5a55ae.webp",
  "covers/wallpaper-d4a87d6d.jpg",
];
console.log("\nAll real DB storage paths:");
for (const p of realDbPaths) {
  const out = ensureAbsoluteImagePath(p, options);
  const ok = out.startsWith("https://") && !isSafeImageSrc(p);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${p} -> ${out.replace(BASE, "<base>")}`);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);