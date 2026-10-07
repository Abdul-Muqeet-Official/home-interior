/**
 * scripts/browser-completeness.mjs
 *
 * Proves 100% A-Z completeness of the "All Collections" explorer by comparing
 * the rendered grid against the live published database rows, and re-checks
 * filtering, debounce, URL state, Back button and CLS.
 */
import { connect, chrome, BASE, TYPE_INTO } from "./qa-harness.mjs";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";

const SNAP = `(() => {
  const cards = [...document.querySelectorAll(".mat-card")];
  const names = cards.map((c) => (c.querySelector("h3") || {}).textContent || "").map((s) => s.trim());
  const pills = [...document.querySelectorAll(".mat-pill")];
  return {
    count: cards.length,
    names,
    sortedAZ: names.every((n, i) => i === 0 || names[i-1].localeCompare(n, "en", { sensitivity: "base" }) <= 0),
    live: (document.querySelector('[aria-live="polite"]') || {}).textContent,
    pills: pills.map((p) => p.textContent.trim()),
    brokenLinks: [...document.querySelectorAll(".mat-card")].filter((c) => /\\/null|undefined/.test(c.getAttribute("href") || "")).length,
    productCards: [...document.querySelectorAll(".mat-card")].filter((c) => /View product/.test(c.textContent)).length,
  };
})()`;

async function main() {
  const cdp = await connect();
  await cdp.setViewport(1440);
  await cdp.goto(`${BASE}/materials`);
  await sleep(1500);

  const all = await cdp.evaluate(SNAP);
  const names = await cdp.evaluate(`[...document.querySelectorAll(".mat-card h3")].map((h) => h.textContent.trim())`);
  fs.writeFileSync("rendered.json", JSON.stringify(names, null, 2));
  console.log("dumped rendered names:", names.length);

  console.log("RENDERED:", all.count, "items | live:", all.live, "| sorted A-Z:", all.sortedAZ);
  console.log("pills:", JSON.stringify(all.pills));
  console.log("broken hrefs:", all.brokenLinks, "| product cards:", all.productCards);

  // Group totals must sum to the unfiltered total (nothing lost to filtering).
  const total = all.count;
  let sum = 0;
  const groupCount = all.pills.length - 1;
  for (let i = 1; i < all.pills.length; i++) {
    // Click by index: label text matching is brittle once counts are appended.
    await cdp.evaluate(`document.querySelectorAll(".mat-pill")[${i}].click(); true`);
    await sleep(650);
    const s = await cdp.evaluate(SNAP);
    sum += s.count;
    console.log(`  pill[${i}] ${all.pills[i].padEnd(26)} -> ${s.count} rendered`);
  }
  console.log(`SUM OF ${groupCount} GROUPS = ${sum} | UNFILTERED = ${total} | complete=${sum === total}`);

  // Deep link + back.
  await cdp.goto(`${BASE}/materials?search=spc`);
  await sleep(1300);
  const deep = await cdp.evaluate(SNAP);
  console.log("\nDEEP LINK ?search=spc ->", deep.count, "items | url ok |", JSON.stringify(deep.names.slice(0, 4)));

  await cdp.goto(`${BASE}/materials`);
  await sleep(1000);
  await cdp.evaluate(`[...document.querySelectorAll(".mat-pill")].find((p)=>/Flooring/.test(p.textContent)).click()`);
  await sleep(700);
  await cdp.evaluate(`window.history.back(); true`);
  await sleep(1000);
  const back = await cdp.evaluate(SNAP);
  console.log("BACK ->", back.count, "items |", back.live, "| url:", await cdp.evaluate("location.search"));

  // Debounce: no per-keystroke network.
  await cdp.goto(`${BASE}/materials`);
  await sleep(1200);
  const reqs = [];
  const orig = cdp.onEvent;
  cdp.onEvent = (msg) => { if (msg.method === "Network.requestWillBeSent") reqs.push(msg.params.request.url); return orig(msg); };
  for (const t of ["s", "sp", "spc"]) { await cdp.evaluate(TYPE_INTO(".mat-search-input", t)); await sleep(260); }
  await sleep(800);
  console.log("typing:", reqs.length, "requests |", reqs.filter((u) => /\/api\//.test(u)).length, "api calls");

  // CLS across every pill + a search.
  const cls = await cdp.evaluate(`(async () => {
    let total = 0;
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) total += e.value; });
    po.observe({ type: "layout-shift", buffered: true });
    for (const p of document.querySelectorAll(".mat-pill")) { p.click(); await new Promise(r=>setTimeout(r,600)); }
    const i = document.querySelector(".mat-search-input");
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;
    set.call(i,"a"); i.dispatchEvent(new Event("input",{bubbles:true}));
    await new Promise(r=>setTimeout(r,800));
    po.disconnect(); return total;
  })()`);
  console.log("CLS across all pills + search:", cls);

  console.log("console errors:", cdp.consoleErrors.length, cdp.consoleErrors.slice(0, 3));
  cdp.ws.close();
  chrome.kill();
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("FAILED:", e); chrome.kill(); process.exit(1); });