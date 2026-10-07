/**
 * scripts/generate-media.mjs
 *
 * Generates the studio's editorial artwork into /public/media.
 *
 * Why generated artwork instead of stock photography:
 *   - every image resolves locally, so a page can never render a broken image,
 *     a grey placeholder box or a third-party CDN failure;
 *   - the artwork is an abstract material and light study, not fabricated client
 *     work, so nothing on the site claims a project that does not exist.
 *
 * Replace any file in /public/media with real photography (same filename) or point
 * Supabase records at Supabase Storage URLs — the UI picks those up automatically.
 *
 * Usage: node scripts/generate-media.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = join(root, "public", "media");
const materialsDir = join(mediaDir, "materials");

const W = 1600;
const H = 1000;

const svg = (body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice">
${body}
</svg>
`;

const grain = (id, base = 0.9, opacity = 0.22) => `  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${base}" numOctaves="4" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
  </filter>
  <rect width="${W}" height="${H}" filter="url(#${id})" opacity="${opacity}" style="mix-blend-mode:soft-light" />`;

const linear = (id, stops) => `  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
${stops.map(([offset, color, opacity = 1]) => `    <stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}" />`).join("\n")}
  </linearGradient>`;

const radial = (id, cx, cy, r, stops) => `  <radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
${stops.map(([offset, color, opacity = 1]) => `    <stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}" />`).join("\n")}
  </radialGradient>`;

/* ------------------------------------------------------------------ *
 * Hero slides
 * ------------------------------------------------------------------ */

function heroOne() {
  const planks = Array.from({ length: 14 }, (_, i) => {
    const y = 620 + i * 28;
    const tone = i % 3 === 0 ? "#2b2723" : "#332e28";
    return `    <rect x="-40" y="${y}" width="${W + 80}" height="26" fill="${tone}" opacity="${0.5 + (i % 2) * 0.12}" />
    <rect x="-40" y="${y + 24}" width="${W + 80}" height="2" fill="#0d0c0b" opacity="0.35" />`;
  }).join("\n");

  return svg(
    `  <defs>
${linear("wall", [["0%", "#4b4238"], ["58%", "#2c2721"], ["100%", "#191614"]])}
${radial("shaft", "68%", "18%", "78%", [["0%", "#f4e2c2", "0.62"], ["45%", "#d9bc8d", "0.18"], ["100%", "#000000", "0"]])}
${linear("floorFade", [["0%", "#0f0e0d", "0"], ["100%", "#0b0a09", "0.85"]])}
${grain("heroOneGrain", 0.85, 0.26)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wall)" />
  <g opacity="0.9">
    <rect x="120" y="90" width="250" height="470" fill="#241f1a" opacity="0.55" />
    <rect x="392" y="60" width="132" height="500" fill="#201c18" opacity="0.45" />
    <rect x="546" y="120" width="88" height="440" fill="#2a241e" opacity="0.4" />
    <rect x="656" y="80" width="300" height="480" fill="#171412" opacity="0.5" />
    <rect x="978" y="140" width="150" height="420" fill="#221d18" opacity="0.45" />
    <rect x="1150" y="96" width="330" height="470" fill="#191512" opacity="0.55" />
  </g>
  <rect width="${W}" height="${H}" fill="url(#shaft)" />
  <g>
${planks}
  </g>
  <rect y="600" width="${W}" height="400" fill="url(#floorFade)" />
  <rect x="0" y="598" width="${W}" height="3" fill="#c9ad82" opacity="0.35" />
  <g opacity="0.5">
    <rect x="1010" y="250" width="2" height="360" fill="#e8d3ae" opacity="0.35" />
    <rect x="1120" y="210" width="2" height="400" fill="#e8d3ae" opacity="0.22" />
    <rect x="1245" y="280" width="2" height="330" fill="#e8d3ae" opacity="0.18" />
  </g>`,
    "Material palette study — warm plaster, limestone and brushed brass"
  );
}

