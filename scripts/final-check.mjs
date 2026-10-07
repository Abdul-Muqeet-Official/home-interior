const base = "http://localhost:3111";

/*
 * P0 regression: /materials renders categories.image_path through next/image.
 * Before the fix a bare storage path threw at render time and took the page down.
 */
console.log("=== /materials image rendering (the reported crash site) ===");
const html = await (await fetch(`${base}/materials`)).text();

const decoded = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

console.log("\nnext/image analysis:");
const inner = [...new Set(
  [...html.matchAll(/_next\/image\?url=([^&"]+)/g)]
    .map((m) => decodeURIComponent(m[1].replace(/&amp;/g, "&")))
    .filter((u) => /supabase\.co/.test(u)),
)];
console.log("  next/image entries       :", (html.match(/_next\/image/g) || []).length);
console.log("  absolute storage sources :", inner.length);
const innerBare = inner.filter((u) => !u.startsWith("/") && !/^https?:\/\//.test(u));
console.log("  NON-absolute inside url= :", innerBare.length, innerBare.slice(0, 3));

console.log("\nVerifying the real storage objects behind those images:");
let okCount = 0;
for (const u of inner.slice(0, 10)) {
  const m = u.match(/\/storage\/v1\/object\/public\/([^?]+)/);
  if (!m) continue;
  const res = await fetch(`${new URL(u).origin}/storage/v1/object/public/${m[1]}`);
  if (res.ok) okCount++;
  console.log(`  ${res.ok ? "OK " : "ERR"} ${res.status} ${String(res.headers.get("content-length") ?? 0).padStart(7)}B  ${m[1].slice(0, 68)}`);
}
console.log(`  -> ${okCount} verified`);
const bare = decoded.filter((s) => !s.startsWith("/") && !/^https?:\/\//.test(s));
const unsafe = decoded.filter((s) => /^(javascript|data|file|vbscript):/i.test(s));
const storageUrls = decoded.filter((s) => /supabase\.co\/storage\/v1\/object\/public\//.test(s));

console.log("total <img> tags          :", decoded.length);
console.log("relative (crash) srcs     :", bare.length, bare.slice(0, 5));
console.log("unsafe scheme srcs        :", unsafe.length);
console.log("resolved storage URLs     :", storageUrls.length);
console.log("next/image optimization   :", (html.match(/_next\/image/g) || []).length);
console.log("error page rendered?      :", /Application error|Internal Server Error/i.test(html));

console.log("\nVerifying real storage objects referenced by the page:");
for (const u of [...new Set(storageUrls)].slice(0, 10)) {
  const m = u.match(/\/storage\/v1\/object\/public\/([^?]+)/);
  if (!m) continue;
  const res = await fetch(`${new URL(u).origin}/storage/v1/object/public/${m[1]}`);
  console.log(`  ${res.ok ? "OK " : "ERR"} ${res.status} ${String(res.headers.get("content-length") ?? 0).padStart(7)}B  ${m[1].slice(0, 70)}`);
}

console.log("\n=== routes ===");
for (const p of ["/", "/materials", "/our-work", "/products", "/materials/wallpaper", "/materials/folding-doors"]) {
  console.log(String((await fetch(base + p)).status).padEnd(4), p);
}

console.log("\n=== search default state ===");
const rec = await fetch(`${base}/api/search?recommended=1`).then((r) => r.json());
console.log("recommendations:", rec.length, "| groups:", [...new Set(rec.map((r) => r.group))].join(", "));
const all11 = ["Laminate Flooring","SPC Flooring","Vinyl Flooring","PVC Wall Panels","Wallpaper","Folding Doors","False Ceiling","Window Blinds","3D Wall Picture","Carpet Tile","Artificial Grass"];
console.log("all 11 categories present:", all11.every((n) => rec.some((r) => r.title === n)));
console.log("missing:", all11.filter((n) => !rec.some((r) => r.title === n)));
console.log("broken hrefs:", rec.filter((r) => /null|undefined/.test(r.href)).length);