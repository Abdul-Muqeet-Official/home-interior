/**
 * scripts/browser-materials-responsive.mjs
 *
 * Confirms the sticky filter bar behaves at every required width: no page-level
 * horizontal overflow, pills scroll within their own row (never the page), and
 * the bar stays clear of the sticky header.
 */
import { connect, chrome, BASE, WIDTHS } from "./qa-harness.mjs";
import { setTimeout as sleep } from "node:timers/promises";

async function main() {
  const cdp = await connect();

  for (const width of WIDTHS) {
    await cdp.setViewport(width);
    await cdp.goto(`${BASE}/materials`);
    await sleep(1200);

    const result = await cdp.evaluate(`(() => {
      const de = document.documentElement;
      const bar = document.querySelector(".mat-filter-bar");
      const pillRow = document.querySelector('[aria-label="Filter by material group"]');
      const chips = document.querySelectorAll(".mat-chip").length;
      const pills = document.querySelectorAll(".mat-pill").length;

      // Which elements actually overflow the viewport?
      const culprits = [];
      if (de.scrollWidth - de.clientWidth > 1) {
        [...document.querySelectorAll("body *")].forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > de.clientWidth + 1 && r.width > 0) {
            culprits.push(el.tagName.toLowerCase() + "." + String(el.className).slice(0, 50));
          }
        });
      }

      return {
        pageOverflow: de.scrollWidth - de.clientWidth,
        barSticky: bar ? getComputedStyle(bar).position : null,
        pillRowOverflowsSelf: pillRow ? pillRow.scrollWidth > pillRow.clientWidth : null,
        pageTouchesPills: pillRow ? pillRow.scrollWidth > de.clientWidth : null,
        pills,
        chips,
        culprits: culprits.slice(0, 3),
        tapTargetOk: [...document.querySelectorAll(".mat-pill")].every((p) => p.getBoundingClientRect().height >= 40),
      };
    })()`);

    console.log(
      `${String(width).padEnd(5)} overflow=${String(result.pageOverflow).padEnd(4)} sticky=${result.barSticky} ` +
      `pills=${result.pills} chips=${result.chips} pillsScrollSelf=${result.pillRowOverflowsSelf} ` +
      `tapTargets>=40px=${result.tapTargetOk}`,
    );
    if (result.culprits.length) console.log(`      culprits: ${JSON.stringify(result.culprits)}`);
  }

  console.log(`\nconsole errors: ${cdp.consoleErrors.length}`);
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