function heroTwo() {
  const bands = [
    ["#efe6d8", 0, 220],
    ["#d8c6ab", 220, 150],
    ["#b99d78", 370, 110],
    ["#8d7454", 480, 130],
    ["#4f4436", 610, 160],
    ["#2a2520", 770, 230],
  ];
  const body = bands
    .map(([color, y, height]) => `  <rect x="0" y="${y}" width="${W}" height="${height}" fill="${color}" />`)
    .join("\n");
  const seams = bands
    .slice(1)
    .map(([, y]) => `  <rect x="0" y="${y}" width="${W}" height="1.5" fill="#ffffff" opacity="0.18" />`)
    .join("\n");

  return svg(
    `  <defs>
${radial("glow2", "24%", "26%", "70%", [["0%", "#fff6e6", "0.55"], ["100%", "#000000", "0"]])}
${linear("shade2", [["0%", "#000000", "0.15"], ["55%", "#000000", "0"], ["100%", "#000000", "0.45"]])}
${grain("heroTwoGrain", 0.75, 0.3)}
  </defs>
${body}
${seams}
  <rect width="${W}" height="${H}" fill="url(#glow2)" />
  <rect width="${W}" height="${H}" fill="url(#shade2)" />
  <g opacity="0.35">
    <rect x="150" y="90" width="1.5" height="820" fill="#ffffff" />
    <rect x="210" y="120" width="1.5" height="780" fill="#ffffff" opacity="0.6" />
    <rect x="1330" y="60" width="1.5" height="880" fill="#ffffff" opacity="0.5" />
  </g>`,
    "Surface study — stone, oak and shadow line detailing"
  );
}

function heroThree() {
  const louvres = Array.from({ length: 26 }, (_, i) => {
    const y = 60 + i * 36;
    return `    <rect x="180" y="${y}" width="${W - 360}" height="15" fill="#efe4d2" opacity="${0.055 + (i % 4) * 0.02}" />
    <rect x="180" y="${y + 15}" width="${W - 360}" height="6" fill="#0a0908" opacity="0.5" />`;
  }).join("\n");

  const streaks = Array.from({ length: 9 }, (_, i) => {
    const x = 220 + i * 150;
    return `    <rect x="${x}" y="0" width="${18 + (i % 3) * 22}" height="${H}" fill="#f2dcb4" opacity="${0.05 + (i % 3) * 0.03}" />`;
  }).join("\n");

  return svg(
    `  <defs>
${linear("dark", [["0%", "#22201d"], ["55%", "#141312"], ["100%", "#0c0b0a"]])}
${linear("lamp", [["0%", "#f6e3bd", "0.5"], ["100%", "#f6e3bd", "0"]])}
${grain("heroThreeGrain", 1.05, 0.24)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#dark)" />
  <g>
${streaks}
  </g>
  <g>
${louvres}
  </g>
  <rect x="180" y="60" width="${W - 360}" height="${H - 120}" fill="none" stroke="#c9ad82" stroke-opacity="0.22" />
  <rect y="${H - 180}" width="${W}" height="180" fill="url(#lamp)" opacity="0.6" />`,
    "Light study — louvred daylight across a quiet interior plane"
  );
}

/* ------------------------------------------------------------------ *
 * Editorial bands
 * ------------------------------------------------------------------ */

function bandLight() {
  return svg(
    `  <defs>
${linear("bl", [["0%", "#f7f2e9"], ["55%", "#e6d9c4"], ["100%", "#cdb996"]])}
${radial("blGlow", "72%", "22%", "80%", [["0%", "#fffaf0", "0.85"], ["100%", "#000000", "0"]])}
${grain("bandLightGrain", 0.7, 0.28)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bl)" />
  <rect width="${W}" height="${H}" fill="url(#blGlow)" />
  <g opacity="0.5">
    <rect x="120" y="140" width="420" height="640" fill="#ffffff" opacity="0.35" />
    <rect x="120" y="140" width="420" height="640" fill="none" stroke="#8d7454" stroke-opacity="0.35" />
    <rect x="600" y="220" width="300" height="560" fill="#b99d78" opacity="0.35" />
    <rect x="960" y="180" width="520" height="600" fill="#4f4436" opacity="0.28" />
    <rect x="960" y="180" width="520" height="600" fill="none" stroke="#ffffff" stroke-opacity="0.3" />
  </g>
  <rect x="0" y="780" width="${W}" height="2" fill="#8d7454" opacity="0.4" />`,
    "Light study — daylight across plaster, stone and ribbed timber surfaces"
  );
}

