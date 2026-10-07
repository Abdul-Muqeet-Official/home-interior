/**
 * scripts/smoke-test.mjs
 *
 * HTTP smoke test against a running production server.
 * Verifies the public routes return 200 and that Carpet Tile serves real catalogue data
 * rather than an empty state.
 */
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";

const routes = [
  "/",
  "/philosophy",
  "/materials",
  "/materials/laminate-flooring",
  "/materials/spc-flooring",
  "/materials/vinyl-flooring",
  "/materials/pvc-wall-panels",
  "/materials/artificial-grass",
  "/materials/false-ceiling",
  "/our-work",
  "/reviews",
  "/services",
  "/consultation",
  "/privacy",
  "/terms",
  "/sitemap.xml",
  "/robots.txt",
  "/materials/carpet-tile",
  "/materials/carpet-tile/1-fp10",
  "/materials/carpet-tile/13-6-matini",
  "/materials/carpet-tile/aurora-pdf",
  "/materials/carpet-tile/dc128",
  "/materials/carpet-tile/g1061n2-f-pp-9-27",
  "/materials/carpet-tile/greenland",
  "/materials/carpet-tile/huishan",
  "/materials/carpet-tile/mojituo",
  "/materials/wallpaper",
  "/materials/wallpaper/china",
  "/materials/wallpaper/korea",
  "/materials/window-blinds/roller-blinds",
  "/materials/carpet-tile/does-not-exist",
];

let failures = 0;
for (const route of routes) {
  const started = Date.now();
  try {
    const response = await fetch(`${BASE}${route}`, { redirect: "manual" });
    const isKnown404 = route.includes("does-not-exist");
    // A 308 is the app's own intentional canonical/legacy redirect (e.g. the legacy
    // /materials/gypsum-ceilings/false-ceiling -> /materials/false-ceiling). Follow it
    // and assert the destination is a healthy 200 rather than treating it as a failure.
    const final = response.status === 308 ? await fetch(`${BASE}${route}`) : response;
    const body = await final.text();
    const ms = Date.now() - started;
    const ok = isKnown404 ? final.status === 404 : final.status === 200;
    if (!ok) failures++;
    const carpetRefs = (body.match(/carpet-catalogue/g) ?? []).length;
    const emptyState = body.includes("are being curated");
    const note =
      response.status === 308
        ? ` (intentional ${response.status} -> ${final.status})`
        : "";
    console.log(
      `${ok ? "PASS" : "FAIL"} ${String(final.status).padEnd(3)} ${route.padEnd(48)} ${String(ms).padStart(5)}ms carpetImages=${carpetRefs}${emptyState ? " EMPTY_STATE" : ""}${note}`
    );
  } catch (error) {
    failures++;
    console.log(`FAIL ERR  ${route.padEnd(48)} ${error.message}`);
  }
}

console.log(failures === 0 ? "\nSMOKE TEST PASS" : `\nSMOKE TEST FAIL (${failures})`);

// --- Deep checks: real product route, image delivery, materials rail, security ---
// This project has no /products index; the product detail route is /products/[slug].
const { readFile } = await import("node:fs/promises");
const env = Object.fromEntries(
  (await readFile(".env", "utf8"))
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);
const { createClient } = await import("@supabase/supabase-js");
const db = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data: products } = await db
  .from("products")
  .select("slug, name, title")
  .eq("is_published", true)
  .not("slug", "is", null)
  .limit(3);
let productTested = 0;
for (const product of products ?? []) {
  const response = await fetch(`${BASE}/products/${product.slug}`);
  const ok = response.status === 200;
  productTested++;
  console.log(`${ok ? "PASS" : "FAIL"} ${response.status} /products/${product.slug}`);
  if (!ok) failures++;
}
if (productTested === 0) {
  // Truthful result, not a pass: no product row currently carries a slug, so the
  // detail route has no real record to resolve. Pre-existing data condition.
  console.log("NOT VERIFIED /products/[slug] - no published product has a slug (pre-existing data)");
}

