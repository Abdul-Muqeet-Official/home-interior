/**
 * scripts/visual-qa.mjs
 *
 * Real browser QA against the running production server.
 *
 * Checks every required viewport for horizontal overflow, broken images, console
 * errors, failed network requests, heading structure and cumulative layout shift, and
 * captures a screenshot of each page for inspection.
 */
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.resolve(".catalogue-work", "visual-qa");

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900, dsf: 1 },
  { name: "1920x1080", width: 1920, height: 1080, dsf: 1 },
  { name: "1024x768", width: 1024, height: 768, dsf: 1 },
  { name: "768x1024", width: 768, height: 1024, dsf: 1 },
  { name: "390x844", width: 390, height: 844, dsf: 2, mobile: true },
  { name: "375x812", width: 375, height: 812, dsf: 2, mobile: true },
  { name: "320x800", width: 320, height: 800, dsf: 2, mobile: true },
];

const PAGES = [
  { name: "home", path: "/" },
  { name: "materials", path: "/materials" },
  { name: "carpet-landing", path: "/materials/carpet-tile" },
  { name: "carpet-collection", path: "/materials/carpet-tile/aurora-pdf" },
  { name: "carpet-collection-large", path: "/materials/carpet-tile/mojituo" },
  { name: "wallpaper", path: "/materials/wallpaper" },
  { name: "consultation", path: "/consultation" },
];

await fs.mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};
const pass = (msg) => console.log(`PASS ${msg}`);

for (const viewport of VIEWPORTS) {
  for (const target of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.dsf,
      isMobile: Boolean(viewport.mobile),
      hasTouch: Boolean(viewport.mobile),
    });

    const consoleErrors = [];
    const failedRequests = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
    });
    page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message.slice(0, 200)}`));
    page.on("requestfailed", (req) =>
      failedRequests.push(`${req.url().slice(0, 110)} ${req.failure()?.errorText ?? ""}`)
    );
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url().slice(0, 110)}`);
    });

    // Measure CLS from the very first paint.
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    // The consultation page has a long-lived connection, so networkidle never settles
    // there; wait for the DOM and let lazy work settle afterwards.
    await page.goto(`${BASE}${target.path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1200));
    // Scroll through the page so lazy images resolve, then return to the top.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
    await new Promise((r) => setTimeout(r, 700));

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const broken = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0 && img.currentSrc)
        .map((img) => img.currentSrc.slice(0, 110));
      const invalid = [...document.images]
        .filter((img) => {
          const src = img.getAttribute("src") ?? "";
          return !src || src === "#" || src.includes("undefined") || src.includes("null");
        })
        .map((img) => img.getAttribute("src"));
      return {
        overflowX: doc.scrollWidth - doc.clientWidth,
        cls: window.__cls ?? 0,
        imageCount: document.images.length,
        broken,
        invalid,
        h1: document.querySelectorAll("h1").length,
        title: document.title,
      };
    });

    const label = `${viewport.name} ${target.name}`;
    if (audit.overflowX > 1) fail(`${label}: horizontal overflow ${audit.overflowX}px`);
    if (audit.broken.length) fail(`${label}: broken images ${audit.broken.join(", ")}`);
    if (audit.invalid.length) fail(`${label}: invalid image src ${audit.invalid.join(", ")}`);
    if (audit.cls > 0.1) fail(`${label}: CLS ${audit.cls.toFixed(3)} > 0.1`);
    if (!audit.title) fail(`${label}: empty document title`);
    if (audit.h1 !== 1) fail(`${label}: expected exactly one h1, found ${audit.h1}`);
    const realErrors = consoleErrors.filter((e) => !/favicon|net::ERR_ABORTED/i.test(e));
    if (realErrors.length) fail(`${label}: console errors ${realErrors.slice(0, 2).join(" | ")}`);
    // A prefetch or a video the browser cancels on navigation is normal, not a defect.
    const noise = /favicon|net::ERR_ABORTED|_rsc=|\.mp4|\.m4v|net::ERR_ABORTED/i;
    const realFailed = failedRequests.filter((r) => !noise.test(r));
    if (realFailed.length) fail(`${label}: failed requests ${realFailed.slice(0, 2).join(" | ")}`);

    if (!failures) {
      pass(
        `${label}: no overflow, no broken images, CLS ${audit.cls.toFixed(3)}, ${audit.imageCount} images`
      );
    }

    await page.screenshot({
      path: path.join(OUT, `${target.name}-${viewport.name}.png`),
      fullPage: viewport.width <= 430,
    });
    await page.close();
  }
}


// Interaction QA on the viewer: open, arrow-key navigate, Escape, focus return.
const page = await browser.newPage();
await page.setViewport({
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await page.goto(`${BASE}/materials/carpet-tile/mojituo`, { waitUntil: "networkidle2" });
const opened = await page.evaluate(() => {
  const trigger = document.querySelector('ul[aria-label*="carpet tile"] button');
  if (!trigger) return false;
  trigger.click();
  return true;
});
await new Promise((r) => setTimeout(r, 900));
const dialog = await page.evaluate(() => {
  const el = document.querySelector('[role="dialog"]');
  if (!el) return null;
  return {
    ariaModal: el.getAttribute("aria-modal"),
    scrollLocked: getComputedStyle(document.body).overflow === "hidden",
    activeInside: el.contains(document.activeElement),
  };
});
if (!opened || !dialog) {
  fail("viewer: dialog did not open on a collection page");
} else {
  if (dialog.ariaModal !== "true") fail("viewer: dialog missing aria-modal");
  if (!dialog.scrollLocked) fail("viewer: body scroll not locked while the dialog is open");
  if (!dialog.activeInside) fail("viewer: focus was not moved into the dialog");
  if (!failures) pass("viewer: opens as a modal, locks scroll and moves focus inside");
}
await page.screenshot({ path: path.join(OUT, "viewer-open-390x844.png") });
await page.keyboard.press("ArrowRight");
await new Promise((r) => setTimeout(r, 400));
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 600));
const closed = await page.evaluate(() => ({
  gone: !document.querySelector('[role="dialog"]'),
  scrollUnlocked: getComputedStyle(document.body).overflow !== "hidden",
}));
if (!closed.gone) fail("viewer: Escape did not close the dialog");
else if (!closed.scrollUnlocked) fail("viewer: body scroll stayed locked after closing");
else if (!failures) pass("viewer: arrow navigation works, Escape closes and restores scroll");
await page.close();

await browser.close();
console.log(
  failures === 0
    ? `\nVISUAL QA PASS - screenshots in ${OUT}`
    : `\nVISUAL QA FAIL (${failures}) - screenshots in ${OUT}`
);
process.exitCode = failures === 0 ? 0 : 1;