function bandStone() {
  return svg(
    `  <defs>
${linear("bs", [["0%", "#6d6154"], ["50%", "#4a4238"], ["100%", "#241f1a"]])}
${radial("bsGlow", "34%", "30%", "72%", [["0%", "#f3e0bd", "0.5"], ["100%", "#000000", "0"]])}
${grain("bandStoneGrain", 0.65, 0.3)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bs)" />
  <rect width="${W}" height="${H}" fill="url(#bsGlow)" />
  <g>
    <rect x="0" y="0" width="1200" height="360" fill="#59503f" opacity="0.45" />
    <rect x="0" y="360" width="1200" height="4" fill="#efe0c4" opacity="0.25" />
    <rect x="0" y="364" width="900" height="300" fill="#3c352c" opacity="0.5" />
    <rect x="900" y="364" width="700" height="636" fill="#2b2621" opacity="0.55" />
    <rect x="0" y="664" width="900" height="336" fill="#4c4238" opacity="0.45" />
    <rect x="1180" y="120" width="2" height="760" fill="#efe0c4" opacity="0.25" />
    <rect x="1280" y="180" width="2" height="700" fill="#efe0c4" opacity="0.16" />
  </g>`,
    "Material study — stone, plaster and oak review under studio light"
  );
}

function texturePlaster() {
  return svg(
    `  <defs>
${linear("tp", [["0%", "#efe8dc"], ["50%", "#ded3c2"], ["100%", "#c9bda9"]])}
${radial("tpGlow", "30%", "24%", "76%", [["0%", "#fffdf8", "0.8"], ["100%", "#000000", "0"]])}
${grain("tpGrain", 0.6, 0.34)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#tp)" />
  <rect width="${W}" height="${H}" fill="url(#tpGlow)" />
  <g opacity="0.22" stroke="#8d7454" fill="none">
    <path d="M180 700 C 420 600, 700 760, 980 640 S 1380 560, 1520 660" stroke-width="2" />
    <path d="M120 800 C 380 720, 660 860, 940 760 S 1360 700, 1500 780" stroke-width="1.5" />
    <path d="M260 560 C 520 480, 760 620, 1040 520" stroke-width="1.5" />
  </g>
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#8d7454" stroke-opacity="0.18" stroke-width="2" />`,
    "Plaster texture study"
  );
}

/* ------------------------------------------------------------------ *
 * Collection artwork — one material study per studio collection
 * ------------------------------------------------------------------ */

const wash = (cfg, id) => `  <defs>
${linear(`${id}-wash`, [["0%", cfg.light], ["45%", cfg.base], ["100%", cfg.dark]])}
${radial(`${id}-glow`, "30%", "22%", "78%", [["0%", "#fffaf0", "0.55"], ["100%", "#000000", "0"]])}
${grain(`${id}-grain`, 0.8, 0.24)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}-wash)" />
  <rect width="${W}" height="${H}" fill="url(#${id}-glow)" />`;

