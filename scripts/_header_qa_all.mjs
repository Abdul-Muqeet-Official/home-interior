/**
 * scripts/_header_qa_all.mjs — sequential header QA sweep (no packages).
 *
 * _header_qa.mjs binds a fixed Chrome remote-debugging port, so the widths are
 * captured one after another rather than in parallel.
 *
 * Usage: node scripts/_header_qa_all.mjs [outDir] [url] [prefix]
 *   node scripts/_header_qa_all.mjs ../../hdr-qa http://localhost:3000/ after
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] ?? join(here, "..", "..", "hdr-qa"));
const url = process.argv[3] ?? "http://localhost:3000/";
const prefix = process.argv[4] ?? "after";

/** width / height pairs used across the responsive header QA. */
const VIEWPORTS = [
  [390, 844],
  [1024, 768],
  [1280, 800],
  [1440, 900],
];

mkdirSync(outDir, { recursive: true });

let failed = 0;
for (const [width, height] of VIEWPORTS) {
  const png = join(outDir, `${prefix}-${width}.png`);
  const json = join(outDir, `${prefix}-${width}.json`);
  const result = spawnSync(
    process.execPath,
    [join(here, "_header_qa.mjs"), url, String(width), String(height), png, json],
    { stdio: "inherit" }
  );
  const ok = result.status === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${width}x${height} -> ${png}`);
}

console.log(failed === 0 ? "\nALL HEADER CAPTURES TOOK PLACE" : `\n${failed} CAPTURE(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
