import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/constants";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({
  className,
  showTagline = true,
  size = "md",
}: BrandLogoProps) {
  const dimensions = {
    sm: { img: 40, text: "text-xl", tag: "text-[7px]" },
    md: { img: 52, text: "text-2xl md:text-3xl", tag: "text-[8px]" },
    lg: { img: 68, text: "text-3xl md:text-4xl", tag: "text-[9px]" },
  }[size];

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3 group focus:outline-none select-none",
        className
      )}
      aria-label={`${BRAND.name} — ${BRAND.descriptor}`}
    >
      <div className="relative overflow-hidden flex-shrink-0">
        <Image
          src={BRAND.officialLogoPath}
          alt={`${BRAND.name} Emblem`}
          width={dimensions.img}
          height={dimensions.img}
          className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          priority
        />
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "font-serif tracking-luxury text-dheera-forest-green font-normal leading-none",
            dimensions.text
          )}
        >
          {BRAND.name}
        </span>
        {showTagline && (
          <span
            className={cn(
              "uppercase tracking-[0.32em] text-dheera-dark-green mt-1.5 font-sans font-medium",
              dimensions.tag
            )}
          >
            {BRAND.descriptor}
          </span>
        )}
      </div>
    </Link>
  );
}