const PATTERNS = {
  planks: (cfg) => {
    const rows = Array.from({ length: 16 }, (_, i) => {
      const y = i * 63;
      const tone = i % 4 === 0 ? cfg.dark : i % 3 === 0 ? cfg.alt : cfg.base;
      const streaks = [0, 1, 2]
        .map(
          (s) =>
            `    <rect x="${120 + s * 480 + (i % 5) * 60}" y="${y + 12 + s * 12}" width="${260 - s * 40}" height="1.6" fill="${cfg.light}" opacity="0.22" />`
        )
        .join("\n");
      return `    <rect x="-20" y="${y}" width="${W + 40}" height="61" fill="${tone}" opacity="0.9" />
    <rect x="-20" y="${y + 61}" width="${W + 40}" height="2" fill="${cfg.dark}" opacity="0.55" />
    <rect x="${(i * 337) % W}" y="${y}" width="2" height="61" fill="${cfg.dark}" opacity="0.3" />
${streaks}`;
    }).join("\n");
    return `<g>\n${rows}\n  </g>\n  <rect width="${W}" height="${H}" fill="url(#${cfg.id}-wash)" opacity="0.18" />`;
  },

  tiles: (cfg) => {
    const tiles = [];
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const x = col * 270 + (row % 2 ? 60 : 0);
        const y = row * 148;
        const tone = (row + col) % 3 === 0 ? cfg.alt : cfg.base;
        tiles.push(
          `    <rect x="${x}" y="${y}" width="258" height="136" fill="${tone}" opacity="${0.85 + ((row + col) % 2) * 0.1}" />
    <rect x="${x}" y="${y}" width="258" height="136" fill="none" stroke="${cfg.dark}" stroke-opacity="0.35" />
    <rect x="${x + 8}" y="${y + 8}" width="242" height="120" fill="none" stroke="${cfg.light}" stroke-opacity="0.14" />`
        );
      }
    }
    return `<g>\n${tiles.join("\n")}\n  </g>`;
  },

  flutes: (cfg) => {
    const flutes = Array.from({ length: 22 }, (_, i) => {
      const x = i * 74;
      return `    <rect x="${x}" y="0" width="70" height="${H}" fill="${i % 2 === 0 ? cfg.base : cfg.alt}" opacity="0.92" />
    <rect x="${x}" y="0" width="6" height="${H}" fill="${cfg.light}" opacity="0.4" />
    <rect x="${x + 64}" y="0" width="6" height="${H}" fill="${cfg.dark}" opacity="0.45" />`;
    }).join("\n");
    return `<g>\n${flutes}\n  </g>\n  <rect y="${H - 240}" width="${W}" height="240" fill="${cfg.dark}" opacity="0.35" />`;
  },

  weave: (cfg) => {
    const warp = Array.from({ length: 40 }, (_, i) => {
      const x = i * 41;
      return `    <rect x="${x}" y="0" width="20" height="${H}" fill="${i % 3 === 0 ? cfg.light : cfg.base}" opacity="0.35" />`;
    }).join("\n");
    const weft = Array.from({ length: 26 }, (_, i) => {
      const y = i * 40;
      return `    <rect x="0" y="${y}" width="${W}" height="19" fill="${i % 4 === 0 ? cfg.alt : cfg.dark}" opacity="0.28" />`;
    }).join("\n");
    const motifs = Array.from({ length: 12 }, (_, i) => {
      const x = 90 + (i % 4) * 400;
      const y = 130 + Math.floor(i / 4) * 300;
      return `    <g opacity="0.3" stroke="${cfg.light}" fill="none" stroke-width="2">
      <path d="M${x} ${y} l70 70 l-70 70 l-70 -70 Z" />
      <path d="M${x} ${y + 24} l46 46 l-46 46 l-46 -46 Z" />
    </g>`;
    }).join("\n");
    return `<g>\n${warp}\n${weft}\n${motifs}\n  </g>`;
  },

  folds: (cfg) => {
    const panels = Array.from({ length: 9 }, (_, i) => {
      const x = i * 186;
      return `    <g>
      <rect x="${x}" y="40" width="182" height="${H - 200}" fill="${i % 2 === 0 ? cfg.alt : cfg.base}" />
      <path d="M${x} 40 L${x + 92} 90 L${x + 92} ${H - 150} L${x} ${H - 200} Z" fill="${cfg.light}" opacity="0.16" />
      <rect x="${x}" y="40" width="4" height="${H - 200}" fill="${cfg.dark}" opacity="0.6" />
      <rect x="${x + 178}" y="40" width="4" height="${H - 200}" fill="${cfg.light}" opacity="0.28" />
      <circle cx="${x + 92}" cy="${H - 120}" r="5" fill="${cfg.light}" opacity="0.6" />
    </g>`;
    }).join("\n");
    return `<g>\n${panels}\n  </g>\n  <rect y="0" width="${W}" height="40" fill="${cfg.dark}" opacity="0.5" />\n  <rect y="${H - 160}" width="${W}" height="160" fill="${cfg.dark}" opacity="0.55" />`;
  },

  coffers: (cfg) => {
    const cells = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const x = 40 + col * 310;
        const y = 40 + row * 235;
        cells.push(
          `    <rect x="${x}" y="${y}" width="280" height="205" fill="${(row + col) % 2 ? cfg.base : cfg.alt}" opacity="0.9" />
    <rect x="${x + 34}" y="${y + 28}" width="212" height="149" fill="${cfg.dark}" opacity="0.28" />
    <rect x="${x + 34}" y="${y + 28}" width="212" height="149" fill="none" stroke="${cfg.light}" stroke-opacity="0.6" stroke-width="3" />
    <rect x="${x + 46}" y="${y + 40}" width="188" height="125" fill="${cfg.light}" opacity="0.22" />`
        );
      }
    }
    return `<g>\n${cells.join("\n")}\n  </g>`;
  },

  blinds: (cfg) => {
    const slats = Array.from({ length: 30 }, (_, i) => {
      const y = i * 34;
      return `    <rect x="0" y="${y}" width="${W}" height="24" fill="${i % 2 ? cfg.alt : cfg.base}" opacity="0.95" />
    <rect x="0" y="${y + 24}" width="${W}" height="10" fill="${cfg.dark}" opacity="0.4" />
    <rect x="0" y="${y}" width="${W}" height="3" fill="${cfg.light}" opacity="0.35" />`;
    }).join("\n");
    const lightWash = `  <linearGradient id="blindsLight" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
    <stop offset="60%" stop-color="#ffffff" stop-opacity="0.05" />
    <stop offset="100%" stop-color="#000000" stop-opacity="0.15" />
  </linearGradient>`;
    return `<defs>${lightWash}</defs>\n  <g>\n${slats}\n  </g>\n  <rect width="${W}" height="${H}" fill="url(#blindsLight)" />`;
  },

  facets: (cfg) => {
    const triangles = [];
    const step = 130;
    for (let row = 0; row < Math.ceil(H / step) + 1; row += 1) {
      for (let col = 0; col < Math.ceil(W / step) + 1; col += 1) {
        const x = col * step;
        const y = row * step;
        const up = (row + col) % 2 === 0;
        triangles.push(
          up
            ? `    <path d="M${x} ${y + step} L${x + step / 2} ${y} L${x + step} ${y + step} Z" fill="${cfg.base}" opacity="0.9" />
    <path d="M${x} ${y + step} L${x + step / 2} ${y} L${x + step / 2} ${y + step} Z" fill="${cfg.light}" opacity="0.18" />`
            : `    <path d="M${x} ${y} L${x + step} ${y} L${x + step / 2} ${y + step} Z" fill="${cfg.alt}" opacity="0.9" />
    <path d="M${x} ${y} L${x + step / 2} ${y + step} L${x} ${y} Z" fill="${cfg.dark}" opacity="0.25" />`
        );
      }
    }
    return `<g>\n${triangles.join("\n")}\n  </g>`;
  },

  blades: (cfg) => {
    const blades = Array.from({ length: 150 }, (_, i) => {
      const x = (i * 23) % W;
      const height = 190 + ((i * 37) % 250);
      const y = H - height - ((i * 53) % 130);
      const tone = i % 5 === 0 ? cfg.light : i % 3 === 0 ? cfg.alt : cfg.base;
      return `    <path d="M${x} ${y + height} C ${x - 12} ${y + height * 0.6} ${x + 6} ${y + height * 0.25} ${x + 2} ${y} L ${x + 12} ${y} C ${x + 16} ${y + height * 0.3} ${x + 26} ${y + height * 0.7} ${x + 14} ${y + height} Z" fill="${tone}" opacity="0.85" />`;
    }).join("\n");
    return `<g>\n${blades}\n  </g>\n  <rect y="${H - 120}" width="${W}" height="120" fill="${cfg.dark}" opacity="0.45" />`;
  },
};

