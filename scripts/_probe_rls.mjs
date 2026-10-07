/**
 * scripts/_probe_rls.mjs  —  temporary diagnostic, deleted after use.
 *
 * Answers one question: is the live `products` table anonymously writable?
 * It inserts a clearly marked row with the public anon key, then deletes it
 * again. If the insert is refused the table is protected and nothing changed.
 * If it is allowed, someone on the internet can rewrite the catalogue.
 */

import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function rest(path, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers, ...init });
  const text = await res.text();
  return { status: res.status, text };
}

const marker = `__cline_probe__${Date.now()}`;

const insert = await rest("products", {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify({ title: marker, category: "PROBE", price: 1 }),
});
console.log("ANON INSERT ->", insert.status, insert.text.slice(0, 240));

if (insert.status < 300) {
  const created = JSON.parse(insert.text);
  for (const row of created) {
    const removed = await rest(`products?id=eq.${row.id}`, { method: "DELETE" });
    console.log("ANON DELETE ->", removed.status);
  }
  const after = await rest(`products?title=eq.${marker}&select=id`);
  console.log("REMAINING AFTER CLEANUP ->", after.text.slice(0, 120));
} else {
  console.log("=> anon writes are refused; no change was made to the table.");
}
