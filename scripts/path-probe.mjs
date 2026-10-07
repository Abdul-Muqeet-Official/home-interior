import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data } = await db.from("categories").select("slug, image_path").not("image_path", "is", null).limit(40);
console.log("CATEGORY image_path values:");
for (const row of data ?? []) console.log(`  ${row.slug.padEnd(22)} ${row.image_path}`);

const relative = (data ?? []).filter((r) => r.image_path && !r.image_path.startsWith("/") && !/^https?:\/\//.test(r.image_path));
console.log(`\nRELATIVE (would crash next/image): ${relative.length} of ${(data ?? []).length}`);
for (const r of relative) console.log(`  CRASH -> ${r.slug}: ${r.image_path}`);

const { data: prods } = await db.from("products").select("slug, image_path, image_url");
console.log("\nPRODUCTS:", JSON.stringify(prods, null, 2));

const { data: proj } = await db.from("projects").select("slug, hero_image_path, image_path, video_poster_path").limit(10);
console.log("PROJECTS:", JSON.stringify(proj, null, 2));