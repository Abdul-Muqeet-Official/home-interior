import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function wire(filePath, regex, replacement) {
  const p = path.join(ROOT, filePath);
  let s = fs.readFileSync(p, "utf8");

  if (!s.includes("import Image from")) {
    s = s.replace(
      "import Link from \"next/link\";",
      "import Image from \"next/image\";\nimport Link from \"next/link\";"
    );
  }

  if (regex.test(s)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync(p, s, "utf8");
    console.log("[wire] " + filePath + ": monogram replaced with logo image");
    return true;
  }

  const idx = s.indexOf("{SITE.monogram}");
  if (idx >= 0) {
    console.log("[wire] " + filePath + ": regex did not match - context:");
    console.log(JSON.stringify(s.substring(idx - 200, idx + 50)));
  } else {
    console.log("[wire] " + filePath + ": {SITE.monogram} not found");
  }
  return false;
}

wire(
  "components/ui/Header.tsx",
  /<span\s+aria-hidden="true"\s+className=\{cx\(\s*"[^"]*rounded-full[^"]*",\s*[^)]*\)\}\s*>\s*\{SITE\.monogram\}\s*<\/span>/,
  '<span className="relative flex h-10 w-10 shrink-0 items-center justify-center">' +
    '<Image src="/brand/logo.png" alt="HOME INTERIOR mark" width={40} height={40} className={cx("transition-opacity duration-300", overHero ? "opacity-90" : "opacity-100")} />' +
    "</span>"
);

wire(
  "components/ui/Footer.tsx",
  /<span\s+aria-hidden="true"\s+className="[^"]*rounded-full[^"]*"\s*>\s*\{SITE\.monogram\}\s*<\/span>/,
  "<Image src=\"/brand/logo.png\" alt=\"HOME INTERIOR\" width={44} height={44} className=\"object-contain\" />"
);

console.log("[wire] Done.");
