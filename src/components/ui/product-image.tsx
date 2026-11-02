"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Sparkles, ImageOff } from "lucide-react";

export interface ProductImageProps {
  src: string;
  alt: string;
  aspectRatio?: "portrait" | "square" | "landscape" | "banner" | "auto";
  className?: string;
  containerClassName?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
  showStudioBadge?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const ASPECT_RATIO_CLASSES = {
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  banner: "aspect-[2/1]",
  auto: "",
};

export function ProductImage({
  src,
  alt,
  aspectRatio = "portrait",
  className = "",
  containerClassName = "",
  fill = true,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 88,
  objectFit = "cover",
  objectPosition = "object-center",
  showStudioBadge = false,
  onLoad,
  onError,
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || ASPECT_RATIO_CLASSES.portrait;

  const handleLoadingComplete = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError();
  };

  return (
    <div
      className={`relative w-full ${aspectClass} bg-[#EEEAE0] overflow-hidden ${containerClassName}`}
    >
      {/* Loading Skeleton / Shimmer */}
      {isLoading && (
        <div
          className="absolute inset-0 z-0 bg-[#EEEAE0] animate-pulse flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-8 h-8 rounded-full border-2 border-[#AA9160]/30 border-t-[#176B45] animate-spin" />
        </div>
      )}

      {/* Error / Missing Image Fallback */}
      {hasError ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-[#FAF9F5] border border-[#E2DFD6]"
          role="img"
          aria-label={`${alt} (Photography update in progress)`}
        >
          <div className="w-12 h-12 rounded-full bg-[#EEEAE0] flex items-center justify-center mb-2 text-[#AA9160]">
            <Sparkles className="w-6 h-6 stroke-[1.5]" />
          </div>
          <span className="font-serif text-xs font-semibold text-[#176B45] tracking-luxury uppercase">
            DHEERA
          </span>
          <span className="text-[10px] text-[#74786F] mt-1 tracking-wide">
            Original Studio View Pending
          </span>
        </div>
      ) : (
        /* Optimized Next.js Image */
        <Image
          src={src}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          quality={quality}
          onLoad={handleLoadingComplete}
          onError={handleImageError}
          className={`${
            objectFit === "cover" ? "object-cover" : "object-contain"
          } ${objectPosition} transition-all duration-700 ease-out ${
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          } ${className}`}
        />
      )}

      {/* Optional Studio Sample Badge */}
      {showStudioBadge && !hasError && (
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="text-[8px] uppercase tracking-luxury text-[#315039] font-medium bg-[#FAF9F5]/90 backdrop-blur-sm border border-[#E2DFD6] px-1.5 py-0.5 shadow-xs">
            Studio Concept
          </span>
        </div>
      )}
    </div>
  );
}