function materialArt(config) {
  const cfg = { ...config, id: config.slug };
  return svg(`  ${wash(cfg, cfg.slug)}\n  ${PATTERNS[cfg.pattern](cfg)}`, cfg.label);
}

/* ------------------------------------------------------------------ *
 * Social card + favicon
 * ------------------------------------------------------------------ */

function openGraph() {
  const w = 1200;
  const h = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="HOME INTERIOR — Karachi, bespoke living studio">
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1b1917" />
      <stop offset="60%" stop-color="#121214" />
      <stop offset="100%" stop-color="#2a231c" />
    </linearGradient>
    <radialGradient id="ogglow" cx="78%" cy="18%" r="70%">
      <stop offset="0%" stop-color="#e7cfa2" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#ogbg)" />
  <rect width="${w}" height="${h}" fill="url(#ogglow)" />
  <g opacity="0.5">
    <rect x="80" y="120" width="240" height="390" fill="#2c2620" />
    <rect x="340" y="170" width="150" height="340" fill="#3a322a" />
    <rect x="510" y="140" width="90" height="370" fill="#241f1a" />
    <rect x="720" y="200" width="400" height="310" fill="#1a1715" />
  </g>
  <circle cx="120" cy="96" r="26" fill="none" stroke="#c5a880" stroke-opacity="0.65" />
  <text x="120" y="107" fill="#f6efe4" font-family="Georgia, 'Times New Roman', serif" font-size="30" text-anchor="middle">H</text>
  <text x="80" y="430" fill="#f8f4ec" font-family="Georgia, 'Times New Roman', serif" font-size="72" letter-spacing="9">HOME INTERIOR</text>
  <text x="84" y="480" fill="#c5a880" font-family="Helvetica, Arial, sans-serif" font-size="21" letter-spacing="8">KARACHI — BESPOKE LIVING STUDIO</text>
  <rect x="80" y="516" width="1040" height="1" fill="#ffffff" opacity="0.18" />
  <text x="80" y="566" fill="#cfc7bb" font-family="Helvetica, Arial, sans-serif" font-size="21">Bespoke interiors · Materials · Architectural finishes</text>
</svg>
`;
}

function icon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="HOME INTERIOR monogram">
  <rect width="64" height="64" rx="14" fill="#121214" />
  <circle cx="32" cy="32" r="21" fill="none" stroke="#c5a880" stroke-width="1.4" />
  <path d="M25 22v20M39 22v20M25 32h14" stroke="#f6efe4" stroke-width="2.2" fill="none" />
</svg>
`;
}