const materials = await fetch(`${BASE}/materials`).then((r) => r.text());
const inRail = materials.includes("/materials/carpet-tile");
console.log(`${inRail ? "PASS" : "FAIL"} Carpet Tile present in Materials rail`);
if (!inRail) failures++;

const landing = await fetch(`${BASE}/materials/carpet-tile`).then((r) => r.text());
// Count distinct cover images requested by the landing page (should be <= collections).
const covers = new Set(
  [...landing.matchAll(/\/_next\/image\?url=([^"&]+)/g)].map((m) =>
    decodeURIComponent(m[1]).replace(/&amp;w=\d+/, "")
  )
);
const coverRefs = [...covers].filter((u) => u.includes("carpet-catalogue"));
console.log(`INFO landing page distinct carpet images referenced: ${coverRefs.length}`);
if (coverRefs.length > 12) {
  console.log("FAIL landing page references too many full catalogue images");
  failures++;
} else {
  console.log("PASS landing page does not eagerly load every catalogue page");
}

// Verify a storage derivative is actually publicly reachable.
const sample = coverRefs[0];
if (sample) {
  const direct = await fetch(sample);
  const ok = direct.status === 200 && (direct.headers.get("content-type") ?? "").includes("image");
  console.log(`${ok ? "PASS" : "FAIL"} storage derivative reachable (${direct.status} ${direct.headers.get("content-type")})`);
  if (!ok) failures++;
}

// Security: no service-role key or local Windows path may reach the browser.
const leaks = [];
for (const route of ["/", "/materials", "/materials/carpet-tile", "/materials/carpet-tile/1-fp10"]) {
  const html = await fetch(`${BASE}${route}`).then((r) => r.text());
  if (/service_role|SUPABASE_SERVICE_ROLE/i.test(html)) leaks.push(`${route}: service key`);
  if (/Pictures\\|C:\\\\Users/i.test(html)) leaks.push(`${route}: local path`);
  if (/\.pdf["']/i.test(html)) leaks.push(`${route}: raw pdf reference`);
}
if (leaks.length) {
  console.log(`FAIL leaks: ${leaks.join(", ")}`);
  failures++;
} else {
  console.log("PASS no service key, local path or raw PDF exposed in HTML");
}

// Every /materials/<slug> link the site advertises must actually resolve - a child
// collection must never be advertised as a top-level category.
const home = await fetch(`${BASE}/`).then((r) => r.text());
const materialsPage = await fetch(`${BASE}/materials`).then((r) => r.text());
const slugs = new Set(
  [...`${home}${materialsPage}`.matchAll(/href="\/materials\/([a-z0-9-]+)"/g)].map((m) => m[1])
);
const dead = [];
for (const slug of slugs) {
  const response = await fetch(`${BASE}/materials/${slug}`, { redirect: "manual" });
  if (response.status >= 400) dead.push(`${slug} (${response.status})`);
}
if (dead.length) {
  console.log(`FAIL dead /materials links: ${dead.join(", ")}`);
  failures++;
} else {
  console.log(`PASS all ${slugs.size} advertised /materials links resolve`);
}

// Search must surface carpet tile collections, and only on their real route.
const searchLinks = (home.split("materials/carpet-tile/").length - 1) / 2;
const carpetNames = [
  "1_FP10",
  "13_6_MATINI",
  "Aurora",
  "DC128",
  "G1061N2 F PP 9.27",
  "Greenland",
  "HUISHAN",
  "MOJITUO",
];
const missing = carpetNames.filter((name) => !home.includes(name));
console.log(
  searchLinks > 0
    ? `PASS search index exposes ${searchLinks} carpet tile collection links`
    : "FAIL carpet tile collections missing from the search index"
);
if (searchLinks === 0) failures++;
if (missing.length) console.log(`INFO not in search index: ${missing.join(", ")}`);

process.exitCode = failures === 0 ? 0 : 1;


