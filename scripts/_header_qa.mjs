/**
 * scripts/_header_qa.mjs — temporary CDP driver (no packages).
 * Usage: node scripts/_header_qa.mjs <url> <width> <height> <outPng> <outJson>
 * Captures a screenshot + layout metrics of the rendered page.
 */
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const [url, w, h, outPng, outJson] = process.argv.slice(2);
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), "hdr-qa-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${w},${h}`,
  "--disable-gpu",
  "--no-first-run",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(400);
  }
  throw new Error("chrome devtools endpoint not reachable");
}

const ws = new WebSocket(await getWsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg.method);
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: Number(w), height: Number(h), deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });

/* wait for load event, then settle */
for (let i = 0; i < 40 && !events.includes("Page.loadEventFired"); i++) await sleep(300);
await sleep(3500); /* hydration + fonts + images */

const metrics = await send("Runtime.evaluate", {
  expression: `(() => {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav[aria-label=\"Primary\"]');
    const items = nav ? Array.from(nav.querySelectorAll(':scope > a, :scope > button')) : [];
    const navInfo = items.map((el) => {
      const r = el.getBoundingClientRect();
      return { t: el.textContent.trim().replace(/\\s+/g,' '), h: Math.round(r.height), w: Math.round(r.width), wrapped: r.height > 25 };
    });
    const cta = Array.from(document.querySelectorAll('header a')).find((a) => a.getAttribute('href') === '/consultation');
    const cr = cta ? cta.getBoundingClientRect() : null;
    const img = document.querySelector('header img');
    const ir = img ? img.getBoundingClientRect() : null;
    const brand = document.querySelector('header a[aria-label]');
    const br = brand ? brand.getBoundingClientRect() : null;
    const row = header ? header.firstElementChild : null;
    const rr = row ? row.getBoundingClientRect() : null;
    const heroH1 = document.querySelector('h1');
    return {
      headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
      rowH: rr ? Math.round(rr.height) : null,
      rowPadY: rr ? getComputedStyle(row).paddingTop + '/' + getComputedStyle(row).paddingBottom : null,
      navW: nav ? Math.round(nav.getBoundingClientRect().width) : null,
      nav: navInfo,
      ctaW: cr ? Math.round(cr.width) : null,
      ctaH: cr ? Math.round(cr.height) : null,
      logoW: ir ? Math.round(ir.width) : null,
      logoH: ir ? Math.round(ir.height) : null,
      brandW: br ? Math.round(br.width) : null,
      brandH: br ? Math.round(br.height) : null,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      heroH1Top: heroH1 ? Math.round(heroH1.getBoundingClientRect().top) : null,
      heroH1Text: heroH1 ? heroH1.textContent.trim().slice(0, 40) : null,
    };
  })()`,
  returnByValue: true,
});

/* Runtime.evaluate with returnByValue nests the payload: response.result.result.value */
const value = metrics.result?.result?.value ?? { error: "no metrics", raw: metrics.result?.result ?? metrics };
writeFileSync(outJson, JSON.stringify(value, null, 2));
console.log(JSON.stringify(value));

let shot = await send("Page.captureScreenshot", { format: "png" });
if (!shot.result?.data) {
  console.error("capture retry:", JSON.stringify(shot.error ?? shot).slice(0, 300));
  await sleep(1200);
  shot = await send("Page.captureScreenshot", { format: "png" });
}
if (shot.result?.data) writeFileSync(outPng, Buffer.from(shot.result.data, "base64"));
else console.error("capture failed:", JSON.stringify(shot.error ?? shot).slice(0, 300));
ws.close();
chrome.kill();
process.exit(0);
