/**
 * scripts/_probe_live.mjs
 * Read-only inspection of the LIVE Supabase project using the anon key only
 * (RLS applies — this never uses a privileged key). Reports which catalogue
 * tables exist and whether the canonical categories/products are seeded.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("project:", url.replace("https://", "").split(".")[0]);

const db = createClient(url, anon, { auth: { persistSession: false } });

const TABLES = [
  "categories",
  "products",
  "media",
  "projects",
  "reviews",
  "services",
  "site_settings",
  "settings",
  "profiles",
  "audit_logs",
];

for (const table of TABLES) {
  const { data, error, count } = await db
    .from(table)
    .select("*", { count: "exact" })
    .limit(3);
  if (error) {
    console.log(`  ${table.padEnd(14)} MISSING/ERR  ${error.code ?? ""} ${error.message}`);
  } else {
    console.log(`  ${table.padEnd(14)} OK  count=${count ?? data.length}`);
  }
}

console.log("\ncategories:");
const { data: cats, error: catErr } = await db
  .from("categories")
  .select("*")
  .order("sort_order", { ascending: true });
if (catErr) console.log("  error:", catErr.message);
else if (!cats?.length) console.log("  (none readable — empty table or RLS blocks anon)");
else for (const c of cats) console.log(`  ${c.slug}  |  ${c.name}  |  active=${c.is_active}`);

console.log("\nproducts:");
const { data: prods, error: prodErr } = await db
  .from("products")
  .select("*")
  .limit(40);
if (prodErr) console.log("  error:", prodErr.message);
else if (!prods?.length) console.log("  (none readable)");
else {
  console.log("  columns:", Object.keys(prods[0]).join(", "));
  for (const p of prods) {
    console.log(
      `  ${p.slug ?? p.id}  |  cat=${p.category_id ?? p.category_slug ?? "?"}  |  price=${
        p.price ?? "-"
      } ${p.currency ?? ""} ${p.unit ?? ""}  |  published=${p.is_published ?? p.is_active}`
    );
  }
}
