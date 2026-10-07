import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.log("MISSING_ENV", Object.keys(env).join(","));
  process.exit(0);
}
console.log("URL", url.replace(/https?:\/\//, "").replace(/\..*$/, "<host>"));

const headers = { apikey: key, Authorization: `Bearer ${key}` };

// 1) PostgREST OpenAPI describes every exposed table + column + type.
try {
  const res = await fetch(`${url}/rest/v1/`, { headers });
  const spec = await res.json();
  const defs = spec?.definitions ?? spec?.components?.schemas ?? {};
  console.log("OPENAPI_STATUS", res.status, "tables:", Object.keys(defs).join(", "));
  for (const [name, def] of Object.entries(defs)) {
    const props = def.properties ?? {};
    const required = new Set(def.required ?? []);
    console.log(
      `  ${name}:`,
      Object.entries(props)
        .map(([k, v]) => `${k}:${v.type ?? "?"}${required.has(k) ? "*" : ""}`)
        .join(", ")
    );
  }
} catch (error) {
  console.log("OPENAPI_ERROR", error.message);
}

// 2) Sample rows so we can see real values / column shapes.
for (const table of ["categories", "products", "media", "profiles"]) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=3`, { headers });
    const body = await res.json();
    if (!res.ok) {
      console.log(`ROWS ${table} ERROR ${res.status} ${JSON.stringify(body)}`);
      continue;
    }
    console.log(`ROWS ${table} OK count=${body.length}`);
    if (body[0]) console.log(`   cols: ${Object.keys(body[0]).join(", ")}`);
    body.forEach((row) => console.log(`   ${JSON.stringify(row).slice(0, 400)}`));
  } catch (error) {
    console.log(`ROWS ${table} ERROR ${error.message}`);
  }
}

// 3) Storage buckets.
try {
  const res = await fetch(`${url}/storage/v1/bucket`, { headers });
  const body = await res.json();
  console.log("BUCKETS", res.status, JSON.stringify(body).slice(0, 600));
} catch (error) {
  console.log("BUCKETS_ERROR", error.message);
}
