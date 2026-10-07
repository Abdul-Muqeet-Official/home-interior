const fs = require('fs');
const path = require('path');
const R = { brandLogo: '', header: '', footer: '', icons: '', errors: [] };
try {
  // A. Shared logo component (known-good, overwritten idempotently)
  const bl = 'import Image from "next/image";\n\nexport default function BrandLogo({ className = "h-12 w-auto" }: { className?: string }) {\n  return (\n    <Image\n      src="/brand/logo.png"\n      alt="HOME INTERIOR \u2014 Interior & Designs"\n      width={392}\n      height={320}\n      className={className}\n      sizes="(max-width: 768px) 150px, 220px"\n    />\n  );\n}\n';
  fs.writeFileSync('components/ui/BrandLogo.tsx', bl);
  R.brandLogo = 'written';

  const addImport = (src) => {
    if (src.includes('BrandLogo from')) return src;
    const i = src.indexOf('import ');
    const e = src.indexOf('\n', i);
    return src.slice(0, e + 1) + 'import BrandLogo from "@/components/ui/BrandLogo";\n' + src.slice(e + 1);
  };

  // B. Header: replace the brand Link (must contain a brand marker)
  let h = fs.readFileSync('components/ui/Header.tsx', 'utf8');
  if (h.includes('<BrandLogo')) R.header = 'already-wired';
  else {
    const ls = h.indexOf('<Link href="/"');
    const le = ls === -1 ? -1 : h.indexOf('</Link>', ls);
    if (ls === -1 || le === -1) { R.header = 'FAIL: brand Link not found'; R.errors.push('header'); }
    else {
      const span = h.slice(ls, le + 7);
      if (!/Interior|monogram|<svg/i.test(span)) { R.header = 'FAIL: first href=/ Link lacks brand marker'; R.spanPreview = span.slice(0, 180); R.errors.push('header-marker'); }
      else {
        h = addImport(h);
        const ls2 = h.indexOf('<Link href="/"');
        const le2 = h.indexOf('</Link>', ls2);
        const rep = '<Link href="/" aria-label="HOME INTERIOR \u2014 home" className="group flex shrink-0 items-center">\n        <BrandLogo className="h-10 w-auto transition-opacity duration-300 group-hover:opacity-80 md:h-12" />\n      </Link>';
        h = h.slice(0, ls2) + rep + h.slice(le2 + 7);
        fs.writeFileSync('components/ui/Header.tsx', h);
        R.header = 'replaced';
      }
    }
  }

  // C. Footer: replace the monogram svg that sits before the brand text
  let f = fs.readFileSync('components/ui/Footer.tsx', 'utf8');
  if (f.includes('<BrandLogo')) R.footer = 'already-wired';
  else {
    const hi = f.indexOf('HOME INTERIOR');
    if (hi === -1) { R.footer = 'FAIL: brand text not found'; R.errors.push('footer-text'); }
    else {
      const s = f.lastIndexOf('<svg', hi);
      const e = s === -1 ? -1 : f.indexOf('</svg>', s);
      if (s === -1 || e === -1 || e > hi) R.footer = 'left-unchanged: no monogram svg before brand text';
      else {
        f = addImport(f);
        const hi2 = f.indexOf('HOME INTERIOR');
        const s2 = f.lastIndexOf('<svg', hi2);
        const e2 = f.indexOf('</svg>', s2);
        f = f.slice(0, s2) + '<BrandLogo className="h-14 w-auto md:h-16" />' + f.slice(e2 + 6);
        fs.writeFileSync('components/ui/Footer.tsx', f);
        R.footer = 'replaced';
      }
    }
  }

  // D. Icon conventions from client-logo derivatives
  const brand = 'public/brand';
  let note = [];
  if (fs.existsSync(path.join(brand, 'favicon-64.png'))) { fs.copyFileSync(path.join(brand, 'favicon-64.png'), 'app/icon.png'); note.push('app/icon.png'); }
  if (fs.existsSync(path.join(brand, 'apple-180.png'))) { fs.copyFileSync(path.join(brand, 'apple-180.png'), 'app/apple-icon.png'); note.push('app/apple-icon.png'); }
  note.push('public/icon.svg retained');
  R.icons = note.join(' + ');
  console.log(JSON.stringify(R, null, 2));
} catch (err) { R.errors.push(String(err)); console.log(JSON.stringify(R, null, 2)); process.exit(1); }
