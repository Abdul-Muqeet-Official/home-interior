import { cx } from "@/lib/utils";
import { forwardRef } from "react";

interface SwitchProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, checked, onChange, disabled, id, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="flex items-center gap-3">
        {label && (
          <label htmlFor={switchId} className="cursor-pointer flex-1">
            <div className="font-medium text-charcoal">{label}</div>
          </label>
        )}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          id={switchId}
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className={cx(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2",
            checked 
              ? "bg-champagne border-champagne" 
              : "bg-surface border-line"
          )}
          {...props}
        >
          <span
            className={cx(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    );
  }
);

Switch.displayName = "Switch";