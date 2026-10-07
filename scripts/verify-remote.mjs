/**
 * scripts/verify-remote.mjs
 * Read-only verification of the remote Supabase project.
 *
 * Usage:
 *   node scripts/verify-remote.mjs          — verify tables/RLS via the REST API
 *   node scripts/verify-remote.mjs --lead   — additionally insert ONE clearly-marked
 *                                             test lead (delete it in the dashboard after)
 *
 * Never prints credentials. Uses the public anon key only.
 */

import { readFileSync } from "node:fs";

const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).trim()];
    })
);

const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY in .env — nothing verified.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

// Public content tables must return 200 to the anon key.
// Secured tables must exist but must NOT return rows to the anon key —
// 200 (RLS-filtered empty) or 403 (no grant) both mean "exists and is locked".
const expectations = [
  { table: "categories",   kind: "public"  },
  { table: "services",     kind: "public"  },
  { table: "site_settings",kind: "public"  },
  { table: "products",     kind: "public"  },
  { table: "projects",     kind: "public"  },
  { table: "reviews",      kind: "public"  },
  { table: "leads",        kind: "secured" },
  { table: "profiles",     kind: "secured" },
  { table: "media",        kind: "secured" },
  { table: "audit_logs",   kind: "secured" },
];

let pass = 0;
let fail = 0;

for (const { table, kind } of expectations) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
    const body = await res.text();
    const missing = body.includes("PGRST205") || res.status === 404;
    if (missing) {
      fail += 1;
      console.log(`FAIL  ${table.padEnd(14)} MISSING (relation not found)`);
    } else if (kind === "public" && res.status !== 200) {
      fail += 1;
      console.log(`FAIL  ${table.padEnd(14)} HTTP ${res.status} — public read blocked`);
    } else if (kind === "secured" && res.status === 200 && body.replace(/[\s\[\]]/g, "").length > 0) {
      fail += 1;
      console.log(`FAIL  ${table.padEnd(14)} HTTP 200 WITH ROWS — RLS not restricting anon reads`);
    } else {
      pass += 1;
      console.log(`PASS  ${table.padEnd(14)} HTTP ${res.status}`);
    }
  } catch (error) {
    fail += 1;
    console.log(`FAIL  ${table.padEnd(14)} ${error.cause?.code ?? error.message}`);
  }
}

// Optional single test lead — only with --lead.
if (process.argv.includes("--lead")) {
  try {
    const res = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        name: "Site Verification",
        phone: "+92 000 0000000",
        message: "Automated verification lead — safe to delete in the dashboard.",
        source: "verify-remote.mjs",
      }),
    });
    if (res.status === 201) {
      pass += 1;
      console.log("PASS  leads insert   HTTP 201 — one test lead created (delete it in the dashboard)");
    } else {
      fail += 1;
      const body = await res.text();
      const clean = body.includes("PGRST205") ? "leads table missing" : `HTTP ${res.status}`;
      console.log(`FAIL  leads insert   ${clean}`);
    }

    // Anon must NOT be able to UPDATE or DELETE leads. With RLS there is no
    // anon update/delete policy, so these operations can never affect a row.
    // We ask for the affected rows back (return=representation): a non-empty
    // result would mean a policy leak; an empty result (or a 4xx) means blocked.
    const patchRes = await fetch(`${url}/rest/v1/leads?source=eq.verify-remote.mjs`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ status: "contacted" }),
    });
    const patchBody = await patchRes.text();
    const patchLeaked = patchRes.status < 400 && patchBody.replace(/[\s[\]]/g, "").length > 0;

    const deleteRes = await fetch(`${url}/rest/v1/leads?source=eq.verify-remote.mjs`, {
      method: "DELETE",
      headers: { ...headers, Prefer: "return=representation" },
    });
    const deleteBody = await deleteRes.text();
    const deleteLeaked = deleteRes.status < 400 && deleteBody.replace(/[\s[\]]/g, "").length > 0;

    if (!patchLeaked && !deleteLeaked) {
      pass += 1;
      console.log(
        `PASS  leads anon write block   PATCH ${patchRes.status}, DELETE ${deleteRes.status} — anon cannot modify or delete leads`
      );
    } else {
      fail += 1;
      console.log(
        `FAIL  leads anon write block   PATCH ${patchRes.status} leaked=${patchLeaked}, DELETE ${deleteRes.status} leaked=${deleteLeaked}`
      );
    }
  } catch (error) {
    fail += 1;
    console.log(`FAIL  leads insert   ${error.cause?.code ?? error.message}`);
  }
}
// Storage buckets — verified with the anon key via the public object endpoint.
//   "Bucket not found"  -> bucket missing or not public (FAIL: the site needs public read)
//   "Object not found"  -> bucket exists AND is publicly readable (PASS; probe object is simply absent)
for (const bucket of ["products", "projects", "services", "site-assets"]) {
  try {
    const res = await fetch(`${url}/storage/v1/object/public/${bucket}/__verify_probe__.txt`, { headers });
    const body = await res.text();
    if (body.includes("Bucket not found")) {
      fail += 1;
      console.log(`FAIL  storage:${bucket.padEnd(12)} BUCKET MISSING OR NOT PUBLIC`);
    } else if (res.status === 403) {
      fail += 1;
      console.log(`FAIL  storage:${bucket.padEnd(12)} exists but not public (HTTP 403)`);
    } else if (body.includes("Object not found")) {
      pass += 1;
      console.log(`PASS  storage:${bucket.padEnd(12)} exists, public read OK (probe object absent)`);
    } else {
      pass += 1;
      console.log(`PASS  storage:${bucket.padEnd(12)} HTTP ${res.status}`);
    }
  } catch (error) {
    fail += 1;
    console.log(`FAIL  storage:${bucket.padEnd(12)} ${error.cause?.code ?? error.message}`);
  }
}

// If the categories table exists, verify all 10 canonical material categories
// are seeded (silently skipped pre-apply — the table is missing then).
try {
  const res = await fetch(`${url}/rest/v1/categories?select=name,slug&order=sort_order.asc`, { headers });
  if (res.status === 200) {
    const rows = await res.json();
    const expected = [
      "laminate-flooring",
      "spc-flooring",
      "vinyl-flooring",
      "pvc-wall-panel",
      "wallpaper",
      "folding-door",
      "gypsum-false-ceiling",
      "window-blinds",
      "3d-wall-picture",
      "artificial-grass",
    ];
    const slugs = rows.map((row) => row.slug);
    const missing = expected.filter((slug) => !slugs.includes(slug));
    if (missing.length === 0) {
      pass += 1;
      console.log(`PASS  categories seed   ${rows.length} rows — all 10 canonical slugs present`);
    } else {
      fail += 1;
      console.log(`FAIL  categories seed   ${rows.length} rows — missing: ${missing.join(", ")}`);
    }
  }
} catch {
  /* categories not provisioned yet — already reported in the table check */
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
