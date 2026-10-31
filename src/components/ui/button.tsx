import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center text-xs tracking-luxury uppercase font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-dheera-forest-green text-dheera-cream border border-dheera-forest-green hover:bg-transparent hover:text-dheera-forest-green",
        outline:
          "bg-transparent text-dheera-forest-green border border-dheera-forest-green hover:bg-dheera-forest-green hover:text-dheera-cream",
        gold:
          "bg-dheera-muted-gold text-dheera-cream border border-dheera-muted-gold hover:bg-transparent hover:text-dheera-muted-gold",
        ghost:
          "bg-transparent text-dheera-primary-text hover:text-dheera-muted-gold hover:bg-transparent",
        link:
          "text-dheera-forest-green underline-offset-4 hover:underline hover:text-dheera-muted-gold p-0 h-auto tracking-normal lowercase",
      },
      size: {
        default: "h-12 px-7 py-3",
        sm: "h-9 px-4 py-2 text-[10px]",
        lg: "h-14 px-9 py-4 text-xs tracking-wide",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
