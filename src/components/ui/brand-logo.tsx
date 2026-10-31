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
    sm: { img: 32, text: "text-lg sm:text-xl", tag: "text-[7px]" },
    md: { img: 42, text: "text-xl sm:text-2xl md:text-3xl", tag: "text-[7px] sm:text-[8px]" },
    lg: { img: 58, text: "text-2xl sm:text-3xl md:text-4xl", tag: "text-[8px] sm:text-[9px]" },
  }[size];

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 sm:gap-3 group focus:outline-none select-none max-w-full",
        className
      )}
      aria-label={`${BRAND.name} — ${BRAND.descriptor}`}
    >
      <div className="relative overflow-hidden flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11">
        <Image
          src={BRAND.officialLogoPath}
          alt={`${BRAND.name} Emblem`}
          width={dimensions.img}
          height={dimensions.img}
          className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 w-full h-full"
          priority
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "font-serif tracking-luxury text-[#176B45] font-normal leading-none truncate",
            dimensions.text
          )}
        >
          {BRAND.name}
        </span>
        <span
          className={cn(
            "tracking-luxury text-[#74786F] uppercase font-medium mt-0.5 sm:mt-1 truncate",
            dimensions.tag
          )}
        >
          {BRAND.descriptor}
        </span>
        {showTagline && size === "lg" && (
          <span className="text-[10px] sm:text-xs text-[#AA9160] italic font-serif mt-1 hidden sm:block">
            {BRAND.tagline}
          </span>
        )}
      </div>
    </Link>
  );
}
