/**
 * components/ui/SectionHeading.tsx
 * Editorial section header: eyebrow, serif heading, optional description and action.
 */

import Link from "next/link";
import { cx } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  heading: string;
  description?: string;
  id?: string;
  action?: { label: string; href: string };
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  level?: 2 | 3;
  /**
   * "page" renders the major heading scale, "section" the supporting scale.
   * Use "page" when a homepage section must carry the same weight as a page title.
   */
  size?: "page" | "section";
}

export default function SectionHeading({
  eyebrow,
  heading,
  description,
  id,
  action,
  align = "left",
  tone = "light",
  className,
  level = 2,
  size = "section",
}: SectionHeadingProps) {
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <div
      className={cx(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className
      )}
    >
      <div className={cx("max-w-3xl", align === "center" && "text-center")}>
        {eyebrow && (
          <p className={cx("eyebrow", tone === "dark" && "text-champagne")}>{eyebrow}</p>
        )}
        <Heading
          id={id}
          className={cx(
            size === "page" ? "display-1" : "display-2",
            "mt-4",
            tone === "dark" ? "text-white" : "text-charcoal"
          )}
        >
          {heading}
        </Heading>
        {description && (
          <p className={cx("lede mt-5", tone === "dark" && "text-white/65")}>{description}</p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={cx("link-editorial shrink-0", tone === "dark" && "link-editorial-light")}
        >
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