/* ------------------------------------------------------------------ *
 * Collections + write
 * ------------------------------------------------------------------ */

const MATERIALS = [
  { slug: "laminate-flooring", label: "Laminate flooring material study", pattern: "planks", light: "#c39c6d", base: "#8a6c4a", alt: "#6f5638", dark: "#3c2f21" },
  { slug: "spc-flooring", label: "SPC flooring material study", pattern: "tiles", light: "#9c968e", base: "#5f5c58", alt: "#47443f", dark: "#2a2825" },
  { slug: "vinyl-flooring", label: "Vinyl flooring material study", pattern: "planks", light: "#d9cbb6", base: "#b7a58e", alt: "#9c8b74", dark: "#6c5f4c" },
  { slug: "pvc-wall-panel", label: "PVC wall panel material study", pattern: "flutes", light: "#eee8dc", base: "#cbbfae", alt: "#b3a693", dark: "#7c7263" },
  { slug: "wallpaper", label: "Wallpaper material study", pattern: "weave", light: "#ded1bd", base: "#b9a88f", alt: "#a2907a", dark: "#6f6152" },
  { slug: "folding-door", label: "Folding door material study", pattern: "folds", light: "#c2a97c", base: "#3d3427", alt: "#4a3f2f", dark: "#221c14" },
  { slug: "gypsum-false-ceiling", label: "Gypsum false ceiling material study", pattern: "coffers", light: "#fbf8f3", base: "#e2dbd0", alt: "#cfc6b8", dark: "#9d9486" },
  { slug: "window-blinds", label: "Window blinds material study", pattern: "blinds", light: "#f0e9dc", base: "#b6ac9c", alt: "#9d9280", dark: "#5f5648" },
  { slug: "3d-wall-picture", label: "3D wall panel material study", pattern: "facets", light: "#d8cdbb", base: "#8f8375", alt: "#6f6558", dark: "#3a342b" },
  { slug: "artificial-grass", label: "Artificial grass material study", pattern: "blades", light: "#9fb27e", base: "#5a6b47", alt: "#46573a", dark: "#2b3524" },
];

mkdirSync(materialsDir, { recursive: true });

const files = [
  ["hero-01.svg", heroOne()],
  ["hero-02.svg", heroTwo()],
  ["hero-03.svg", heroThree()],
  ["band-light.svg", bandLight()],
  ["band-stone.svg", bandStone()],
  ["texture-plaster.svg", texturePlaster()],
  ["og.svg", openGraph()],
];

files.forEach(([name, content]) => writeFileSync(join(mediaDir, name), content, "utf8"));
MATERIALS.forEach((material) =>
  writeFileSync(join(materialsDir, `${material.slug}.svg`), materialArt(material), "utf8")
);
writeFileSync(join(root, "public", "icon.svg"), icon(), "utf8");

console.log(
  `[home-interior] wrote ${files.length} editorial images, ${MATERIALS.length} collection studies and 1 favicon to public/media.`
);




