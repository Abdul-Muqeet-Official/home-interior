/**
 * components/ui/EmptyState.tsx
 * Elegant, intentional empty state. Used instead of fabricated content whenever a
 * collection has no published records yet.
 */

import Link from "next/link";
import { cx } from "@/lib/utils";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  body: string;
  actions?: { label: string; href: string; variant?: "solid" | "outline"; external?: boolean }[];
  tone?: "light" | "dark";
  className?: string;
}

export default function EmptyState({
  eyebrow,
  title,
  body,
  actions = [],
  tone = "light",
  className,
}: EmptyStateProps) {
  const dark = tone === "dark";

  return (
    <div
      className={cx(
        "rounded-card border px-8 py-14 text-center sm:px-14 sm:py-20",
        dark ? "border-line-light bg-dark text-white" : "border-line bg-pure",
        className
      )}
    >
      {eyebrow && (
        <p className={cx("eyebrow", dark && "text-champagne")}>{eyebrow}</p>
      )}
      <h2
        className={cx(
          "display-3 mt-5 uppercase tracking-[0.12em]",
          dark ? "text-white" : "text-charcoal"
        )}
      >
        {title}
      </h2>
      <p className={cx("lede mx-auto mt-5 max-w-xl", dark && "text-white/65")}>{body}</p>

      {actions.length > 0 && (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) =>
            action.external ? (
              <a
                key={action.href}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cx("btn", action.variant === "outline" ? "btn-outline" : "btn-solid")}
              >
                {action.label}
                <span aria-hidden="true">→</span>
              </a>
            ) : (
              <Link
                key={action.href}
                href={action.href}
                className={cx("btn", action.variant === "outline" ? "btn-outline" : "btn-solid")}
              >
                {action.label}
                <span aria-hidden="true">→</span>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
