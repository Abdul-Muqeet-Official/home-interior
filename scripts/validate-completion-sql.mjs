import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20240920_remote_completion.sql"),
  "utf8"
);

// Detects unbalanced () [] "" '' and dollar-average quoting.
let i = 0;
let round = 0, sq = 0, dq = 0, dollar = 0, comment = false, dollarOpen = false;
const breaks = [];
while (i < sql.length) {
  const ch = sql[i];
  const ch2 = sql[i + 1] ?? "";
  const ch3 = sql[i + 2] ?? "";

  if (comment) {
    if (ch === "*" && ch2 === "/") { comment = false; i += 2; }
    else if (ch === "-" && ch2 === "-" && ch3 !== "-") { comment = false; i += 3; }
    else i++;
    continue;
  }

  if (ch === "-" && ch2 === "-" && ch3 !== "-") { comment = true; i += 2; continue; }
  if (ch === "/" && ch2 === "*") { comment = true; i += 2; continue; }
  if (dollarOpen) {
    if (ch === "$") dollarOpen = false;
    i++; continue;
  }
  if (dollar > 0) {
    if (ch === "$") { dollar--; if (dollar === 0 && sql[i + 1] !== "$") dollarOpen = true; }
    i++; continue;
  }
  if (sq > 0) {
    if (ch === "'") { sq--; if (sq > 0 && sql[i + 1] === "'") { i++; sq--; } }
    i++; continue;
  }
  if (dq > 0) {
    if (ch === '"') { dq--; if (dq > 0 && sql[i + 1] === '"') { i++; dq--; } }
    i++; continue;
  }

  if (ch === "'" && ch2 !== "'") { sq++; i++; continue; }
  if (ch === "'" && ch2 === "'" && sql[i + 3] !== "'") { sq += 2; i += 2; continue; }
  if (ch === "'" && ch2 === "'" && sql[i + 3] === "'") { sq += 3; i += 3; continue; }

  if (ch === '"' && ch2 !== '"') { dq++; i++; continue; }
  if (ch === '"' && ch2 === '"' && sql[i + 3] !== '"') { dq += 2; i += 2; continue; }
  if (ch === '"' && ch2 === '"' && sql[i + 3] === '"') { dq += 3; i += 3; continue; }

  if (ch === "$" && ch2 === "$" && sql[i + 3] !== "$") { dollar++; i++; continue; }
  if (ch === "$" && ch2 === "$" && sql[i + 3] === "$") { dollar++; i++; continue; }
  if (ch === "$" && ch2 === "$") { dollar++; i++; continue; }

  if (ch === "(") round++;
  else if (ch === ")") round--;
  else if (ch === ";") {
    if (round !== 0) breaks.push(`line ${sql.slice(0, i).split("\n").length + 1}: ; inside unclosed ( round=${round}`);
    round = 0;
  }
  if (dq !== 0) breaks.push(`line ${sql.slice(0, i).split("\n").length + 1}: unclosed "`);
  if (sq !== 0) breaks.push(`line ${sql.slice(0, i).split("\n").length + 1}: unclosed '`);
  i++;
}

const tables = new Map<string, { create: number; ref: number }>();
for (const m of sql.matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(public|storage)\.([a-zA-Z_][a-zA-Z0-9_]*)/gi)) {
  const t = `${m[1]}.${m[2]}`;
  tables.set(t, { create: (tables.get(t)?.create ?? 0) + 1, ref: 0 });
}
for (const m of sql.matchAll(/\b(public|storage)\.([a-zA-Z_][a-zA-Z0-9_]*)\b/gi)) {
  const t = `${m[1]}.${m[2]}`;
  if (tables.has(t)) tables.get(t)!.ref++;
}

const policies = new Map<string, { create: number }>();
for (const m of sql.matchAll(/CREATE\s+POLICY\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)) {
  const name = m[1];
  policies.set(name, { create: (policies.get(name)?.create ?? 0) + 1 });
}
for (const m of sql.matchAll(/polyname\s*=\s*'([a-zA-Z_][a-zA-Z0-9_-]*)'/gi)) {
  const name = m[1];
  if (!policies.has(name)) policies.set(name, { create: 0 });
}

console.log("lines:", sql.split("\n").length);
console.log("stat balance OK:", sq === 0 && dq === 0 && round === 0 && breaks.length === 0);
if (breaks.length) {
  console.log("token breaks:", breaks.slice(0, 30).join("\n"));
}
console.log("tables:");
for (const [t, c] of tables) {
  console.log(`  ${t.padEnd(48)} create=${c.create} refs=${c.ref}`);
}
console.log("policies:");
for (const [name, c] of policies) {
  console.log(`  ${name.padEnd(48)} create=${c.create}`);
}

const buckets: string[] = [];
for (const m of sql.matchAll(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(true|false)\s*\)/gi)) {
  buckets.push(`${m[1]} (public=${m[3]})`);
}
if (!buckets.length) {
  for (const m of sql.matchAll(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/gi)) {
    buckets.push(m[1]);
  }
}
console.log("bucket inserts:");
for (const b of buckets) console.log("  ", b);

const known = ["profiles", "categories", "products", "projects", "reviews", "services", "leads", "site_settings", "media", "audit_logs"];
const missing = known.filter((t) => !tables.has(`public.${t}`) && !tables.has(`storage.${t}`));
console.log("missing tables from schema list:", missing.length ? missing.join(", ") : "none");
