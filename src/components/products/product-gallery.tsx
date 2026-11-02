"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";

export interface ProductGalleryProps {
  productName: string;
  tag?: string;
  images: readonly string[] | string[];
}

export function ProductGallery({ productName, tag, images }: ProductGalleryProps) {
  const galleryImages = images && images.length > 0 ? images : ["/images/products/product-1.jpg"];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Active view labels for luxury editorial presentation
  const getViewLabel = (index: number) => {
    if (index === 0) return "Full Silhouette";
    if (index === 1) return "Embroidery & Neckline Detail";
    if (index === 2) return "Fabric Weave & Texture";
    return `Editorial Perspective ${index + 1}`;
  };

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % galleryImages.length);
    setIsZoomedIn(false);
  }, [galleryImages.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    setIsZoomedIn(false);
  }, [galleryImages.length]);

  // Touch Swipe for mobile viewports
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  const activeSrc = galleryImages[activeIndex] || galleryImages[0];

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {/* Main Viewport Container */}
      <div
        className="relative w-full aspect-[3/4] bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden group select-none shadow-xs"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={activeSrc}
          alt={`${productName} — ${getViewLabel(activeIndex)}`}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 55vw"
          quality={90}
          className="object-cover object-center transition-all duration-500 ease-out"
        />

        {/* Product Tag / Badge */}
        {tag && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 pointer-events-none">
            <Badge variant="default" className="text-[8px] sm:text-[9px] px-2 py-0.5 shadow-sm">
              {tag}
            </Badge>
          </div>
        )}

        {/* View Angle Pill */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#252A25] font-medium bg-[#FAF9F5]/90 backdrop-blur-xs border border-[#E2DFD6] px-2 py-1 shadow-xs">
            {getViewLabel(activeIndex)}
          </span>
        </div>

        {/* Lightbox / Zoom Trigger Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-2 sm:p-2.5 bg-[#FAF9F5]/90 hover:bg-[#FAF9F5] text-[#252A25] hover:text-[#176B45] border border-[#E2DFD6] shadow-sm transition-all duration-200"
          aria-label="Enlarge image inspection"
          title="Click to inspect high-resolution weave and embroidery"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Navigation Arrows for multi-image galleries */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 bg-[#FAF9F5]/80 hover:bg-[#FAF9F5] text-[#252A25] hover:text-[#176B45] border border-[#E2DFD6] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
              aria-label="Previous view"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 bg-[#FAF9F5]/80 hover:bg-[#FAF9F5] text-[#252A25] hover:text-[#176B45] border border-[#E2DFD6] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
              aria-label="Next view"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Multi-angle Thumbnail Strip */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {galleryImages.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                setIsZoomedIn(false);
              }}
              className={`relative w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-32 flex-shrink-0 bg-[#EEEAE0] border-2 transition-all duration-200 overflow-hidden ${
                activeIndex === idx
                  ? "border-[#176B45] ring-1 ring-[#176B45] shadow-sm opacity-100 scale-102"
                  : "border-[#E2DFD6] opacity-75 hover:opacity-100"
              }`}
              aria-label={`Switch to ${getViewLabel(idx)}`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover object-center"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[#FAF9F5] text-[7px] sm:text-[8px] uppercase tracking-wider py-0.5 text-center truncate px-1">
                {idx === 0 ? "Full" : idx === 1 ? "Detail" : idx === 2 ? "Weave" : `#${idx + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* High-Resolution Lightbox & Texture Inspection Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={`High-resolution inspection of ${productName}`}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white max-w-6xl pb-3 border-b border-white/10 z-10">
            <div>
              <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
                Artisanal Inspection
              </span>
              <h3 className="font-serif text-base sm:text-lg text-white">
                {productName} — <span className="text-white/80">{getViewLabel(activeIndex)}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomedIn((prev) => !prev)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-1.5 text-xs"
                title={isZoomedIn ? "Zoom Out" : "Zoom In (2x texture view)"}
              >
                {isZoomedIn ? (
                  <>
                    <ZoomOut className="w-4 h-4" />
                    <span className="hidden sm:inline">1x</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4" />
                    <span className="hidden sm:inline">2x Texture</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setIsZoomedIn(false);
                }}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                aria-label="Close enlarged view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central High-Res Viewport */}
          <div className="relative w-full max-w-4xl h-[70vh] sm:h-[80vh] flex items-center justify-center overflow-auto my-auto">
            <div
              className={`relative transition-all duration-300 ease-out ${
                isZoomedIn
                  ? "w-[1200px] h-[1600px] max-w-none cursor-grab active:cursor-grabbing"
                  : "w-full h-full cursor-zoom-in"
              }`}
              onClick={() => setIsZoomedIn((prev) => !prev)}
            >
              <Image
                src={activeSrc}
                alt={`${productName} — ${getViewLabel(activeIndex)} full zoom`}
                fill
                quality={95}
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* Lightbox Prev / Next Controls */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-lg transition-transform hover:scale-105"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-lg transition-transform hover:scale-105"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Bar: Thumbnail strip in lightbox */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-2 z-10 max-w-md">
              {galleryImages.map((img, idx) => (
                <button
                  key={`lightbox-${img}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setIsZoomedIn(false);
                  }}
                  className={`relative w-12 h-16 flex-shrink-0 border-2 transition-all overflow-hidden ${
                    activeIndex === idx ? "border-[#AA9160] scale-105" : "border-white/30 opacity-60"
                  }`}
                >
                  <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
