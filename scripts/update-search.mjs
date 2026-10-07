import fs from 'fs/promises';

const recs = 
            ) : query.trim().length === 0 ? (
              <div className="py-2">
                <h3 className="eyebrow mb-3">Recommended</h3>
                <ul className="space-y-1">
                  {[
                    { group: "Materials", title: "Laminate Flooring", subtitle: "Materials & Products", href: "/materials/laminate-flooring" },
                    { group: "Materials", title: "SPC Flooring", subtitle: "Materials & Products", href: "/materials/spc-flooring" },
                    { group: "Materials", title: "Wallpaper", subtitle: "Materials & Products", href: "/materials/wallpaper" },
                    { group: "Materials", title: "Folding Doors", subtitle: "Materials & Products", href: "/materials/folding-doors" },
                    { group: "Our Work", title: "Project Portfolio", subtitle: "Our Work", href: "/our-work" },
                    { group: "Services", title: "Book a Consultation", subtitle: "Services", href: "/consultation" },
                  ].map((result, i) => {
                    const index = cursorValue++;
                    return (
                      <li key={\ec-\\}>
                        <Link
                          href={result.href}
                          ref={(node) => {
                            linkRefs.current[index] = node;
                          }}
                          onClick={onClose}
                          className="flex items-center justify-between gap-4 rounded-panel px-3 py-3 transition-colors hover:bg-surface focus-visible:bg-surface"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-charcoal">{result.title}</span>
                            <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.16em] text-muted">{result.subtitle}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
;

async function run() {
  let content = await fs.readFile('components/ui/SearchOverlay.tsx', 'utf8');
  content = content.replace(
    /(\) : query\.trim\(\)\.length === 0 \? \()[\s\S]*?(<\/div>\s*\) : \()/m,
    recs + ''
  );
  await fs.writeFile('components/ui/SearchOverlay.tsx', content);
}
run();
