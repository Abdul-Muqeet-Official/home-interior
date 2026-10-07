/**
 * scripts/crosscheck-catalogue.mjs
 *
 * Independent completeness audit: compares the names rendered in the
 * "All Collections" grid (dumped by browser-completeness.mjs) against the live
 * published database rows, in both directions.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: cats } = await db.from("categories").select("name").eq("is_active", true);
const { data: prods } = await db
  .from("products")
  .select("name, title, slug")
  .eq("is_published", true);

const dbNames = (cats ?? []).map((c) => (c.name ?? "").trim()).filter(Boolean);
const renderable = (prods ?? []).filter(
  (p) => p.slug && ((p.name ?? "").trim() || (p.title ?? "").trim()),
);
const skipped = (prods ?? []).filter(
  (p) => !(p.slug && ((p.name ?? "").trim() || (p.title ?? "").trim())),
);

const expected = [...dbNames, ...renderable.map((p) => (p.name ?? p.title ?? "").trim())];
const rendered = JSON.parse(fs.readFileSync("rendered.json", "utf8"));

console.log("DB active categories        :", dbNames.length);
console.log("DB renderable products      :", renderable.length);
console.log("EXPECTED total in grid      :", expected.length);
console.log("RENDERED in grid            :", rendered.length);
console.log("EXACT MATCH                 :", expected.length === rendered.length);

const renderedSet = new Set(rendered);
const missing = expected.filter((n) => !renderedSet.has(n));
const extra = rendered.filter((n) => expected.indexOf(n) === -1);
console.log("Missing from grid           :", missing.length, JSON.stringify(missing.slice(0, 8)));
console.log("Extra in grid (not in DB)   :", extra.length, JSON.stringify(extra.slice(0, 8)));

console.log("\nSkipped products (no public route, cannot be linked):");
for (const p of skipped) {
  console.log(`  name=${p.name} title=${p.title} slug=${p.slug}`);
}
if (skipped.length === 0) console.log("  none");

console.log("\nPreviously-dropped root categories now in the grid:");
for (const name of ["PVC Wall Panels", "3D Wall Picture", "SPC Flooring", "Vinyl Flooring"]) {
  console.log(`  ${renderedSet.has(name) ? "PRESENT" : "MISSING"}  ${name}`);
}

const ok = expected.length === rendered.length && missing.length === 0 && extra.length === 0;
console.log(`\n${ok ? "PASS - grid matches the published catalogue exactly" : "FAIL - mismatch"}`);
process.exit(ok ? 0 : 1);