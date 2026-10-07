import { connect } from "./qa-harness.mjs";

async function main() {
  const cdp = await connect();
  await cdp.setViewport(1440);
  await cdp.goto("http://localhost:3000/");
  const buttons = await cdp.evaluate(`
    Array.from(document.querySelectorAll("button, a")).map(el => ({
      tag: el.tagName,
      text: (el.textContent || "").trim(),
      ariaLabel: el.getAttribute("aria-label"),
      classes: el.className
    })).filter(x => x.text || x.ariaLabel)
  `);
  console.log("Total interactive elements:", buttons.length);
  const searchMatches = buttons.filter(x => /search/i.test(x.text) || /search/i.test(x.ariaLabel || ""));
  console.log("Search matches:", searchMatches);
}

main().catch(console.error);
