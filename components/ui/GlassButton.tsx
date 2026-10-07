"use client";

/**
 * components/ui/GlassButton.tsx
 * Premium reusable button primitive for the HOME INTERIOR design system.
 *
 * Variants: solid | outline | glass | glass-dark | champagne | light | icon | text
 * States:   default | hover | active | focus | disabled | loading
 */

import Link from "next/link";
import { forwardRef } from "react";
import { cx } from "@/lib/utils";

const VARIANT_MAP: Record<string, string> = {
  solid: "btn btn-solid",
  outline: "btn btn-outline",
  "outline-light": "btn btn-outline-light",
  glass: "btn btn-glass",
  "glass-dark": "btn btn-glass-dark",
  champagne: "btn btn-champagne",
  light: "btn btn-light",
  text: "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:text-gold-deep",
  icon: "btn-icon",
};

export type ButtonVariant = keyof typeof VARIANT_MAP;

type CommonProps = {
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  arrow?: boolean;
};

type AsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
    external?: undefined;
  };

type AsLink = CommonProps & {
  href: string;
  external?: boolean;
};

type GlassButtonProps = AsButton | AsLink;

const GlassButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, GlassButtonProps>(
  function GlassButton(props, ref) {
    const {
      variant = "solid",
      loading = false,
      className,
      children,
      arrow,
      ...rest
    } = props;

    const classes = cx(
      VARIANT_MAP[variant] ?? VARIANT_MAP.solid,
      loading && "btn-loading",
      className
    );

    if ("href" in rest && rest.href) {
      const { href, external, ...linkRest } = rest as AsLink;
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={classes}
            {...linkRest}
          >
            {children}
            {arrow && <span aria-hidden="true">→</span>}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...(linkRest as Omit<AsLink, "href" | "external" | keyof CommonProps>)}
        >
          {children}
          {arrow && <span aria-hidden="true">→</span>}
        </Link>
      );
    }

    const buttonRest = rest as Omit<AsButton, keyof CommonProps>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonRest.type ?? "button"}
        disabled={loading || buttonRest.disabled}
        className={classes}
        aria-busy={loading || undefined}
        {...buttonRest}
      >
        {children}
        {arrow && <span aria-hidden="true">→</span>}
      </button>
    );
  }
);

export default GlassButton;
