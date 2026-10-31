import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-1 text-[9px] uppercase tracking-luxury font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-dheera-cream text-dheera-forest-green border border-dheera-line",
        primary: "bg-dheera-forest-green text-dheera-cream",
        gold: "bg-dheera-muted-gold text-dheera-cream",
        outline: "text-dheera-primary-text border border-dheera-line bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
