import { cx } from "@/lib/utils";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  asChild = false,
  icon,
  iconPosition = "left",
  loading = false,
  href,
  className,
  disabled,
  size = "md",
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants = {
    primary: "bg-charcoal text-white hover:bg-charcoal/90",
    secondary: "bg-surface border border-line text-charcoal hover:bg-stone hover:border-champagne/50",
    outline: "border border-line-strong text-charcoal hover:bg-charcoal hover:text-white",
    ghost: "text-charcoal hover:bg-charcoal/10",
  };

  const useLink = !!href;

  if (!useLink) {
    return (
      <button
        className={cx(baseStyles, sizeStyles[size], variants[variant], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && <span aria-hidden="true">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span aria-hidden="true">{icon}</span>}
          </>
        )}
      </button>
    );
  }

  // Render as Link
  return (
    <Link
      href={href!}
      className={cx(baseStyles, sizeStyles[size], variants[variant], className)}
      aria-disabled={disabled || loading}
      {...(disabled || loading ? { onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && <span aria-hidden="true">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span aria-hidden="true">{icon}</span>}
        </>
      )}
    </Link>
  );
}

function Loader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
    </svg>
  );
}