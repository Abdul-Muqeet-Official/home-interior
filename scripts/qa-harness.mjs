/**
 * scripts/qa-harness.mjs
 *
 * Shared headless-Chrome harness driven over the Chrome DevTools Protocol.
 * Uses Node's built-in WebSocket (Node 22+), so no new dependency is added.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import os from "node:os";
import path from "node:path";

export const BASE = process.env.QA_BASE ?? "http://localhost:3111";
const CHROME =
  process.env.QA_CHROME ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.QA_PORT ?? 9333);
// An absolute profile path outside the repo: Chrome does not expose the
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
  for (let i = 0; i < 80; i++) {
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
    if (res.exceptionDetails) {
      const d = res.exceptionDetails;
      throw new Error(
        `evaluate failed: ${d.exception?.description ?? d.text ?? "unknown"}`,
      );
    }
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

/** Types into a React-controlled input so onChange actually fires. */
export const TYPE_INTO = (selector, value) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`;

