/**
 * scripts/_verify_routes.mjs
 * Read-only route verification against a running server (default http://localhost:3000).
 * Checks status codes, 404 behaviour, the Materials rail contents, Our Work pricing
 * firewall and the admin authorisation boundary. Never writes anything.
 */

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3000";
let failures = 0;

async function check(label, path, { expect, contains, missing, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : undefined,
  });
  const status = res.status;
  const body = res.status < 400 || res.status === 404 ? await res.text() : "";
  const notes = [];

  if (expect !== undefined) {
    const ok = Array.isArray(expect) ? expect.includes(status) : status === expect;
    if (!ok) {
      notes.push(`EXPECTED ${expect} got ${status}`);
      failures++;
    }
  }

  for (const needle of contains ?? []) {
    if (!body.toLowerCase().includes(needle.toLowerCase())) {
      notes.push(`MISSING TEXT: ${needle}`);
      failures++;
    }
  }

  for (const needle of missing ?? []) {
    if (body.toLowerCase().includes(needle.toLowerCase())) {
      notes.push(`FORBIDDEN TEXT PRESENT: ${needle}`);
      failures++;
    }
  }

  const ok = notes.length === 0;
  console.log(`${ok ? "PASS" : "FAIL"}  ${String(status).padEnd(4)} ${label}`);
  notes.forEach((note) => console.log(`        ${note}`));
  return { status, body };
}

console.log(`=== PUBLIC CATALOGUE (${BASE}) ===`);
await check("GET /materials", "/materials", {
  expect: 200,
  contains: ["False Ceiling", "Explore collection"],
});
await check("GET /materials/false-ceiling", "/materials/false-ceiling", {
  expect: 200,
  contains: ["False Ceiling", "Product collection"],
});
await check("GET /materials/not-real -> 404", "/materials/not-real", { expect: 404 });
await check("GET /materials/spc", "/materials/spc", { expect: [200, 308] });
await check("GET /products/[valid]", "/products/vinyl-flooring-sample-01", {
  expect: [200, 404],
});
await check("GET /products/not-real -> 404", "/products/not-real", { expect: 404 });

console.log("\n=== OUR WORK PRICING FIREWALL ===");
const ourWork = await check("GET /our-work", "/our-work", { expect: 200 });
await check("GET /our-work has no PKR", "/our-work", { missing: ["PKR", "price on consultation", "/ sq ft"] });

console.log("\n=== ADMIN AUTH BOUNDARY (no session cookie) ===");
await check("GET /api/admin/products -> 401", "/api/admin/products", { expect: 401 });
await check("GET /api/admin/categories -> 401", "/api/admin/categories", { expect: 401 });
await check("GET /api/admin/media -> 401", "/api/admin/media", { expect: 401 });
await check("POST /api/admin/products -> 401", "/api/admin/products", { expect: 401 });
await check("GET /admin -> redirect to login", "/admin", { expect: [302, 307, 308] });

console.log("\n=== FORGED COOKIE MUST BE REJECTED ===");
await check("GET /api/admin/products (forged cookie) -> 401", "/api/admin/products", {
  expect: 401,
  cookie: "hi_admin_session=forged.jwt.value",
});
await check("GET /admin (forged cookie) -> redirect", "/admin", {
  expect: [302, 307, 308],
  cookie: "hi_admin_session=forged.jwt.value",
});

console.log("\n=== LOGIN SURFACE IS PUBLIC ===");
await check("GET /admin/login", "/admin/login", { expect: 200 });

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
