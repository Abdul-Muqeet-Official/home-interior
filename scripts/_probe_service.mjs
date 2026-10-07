import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing server Supabase environment");
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
for (const table of ["categories", "media", "products", "projects", "reviews"]) { const result = await db.from(table).select("*").limit(1); console.log(table, result.error?.message ?? "OK", result.data?.[0] ? Object.keys(result.data[0]).sort() : []); }
const buckets = await db.storage.listBuckets(); console.log("buckets", buckets.error?.message ?? buckets.data.map((bucket) => bucket.id).sort());
const wallpaper = await db.from("categories").select("id,name,slug,country,source_filename,source_hash,page_count,is_active").eq("slug", "wallpaper"); console.log("wallpaper", wallpaper.error?.message ?? wallpaper.data);
const countryRows = await db.from("categories").select("id,name,slug,country", { count: "exact" }).in("country", ["china", "korea"]);
const pageRows = await db.from("media").select("id", { count: "exact", head: true }).eq("media_type", "rendered-page");
const coverRows = await db.from("media").select("id", { count: "exact", head: true }).eq("media_type", "cover");
console.log("country_rows", countryRows.count, countryRows.error?.message ?? "", "rendered_pages", pageRows.count, pageRows.error?.message ?? "", "covers", coverRows.count, coverRows.error?.message ?? "");
