/**
 * components/ui/Breadcrumbs.tsx
 * Accessible breadcrumb trail used on category, product and project pages.
 */

import Link from "next/link";
import { cx } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({
  items,
  tone = "light",
  className,
}: {
  items: Crumb[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className={cx(
          "flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.22em]",
          tone === "dark" ? "text-white/60" : "text-muted"
        )}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-3">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cx(
                    "transition-colors",
                    tone === "dark" ? "hover:text-white" : "hover:text-charcoal"
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={tone === "dark" ? "text-white/85" : "text-charcoal"}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-champagne">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
