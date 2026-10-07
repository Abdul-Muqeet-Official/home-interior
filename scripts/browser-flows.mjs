/**
 * scripts/browser-flows.mjs
 *
 * Real interaction flows driven through the Chrome DevTools Protocol:
 * search typing + navigation, recommendation clicks, the mobile drawer,
 * wallpaper country filters and collection rendering.
 */
import { connect, chrome, BASE, TYPE_INTO } from "./qa-harness.mjs";
import { setTimeout as sleep } from "node:timers/promises";

const OPEN_SEARCH = `[...document.querySelectorAll("button,a")].find((b) => /^search$/i.test((b.textContent||"").trim())).click()`;

async function main() {
  const cdp = await connect();

  console.log("=== FLOW 1: search — recommendations, typing, navigation ===");
  await cdp.setViewport(1440);
  await cdp.goto(BASE + "/");
  await cdp.evaluate(OPEN_SEARCH);
  await sleep(1800);

  console.log("BEFORE typing:", JSON.stringify(await cdp.evaluate(`(() => {
    const d = document.querySelector('[role="dialog"]');
    return { headings: [...d.querySelectorAll("h3")].map(h=>h.textContent.trim()), links: d.querySelectorAll("a").length };
  })()`)));

  console.log("clicking first recommendation:", await cdp.evaluate(
    `document.querySelector('[role="dialog"] a[href^="/materials/"]').getAttribute("href")`,
  ));
  await cdp.evaluate(`document.querySelector('[role="dialog"] a[href^="/materials/"]').click()`);
  await sleep(2600);
  console.log("  -> landed on:", await cdp.evaluate(`location.pathname`));
  console.log("  -> has h1:", await cdp.evaluate(`document.querySelectorAll("h1").length > 0`));

  await cdp.goto(BASE + "/");
  await cdp.evaluate(OPEN_SEARCH);
  await sleep(1500);
  await cdp.evaluate(TYPE_INTO('[role="dialog"] input', "wallpaper"));
  await sleep(2000);
  console.log("AFTER typing 'wallpaper':", JSON.stringify(await cdp.evaluate(`(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      headings: [...d.querySelectorAll("h3")].map(h=>h.textContent.trim()),
      results: [...d.querySelectorAll("a")].slice(0,4).map(a=>({t:a.textContent.trim().slice(0,38), h:new URL(a.href).pathname})),
    };
  })()`), null, 2));

  await cdp.evaluate(TYPE_INTO('[role="dialog"] input', "zzzqqqxx"));
  await sleep(2000);
  console.log("NO-RESULT state:", await cdp.evaluate(
    `document.querySelector('[role="dialog"]').innerText.replace(/\\s+/g," ").slice(0,130)`,
  ));

  await cdp.evaluate(TYPE_INTO('[role="dialog"] input', ""));
  await sleep(1500);
  console.log("AFTER clearing:", await cdp.evaluate(
    `[...document.querySelectorAll('[role="dialog"] h3')].map(h=>h.textContent.trim())`,
  ));

  console.log("\n=== FLOW 5: mobile drawer at 390 ===");
  await cdp.setViewport(390);
  await cdp.goto(BASE + "/");
  console.log("  menu button:", JSON.stringify(await cdp.evaluate(`(() => {
    const btn = [...document.querySelectorAll("button")].find(b => /menu|nav/i.test(b.getAttribute("aria-label")||""));
    if (!btn) return { ok:false };
    btn.click();
    return { ok:true, label: btn.getAttribute("aria-label") };
  })()`)));
  await sleep(1200);
  console.log("  drawer present:", await cdp.evaluate(`!!document.querySelector('nav a[href="/materials"]')`));
  console.log("  nav links:", await cdp.evaluate(
    `[...document.querySelectorAll('nav a')].map(a=>a.textContent.trim().split('\\n')[0]).slice(0,10)`,
  ));
  console.log("  overflow with drawer open:", await cdp.evaluate(
    `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
  ));

  console.log("\n=== wallpaper country filters (real data) ===");
  for (const p of ["/materials/wallpaper/china", "/materials/wallpaper/korea"]) {
    await cdp.goto(BASE + p);
    console.log(` ${p}:`, JSON.stringify(await cdp.evaluate(`(() => ({
      h1: (document.querySelector("h1")||{}).innerText,
      headings: [...document.querySelectorAll("h2,h3")].map(h=>h.textContent.trim()).slice(0,5),
      images: document.querySelectorAll("img").length,
      lazyImages: document.querySelectorAll('img[loading="lazy"]').length,
      htmlKb: Math.round(document.documentElement.innerHTML.length/1024),
    }))()`)));
  }

  console.log("\n=== collections display real media with zero products ===");
  await cdp.goto(BASE + "/materials/folding-doors");
  console.log(" folding-doors:", JSON.stringify(await cdp.evaluate(`(() => ({
    h1: (document.querySelector("h1")||{}).innerText,
    collectionLinks: document.querySelectorAll('a[href^="/materials/folding-doors/"]').length,
    images: document.querySelectorAll("img").length,
    fakeEmptyState: /products will appear here/i.test(document.body.innerText),
  }))()`)));

  console.log("\n=== review form validation ===");
  await cdp.goto(BASE + "/reviews");
  console.log("  forms on page:", await cdp.evaluate(`document.querySelectorAll("form").length`));
  const r1 = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_name: "", email: "not-an-email", testimonial: "", rating: 9 }),
  });
  console.log("  invalid POST ->", r1.status, (await r1.text()).slice(0, 110));

  cdp.ws.close();
  chrome.kill();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("FLOWS FAILED:", error);
    chrome.kill();
    process.exit(1);
  });
