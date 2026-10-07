/**
 * scripts/browser-materials.mjs
 *
 * Verifies the /materials explorer end to end in a real browser:
 * pills, chips, debounced inline search, highlighting, empty state,
 * URL deep-linking, Back-button restore, and CLS stability.
 */
import { connect, chrome, BASE, TYPE_INTO } from "./qa-harness.mjs";
import { setTimeout as sleep } from "node:timers/promises";

const SNAPSHOT = `(() => {
  const cards = [...document.querySelectorAll(".mat-card")];
  const pills = [...document.querySelectorAll(".mat-pill")];
  const chips = [...document.querySelectorAll(".mat-chip")];
  const count = document.querySelector('[aria-live="polite"]');
  return {
    url: location.search,
    pillLabels: pills.map((p) => p.textContent.trim()),
    pressedPill: pills.find((p) => p.getAttribute("aria-pressed") === "true")?.textContent.trim(),
    chips: chips.map((c) => c.textContent.trim()),
    pressedChips: chips.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.textContent.trim()),
    cardCount: cards.length,
    firstCards: cards.slice(0, 3).map((c) => c.textContent.trim().split("\\n").filter(Boolean).slice(0, 2).join(" / ")),
    highlighted: document.querySelectorAll(".mat-hit").length,
    emptyState: !!document.querySelector(".mat-skeleton"),
    emptyText: (document.querySelector(".mat-skeleton")?.innerText || "").replace(/\\s+/g, " ").slice(0, 90),
    liveRegion: count ? count.textContent.trim() : null,
  };
})()`;

async function main() {
  const cdp = await connect();
  await cdp.setViewport(1440);

  await cdp.goto(`${BASE}/materials`);
  await sleep(1200);
  console.log("INITIAL:", JSON.stringify(await cdp.evaluate(SNAPSHOT), null, 2));

  console.log("\n--- click 'Flooring' pill ---");
  await cdp.evaluate(`[...document.querySelectorAll(".mat-pill")].find((p) => /Flooring/.test(p.textContent)).click()`);
  await sleep(1000);
  const flooring = await cdp.evaluate(SNAPSHOT);
  console.log(JSON.stringify({ url: flooring.url, pressed: flooring.pressedPill, cards: flooring.cardCount, live: flooring.liveRegion }));

  console.log("\n--- click a tag chip ---");
  await cdp.evaluate(`[...document.querySelectorAll(".mat-chip")].find((c) => /Waterproof|Modular|Plank/i.test(c.textContent))?.click()`);
  await sleep(900);
  const chipped = await cdp.evaluate(SNAPSHOT);
  console.log(JSON.stringify({ url: chipped.url, pressedChips: chipped.pressedChips, cards: chipped.cardCount, live: chipped.liveRegion }));

  console.log("\n--- BACK button restores previous state ---");
  await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Alt", code: "AltLeft", windowsVirtualKeyCode: 18 });
  await cdp.evaluate(`window.history.back(); true`);
  await sleep(1200);
  const back = await cdp.evaluate(SNAPSHOT);
  console.log(JSON.stringify({ url: back.url, pressed: back.pressedPill, pressedChips: back.pressedChips, cards: back.cardCount }));

  console.log("\n--- deep link: /materials?group=ceiling ---");
  await cdp.goto(`${BASE}/materials?group=ceiling`);
  await sleep(1400);
  console.log(JSON.stringify(await cdp.evaluate(SNAPSHOT), null, 2));

  console.log("\n--- inline debounced search 'wall' ---");
  await cdp.goto(`${BASE}/materials`);
  await sleep(1000);
  const t0 = Date.now();
  await cdp.evaluate(TYPE_INTO(".mat-search-input", "wall"));
  await sleep(900);
  const searched = await cdp.evaluate(SNAPSHOT);
  console.log(JSON.stringify({ url: searched.url, cards: searched.cardCount, highlighted: searched.highlighted, live: searched.liveRegion, elapsedMs: Date.now() - t0 }));
  console.log("  sample:", searched.firstCards);

  console.log("\n--- empty state ---");
  await cdp.evaluate(TYPE_INTO(".mat-search-input", "zzzzqqq"));
  await sleep(900);
  console.log(JSON.stringify(await cdp.evaluate(SNAPSHOT), null, 2));

  console.log("\n--- request count while typing (no per-keystroke fetch) ---");
  await cdp.goto(`${BASE}/materials`);
  await sleep(1200);
  const reqs = [];
  cdp.onEvent = ((orig) => (msg) => { if (msg.method === "Network.requestWillBeSent") reqs.push(msg.params.request.url); return orig(msg); })(cdp.onEvent);
  for (const term of ["w", "wa", "wal", "wall"]) {
    await cdp.evaluate(TYPE_INTO(".mat-search-input", term));
    await sleep(260);
  }
  await sleep(800);
  const fetches = reqs.filter((u) => /\/api\//.test(u));
  console.log("total requests during typing:", reqs.length, "| /api/ fetches:", fetches.length);

  console.log("\n--- CLS while filtering ---");
  const cls = await cdp.evaluate(`(async () => {
    let total = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) total += entry.value;
    });
    po.observe({ type: "layout-shift", buffered: true });
    const pills = [...document.querySelectorAll(".mat-pill")];
    for (const pill of pills) { pill.click(); await new Promise((r) => setTimeout(r, 700)); }
    po.disconnect();
    return total;
  })()`);
  console.log("cumulative layout shift across all pill filters:", cls);

  console.log(`\nconsole errors: ${cdp.consoleErrors.length}`, cdp.consoleErrors.slice(0, 3));

  cdp.ws.close();
  chrome.kill();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FAILED:", error);
    chrome.kill();
    process.exit(1);
  });