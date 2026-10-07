/**
 * scripts/_inspect_rendered.mjs
 * Dumps the parts of the rendered HTML that prove the False Ceiling catalog
 * surface is real: the rail card in /materials, and the collection page's
 * product section, pricing treatment and collection media.
 */

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3000";

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/</g, "\n<");
}

async function section(label, path, patterns) {
  const res = await fetch(`${BASE}${path}`);
  const html = await res.text();
  console.log(`\n################ ${label}  (${path}) -> ${res.status} ################`);

  for (const { name, re, max = 6 } of patterns) {
    const found = [...html.matchAll(re)].slice(0, max).map((m) => m[0].trim());
    console.log(`\n--- ${name} (${found.length}) ---`);
    found.forEach((f) => console.log("  " + f.replace(/\s+/g, " ").slice(0, 300)));
    if (found.length === 0) console.log("  (none)");
  }
}

await section("MATERIALS RAIL", "/materials", [
  { name: "false-ceiling card links", re: /href="\/materials\/false-ceiling"/g },
  { name: "card images under /media/false-ceiling", re: /src="[^"]*\/media\/false-ceiling\/[^"]+"/g },
  { name: "card images under /media/products", re: /src="[^"]*\/media\/products\/[^"]+"/g, max: 4 },
  { name: "all collection links", re: /href="\/materials\/[a-z0-9-]+"/g, max: 20 },
]);

await section("FALSE CEILING COLLECTION", "/materials/false-ceiling", [
  { name: "h1", re: /<h1[^>]*>[\s\S]{0,120}?<\/h1>/g, max: 2 },
  { name: "eyebrows", re: /class="eyebrow"[^>]*>[\s\S]{0,90}?<\/p>/g, max: 10 },
  { name: "product collection heading", re: /Product collection[\s\S]{0,80}/gi, max: 3 },
  { name: "empty-state text", re: /Products will appear here[^<]*/g, max: 2 },
  { name: "pricing strings", re: /PRICE ON CONSULTATION|PKR[\s\S]{0,20}/g, max: 8 },
  { name: "false ceiling media", re: /\/media\/false-ceiling\/[a-z0-9-]+\.(webp|mp4)/g, max: 20 },
  { name: "view product CTAs", re: /View product/gi, max: 5 },
]);

await section("A FLOORING COLLECTION (consistency)", "/materials/vinyl-flooring", [
  { name: "h1", re: /<h1[^>]*>[\s\S]{0,110}?<\/h1>/g, max: 2 },
  { name: "product names", re: /<h3[^>]*>[\s\S]{0,80}?<\/h3>/g, max: 8 },
  { name: "pricing strings", re: /PRICE ON CONSULTATION|PKR[\s\S]{0,20}/g, max: 6 },
  { name: "product images", re: /\/media\/products\/vinyl-flooring\/[a-z0-9-]+\.jpeg/g, max: 4 },
]);

await section("OUR WORK (pricing firewall)", "/our-work", [
  { name: "any PKR", re: /PKR/g, max: 3 },
  { name: "any price word", re: /price|rate\b|per sq/gi, max: 4 },
]);
