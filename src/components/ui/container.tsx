import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide" | "full";
}

export function Container({
  className,
  size = "default",
  children,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    narrow: "max-w-4xl",
    default: "max-w-[1340px]",
    wide: "max-w-[1536px]",
    full: "w-full",
  };

  return (
    <div
      className={cn("mx-auto w-full px-5 md:px-8 lg:px-12", sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

