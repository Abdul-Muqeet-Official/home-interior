/**
 * scripts/browser-qa.mjs
 *
 * Real headless-browser QA over the Chrome DevTools Protocol.
 * Uses Node's built-in WebSocket (Node 22+), so no new dependency is added.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import os from "node:os";
import path from "node:path";

const BASE = process.env.QA_BASE ?? "http://localhost:3111";
const CHROME =
  process.env.QA_CHROME ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.QA_PORT ?? 9333);
// An absolute profile path outside the repo: Chrome will not expose the
// debugging port reliably for a relative/workspace profile directory.
const PROFILE = path.join(os.tmpdir(), "home-interior-qa-chrome");

export const WIDTHS = [360, 390, 414, 768, 1024, 1280, 1440, 1920];

export const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-sync",
  "--no-sandbox",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--hide-scrollbars",
  "--window-size=1440,900",
  "about:blank",
], { stdio: "ignore" });

export async function targets() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint did not become available");
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.consoleErrors = [];
    this.exceptions = [];
    this.failedRequests = [];
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
        return;
      }
      this.onEvent(msg);
    });
  }

  onEvent(msg) {
    if (msg.method === "Runtime.consoleAPICalled" && ["error", "assert"].includes(msg.params.type)) {
      this.consoleErrors.push(
        msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "),
      );
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      this.exceptions.push(d?.exception?.description ?? d?.text ?? "exception");
    }
    if (msg.method === "Network.loadingFailed") {
      // Media aborts triggered by our own IntersectionObserver are expected.
      if (msg.params.errorText === "net::ERR_ABORTED") return;
      this.failedRequests.push(`${msg.params.type} ${msg.params.errorText}`);
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 90000);
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text ?? "evaluate failed");
    return res.result.value;
  }

  async goto(url) {
    this.reset();
    await this.send("Page.navigate", { url });
    await sleep(2200);
  }

  async setViewport(width, height = 900) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(400);
  }

  reset() {
    this.consoleErrors = [];
    this.exceptions = [];
    this.failedRequests = [];
  }
}


const OVERFLOW_PROBE = `(() => {
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  let culprits = [];
  if (overflow > 1) {
    const limit = de.clientWidth;
    culprits = [...document.querySelectorAll("body *")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, right: r.right, width: r.width };
      })
      .filter((x) => x.right > limit + 1 && x.width > 0)
      .slice(0, 5)
      .map((x) => ({
        tag: x.el.tagName.toLowerCase(),
        cls: (x.el.className || "").toString().slice(0, 90),
        right: Math.round(x.right),
        width: Math.round(x.width),
        text: (x.el.textContent || "").trim().slice(0, 40),
      }));
  }
  return { overflow, clientWidth: de.clientWidth, scrollWidth: de.scrollWidth, culprits };
})()`;
export async function connect() {
  const page = await targets();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });


  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  return cdp;
}


async function main() {
  const cdp = await connect();

  console.log("=== RESPONSIVE: horizontal overflow per viewport ===");
  for (const route of ["/", "/materials", "/our-work", "/materials/wallpaper"]) {
    console.log(`\n-- ${route}`);
    for (const width of WIDTHS) {
      await cdp.setViewport(width);
      await cdp.goto(BASE + route);
      const r = await cdp.evaluate(OVERFLOW_PROBE);
      const status = r.overflow > 1 ? `OVERFLOW +${r.overflow}px` : "ok";
      console.log(`   ${String(width).padEnd(5)} ${status.padEnd(16)} scrollW=${r.scrollWidth} clientW=${r.clientWidth}`);
      for (const c of r.culprits) {
        console.log(`        <- <${c.tag}> right=${c.right} w=${c.width} cls="${c.cls}" text="${c.text}"`);
      }
    }
  }

  console.log("\n=== CONSOLE / NETWORK on / (1440) ===");
  await cdp.setViewport(1440);
  await cdp.goto(BASE + "/");
  console.log("console errors:", cdp.consoleErrors.length, cdp.consoleErrors.slice(0, 8));
  console.log("exceptions     :", cdp.exceptions.length, cdp.exceptions.slice(0, 5));
  console.log("failed requests:", cdp.failedRequests.length, cdp.failedRequests.slice(0, 8));

  console.log("\n=== OUR WORK VIDEOS ===");
  await cdp.goto(BASE + "/our-work");
  const videos = await cdp.evaluate(`(() => {
    const vs = [...document.querySelectorAll("video")];
    const srcOf = (v) => v.currentSrc || v.getAttribute("src") || v.dataset.src || "";
    return {
      totalVideoElements: vs.length,
      attachedSrc: vs.filter((v) => v.currentSrc || v.getAttribute("src")).length,
      pendingViaDataSrc: vs.filter((v) => v.dataset.src && !v.getAttribute("src")).length,
      uniqueSources: [...new Set(vs.map(srcOf))].filter(Boolean).length,
      lcdMatches: vs.filter((v) => /lcd/i.test(srcOf(v))).length,
      sample: [...new Set(vs.map(srcOf))].filter(Boolean).slice(0, 5),
    };
  })()`);
  console.log(JSON.stringify(videos, null, 2));

  console.log("\n=== SEARCH OVERLAY (recommendations before typing) ===");
  for (const width of [1440, 390]) {
    await cdp.setViewport(width);
    await cdp.goto(BASE + "/");
    const opened = await cdp.evaluate(`(() => {
      const btn = [...document.querySelectorAll("button,a")].find(
        (b) => /^search$/i.test((b.textContent || "").trim()) || /search/i.test(b.getAttribute("aria-label") || "")
      );
      if (!btn) return { ok: false, reason: "no search control found" };
      btn.click();
      return { ok: true, label: (btn.textContent || btn.getAttribute("aria-label") || "").trim() };
    })()`);
    await sleep(1800);
    const state = await cdp.evaluate(`(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { open: false };
      const headings = [...dialog.querySelectorAll("h3")].map((h) => h.textContent.trim());
      const links = [...dialog.querySelectorAll("a")].map((a) => ({
        text: a.textContent.trim().slice(0, 34),
        href: new URL(a.href).pathname,
      }));
      const input = dialog.querySelector("input");
      return {
        open: true,
        inputFocused: document.activeElement === input,
        inputValue: input ? input.value : null,
        hasRecommendedHeading: headings.some((h) => /recommended/i.test(h)),
        headings,
        linkCount: links.length,
        sampleLinks: links.slice(0, 5),
      };
    })()`);
    console.log(`\n-- width ${width} clicked=${JSON.stringify(opened)}`);
    console.log("   " + JSON.stringify(state, null, 2).replace(/\n/g, "\n   "));

    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await sleep(500);
    console.log("    ESC closed overlay:", await cdp.evaluate(`!document.querySelector('[role="dialog"]')`));
  }


  console.log("\n=== WATERFALL / RESOURCE SUMMARY (/) ===");
  await cdp.setViewport(1440);
  await cdp.goto(BASE + "/");
  const perf = await cdp.evaluate(`(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const res = performance.getEntriesByType("resource");
    const byType = {};
    for (const r of res) {
      const kind = r.initiatorType || "other";
      byType[kind] = (byType[kind] || 0) + 1;
    }
    const videos = res.filter((r) => /\\.mp4|video/.test(r.name));
    const imgs = res.filter((r) => r.initiatorType === "img" || /_next\\/image/.test(r.name));
    const slowest = [...res].sort((a, b) => b.duration - a.duration).slice(0, 5)
      .map((r) => ({ name: r.name.slice(-66), ms: Math.round(r.duration), kb: Math.round((r.transferSize || 0) / 1024) }));
    const seen = new Map();
    for (const r of res) seen.set(r.name, (seen.get(r.name) || 0) + 1);
    return {
      ttfbMs: Math.round(nav.responseStart || 0),
      domInteractiveMs: Math.round(nav.domInteractive || 0),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
      loadMs: Math.round(nav.loadEventEnd || 0),
      totalRequests: res.length,
      byType,
      imageRequests: imgs.length,
      imageKb: Math.round(imgs.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
      videoRequests: videos.length,
      videoKb: Math.round(videos.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
      supabaseRequests: res.filter((r) => /supabase/.test(r.name)).length,
      duplicateUrls: [...seen.entries()].filter(([, n]) => n > 1).length,
      slowest,
    };
  })()`);
  console.log(JSON.stringify(perf, null, 2));

  cdp.ws.close();
  chrome.kill();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("QA FAILED:", error);
    chrome.kill();
    process.exit(1);
  });
