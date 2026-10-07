import { readFileSync } from "fs";
import { get } from "http";

const ROOT = "http://localhost:3000";

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    get(ROOT + path, { headers: { "User-Agent": "node" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    }).on("error", reject);
  });
}

const results = [];

async function check() {
  const { status, body } = await fetchUrl("/");

  const checks = [
    ["logo in header", body.includes("/brand/logo.png")],
    ["hero editorial photo", body.includes("/media/photos/hero-01.jpg")],
    ["materials photos", body.includes("/media/photos/laminate-flooring.jpg")],
    ["CURATED COLLECTION 2026", body.includes("CURATED COLLECTION 2026")],
    ["no Architectural Digest", !body.includes("Architectural")],
    ["HOME INTERIOR brand", body.includes("HOME INTERIOR")],
    ["BESPOKES LIVING STUDIO", body.includes("BESPOK")],
    ["address BADAR COMMERCIAL", body.includes("BADAR COMMERCIAL")],
    ["DHA PHASE 5", body.includes("DHA PHASE 5")],
    ["phone number", body.includes("+92 300 1234567")],
    ["whatsapp link", body.includes("wa.me/923032566212")],
    ["copyright ALL RIGHTS", body.includes("ALL RIGHTS RESERVED")],
    ["no HomeInteriorKarachi", !body.includes("HomeInteriorKarachi")],
    ["no fake project count 100+", !/100\+/.test(body)],
  ];

  let pass = 0;
  let fail = 0;
  for (const [name, ok] of checks) {
    results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);
    if (ok) pass++;
    else fail++;
  }

  results.push(`\nSummary: ${pass} passed, ${fail} failed (HTTP ${status})`);

  // Asset checks
  const assets = [
    "/brand/logo.png",
    "/brand/logo.webp",
    "/brand/favicon-64.png",
    "/brand/apple-icon-180.png",
    "/brand/icon-512.png",
    "/media/photos/hero-01.jpg",
    "/media/photos/laminate-flooring.jpg",
    "/media/photos/work-featured.jpg",
    "/media/photos/services.jpg",
  ];

  for (const a of assets) {
    try {
      const r = await fetchUrl(a);
      results.push(`ASSET  ${r.status === 200 ? "PASS" : "FAIL"}  ${a} (${r.status})`);
    } catch (e) {
      results.push(`ASSET  FAIL  ${a} (error: ${e.message})`);
    }
  }

  // Route checks
  const routes = ["/", "/philosophy", "/materials", "/our-work", "/reviews", "/services", "/consultation"];
  for (const r of routes) {
    const res = await fetchUrl(r);
    results.push(`ROUTE  ${res.status === 200 ? "PASS" : "FAIL"}  ${r} -> ${res.status}`);
  }

  console.log(results.join("\n"));
}

check().catch((e) => console.error("FATAL:", e));
