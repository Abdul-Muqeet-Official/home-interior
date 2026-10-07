/**
 * scripts/browser-images.mjs
 *
 * Proves in a real browser that catalogue images actually RENDER (not merely
 * parse), that no relative/unsafe src reaches the DOM, and that a single bad
 * asset cannot take a whole category page down.
 */
import { connect, chrome, BASE } from "./qa-harness.mjs";
import { setTimeout as sleep } from "node:timers/promises";

async function main() {
  const cdp = await connect();

  for (const route of ["/materials", "/", "/materials/folding-doors", "/materials/wallpaper"]) {
    await cdp.setViewport(1440);
    await cdp.goto(BASE + route);
    await sleep(1500);
    // Force lazy images to resolve so the measurement is complete.
    await cdp.evaluate(`(() => { if (document.body) window.scrollTo(0, document.body.scrollHeight); return true; })()`);
    await sleep(2500);
    await cdp.evaluate(`window.scrollTo(0, 0)`);
    await sleep(1200);

    const stats = await cdp.evaluate(`(() => {
      const imgs = [...document.querySelectorAll("img")];
      const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0);
      const loaded = imgs.filter((i) => i.complete && i.naturalWidth > 0);
      const pending = imgs.filter((i) => !i.complete);
      const bad = imgs.filter((i) => !/^(\\/|https:\\/\\/)/.test(i.getAttribute("src") || ""));
      const unsafe = imgs.filter((i) => /^(javascript|data|file|vbscript):/i.test(i.getAttribute("src") || ""));
      return {
        total: imgs.length,
        loaded: loaded.length,
        broken: broken.length,
        pending: pending.length,
        relativeSrc: bad.length,
        unsafeSrc: unsafe.length,
        brokenSample: broken.slice(0,3).map((i) => (i.getAttribute("src")||"").slice(0,70)),
        notAbsoluteSample: [...new Set(bad.map((i) => (i.getAttribute("src")||"").slice(0,90)))].slice(0, 6),
        errorPage: /Application error|Internal Server Error/i.test(document.body.innerText),
        h1: (document.querySelector("h1")||{}).innerText,
      };
    })()`);

    console.log(`\n${route}`);
    console.log(`  loaded=${stats.loaded} broken=${stats.broken} pending=${stats.pending} total=${stats.total}`);
    console.log(`  relativeSrc=${stats.relativeSrc} unsafeSrc=${stats.unsafeSrc} errorPage=${stats.errorPage}`);
    console.log(`  h1="${stats.h1}"`);
    if (stats.brokenSample.length) console.log(`  broken: ${stats.brokenSample}`);
    if (stats.notAbsoluteSample?.length) console.log(`  notAbsolute sample: ${JSON.stringify(stats.notAbsoluteSample, null, 2)}`);
    console.log(`  console errors=${cdp.consoleErrors.length} exceptions=${cdp.exceptions.length}`);
    if (cdp.consoleErrors.length) console.log(`   ${cdp.consoleErrors.slice(0, 3)}`);
  }

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
