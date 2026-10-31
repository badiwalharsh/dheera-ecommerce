import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-[11px] uppercase tracking-subtle text-dheera-secondary-text">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full bg-dheera-cream border border-dheera-line px-4 py-2 text-sm text-dheera-primary-text placeholder:text-dheera-secondary-text/50 focus:border-dheera-forest-green focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-600 focus:border-red-600",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
