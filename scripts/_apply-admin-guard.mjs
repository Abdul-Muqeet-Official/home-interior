/**
 * scripts/_apply-admin-guard.mjs  (one-off codemod)
 *
 * Adds the canonical `adminGuard(request)` gate to every /api/admin route handler
 * except the session endpoint, which IS the authentication boundary.
 *
 * Idempotent: re-running reports "already guarded" instead of duplicating lines.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("app/api/admin");
const SKIP = new Set(["session/route.ts"]);
const GUARD_IMPORT = 'import { adminGuard } from "@/lib/supabase/guard";';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name === "route.ts" ? [full] : [];
  });
}

let changed = 0;
const report = [];

for (const file of walk(ROOT)) {
  const relative = path.relative(ROOT, file).replace(/\\/g, "/");
  if (SKIP.has(relative)) {
    report.push(`${relative}: SKIPPED (auth endpoint)`);
    continue;
  }

  const original = fs.readFileSync(file, "utf8");
  let code = original;

  // 1. Import the guard once.
  if (!code.includes(GUARD_IMPORT)) {
    const lines = code.split("\n");
    let lastImport = -1;
    lines.forEach((line, index) => {
      if (/^import .*from "/.test(line.trim())) lastImport = index;
    });
    if (lastImport === -1) {
      report.push(`${relative}: ERROR no import block found`);
      continue;
    }
    lines.splice(lastImport + 1, 0, GUARD_IMPORT);
    code = lines.join("\n");
  }

  // 2. Handlers that take no request object need one for the guard.
  code = code.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\(\)\s*\{/g, (m, verb) => {
    return `export async function ${verb}(request: NextRequest) {`;
  });
  // 3. Unused-parameter form -> named parameter the guard can read.
  code = code.replace(/_request: NextRequest/g, "request: NextRequest");

  // 4. Insert the gate immediately before the service-role client is obtained.
  let insertions = 0;
  code = code.replace(
    /^([ \t]*)const admin = requireAdmin\(\);/gm,
    (match, indent) => {
      insertions += 1;
      return `${indent}const denied = await adminGuard(request);\n${indent}if (denied) return denied;\n\n${match}`;
    }
  );

  if (code === original) {
    report.push(`${relative}: unchanged (already guarded: ${original.includes("adminGuard(request)")})`);
    continue;
  }

  fs.writeFileSync(file, code);
  changed += 1;
  report.push(`${relative}: guarded ${insertions} handler(s)`);
}

report.forEach((line) => console.log(line));
console.log(`\nfiles rewritten: ${changed}`);
