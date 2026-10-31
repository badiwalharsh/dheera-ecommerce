"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CatalogProduct } from "@/types/ecommerce";
import { formatCurrencyINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useShop } from "@/context/shop-context";
import { SizeGuideModal } from "@/components/products/size-guide-modal";
import {
  Heart,
  ShoppingBag,
  Ruler,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Truck,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProductDetailViewProps {
  product: CatalogProduct;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { isInWishlist, toggleWishlist, addToBag } = useShop();

  // Selected Variant State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "Standard");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || "Natural");
  const [quantity, setQuantity] = useState(1);

  // Modals & Gallery Zoom
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Accordion Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    details: true,
    fabric: true,
    fit: false,
    shipping: false,
    custom: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isFavorited = isInWishlist(product.id);
  const galleryImages = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const activeImage = galleryImages[activeImageIndex] || product.image;

  // Selected variant inventory check
  const matchedVariant = product.variants.find(
    (v) => v.size === selectedSize && (!v.colour || v.colour === selectedColor)
  );
  const isAvailable = matchedVariant ? matchedVariant.inStock : product.inStock;

  const handleAddToBag = () => {
    if (!isAvailable) return;
    for (let i = 0; i < quantity; i++) {
      addToBag(product, selectedSize);
    }
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="w-full overflow-x-hidden">
      {/* Development Fixture Banner */}
      <div className="mb-6 p-3 bg-[#FAF9F5] border border-[#AA9160]/40 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#315039]">
          <Sparkles className="w-3.5 h-3.5 text-[#AA9160] flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-luxury font-medium">
            Development Catalogue Sample — Illustrative Specifications & Prototype Pricing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-start">
        {/* ================= LEFT COLUMN: PRODUCT GALLERY ================= */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4 w-full">
          {/* Main Large Visual Viewport */}
          <div className="relative w-full aspect-[3/4] bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden group">
            <Image
              src={activeImage}
              alt={`${product.name} - View ${activeImageIndex + 1}`}
              fill
              priority
              loading="eager"
              className="object-cover object-center transition-all duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 55vw"
            />

            {/* Product Tag / Badge */}
            {product.tag && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                <Badge variant="default" className="text-[8px] sm:text-[9px] px-2 py-0.5">
                  {product.tag}
                </Badge>
              </div>
            )}

            {/* Enlarge / Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomModalOpen(true)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-2 sm:p-2.5 bg-[#FAF9F5]/90 hover:bg-[#FAF9F5] text-[#252A25] hover:text-[#176B45] border border-[#E2DFD6] shadow-sm transition-colors"
              aria-label="Enlarge image"
            >
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Mobile Navigation Arrows */}
            {galleryImages.length > 1 && (
              <div className="flex sm:hidden absolute inset-y-0 inset-x-2 items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
                  }
                  className="p-1.5 bg-black/40 text-white pointer-events-auto rounded-full"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
                  }
                  className="p-1.5 bg-black/40 text-white pointer-events-auto rounded-full"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 max-w-full">
              {galleryImages.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 flex-shrink-0 bg-[#EEEAE0] border-2 transition-all ${
                    activeImageIndex === idx
                      ? "border-[#176B45] opacity-100 shadow-sm"
                      : "border-[#E2DFD6] opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Switch to gallery photo ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: PRODUCT INFORMATION ================= */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6 w-full min-w-0">
          {/* Breadcrumb / Category Link */}
          <div>
            <Link
              href={`/collections/${product.categorySlug}`}
              className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#AA9160] hover:text-[#176B45] font-semibold transition-colors"
            >
              {product.category}
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif text-[#176B45] mt-1 mb-2 leading-tight break-words">
              {product.name}
            </h1>
            <p className="text-xs text-[#74786F] tracking-wide">
              SKU: <span className="font-mono text-[#252A25]">{product.sku}</span>
            </p>
          </div>

          {/* Pricing Row */}
          <div className="p-3.5 sm:p-4 bg-[#FAF9F5] border border-[#E2DFD6] flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl font-serif text-[#176B45] font-normal">
              {formatCurrencyINR(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xs sm:text-sm text-[#74786F]/70 line-through">
                  {formatCurrencyINR(product.originalPrice)}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury bg-[#176B45]/10 text-[#176B45] font-semibold px-2 py-0.5 border border-[#176B45]/20">
                  Save {discountPercent}% (Sample)
                </span>
              </>
            )}
            <span className="text-[9px] sm:text-[10px] text-[#74786F] block w-full pt-1">
              Sample development price. Inclusive of illustrative taxes.
            </span>
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-2 text-xs">
            {isAvailable ? (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[#176B45]">
                <span className="w-2 h-2 rounded-full bg-[#176B45] animate-pulse flex-shrink-0" />
                <span className="font-medium uppercase tracking-wider text-[10px] sm:text-[11px] break-words">
                  {product.isReadyToShip
                    ? "In Stock — Ready to Ship (Sample Estimate: 2–3 Days)"
                    : "In Stock — Made to Order (Sample Estimate: 7–10 Days)"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                <span className="font-medium uppercase tracking-wider text-[10px] sm:text-[11px]">
                  Sample Variant Unavailable in Selected Size
                </span>
              </div>
            )}
          </div>

          {/* Short Narrative Description */}
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed break-words">
            {product.description}
          </p>

          {/* Options: Colour Selection */}
          {product.colors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E2DFD6]">
              <div className="flex justify-between items-center text-xs">
                <span className="uppercase tracking-luxury text-[10px] sm:text-[11px] text-[#252A25] font-semibold">
                  Colour: <span className="font-normal text-[#176B45]">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.colors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`text-xs px-3 py-1.5 border transition-all ${
                      selectedColor === col
                        ? "border-[#176B45] bg-[#176B45] text-white font-medium"
                        : "border-[#E2DFD6] bg-[#FAF9F5] text-[#252A25] hover:border-[#176B45]"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options: Size Selection & Size Guide Button */}
          <div className="space-y-2 pt-2 border-t border-[#E2DFD6]">
            <div className="flex justify-between items-center">
              <span className="uppercase tracking-luxury text-[10px] sm:text-[11px] text-[#252A25] font-semibold">
                Size: <span className="font-normal text-[#176B45]">{selectedSize}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-[10px] uppercase tracking-luxury text-[#AA9160] hover:text-[#176B45] flex items-center gap-1 transition-colors"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {product.sizes.map((sz) => {
                const varForSz = product.variants.find((v) => v.size === sz);
                const hasStock = varForSz ? varForSz.inStock : product.inStock;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`text-xs px-3.5 py-1.5 sm:px-4 sm:py-2 border transition-all relative ${
                      selectedSize === sz
                        ? "border-[#176B45] bg-[#176B45] text-white font-medium"
                        : hasStock
                        ? "border-[#E2DFD6] bg-[#FAF9F5] text-[#252A25] hover:border-[#176B45]"
                        : "border-[#E2DFD6] bg-gray-100 text-gray-400 line-through"
                    }`}
                    disabled={!hasStock}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options: Quantity Selector */}
          <div className="pt-2 border-t border-[#E2DFD6] flex items-center gap-3 sm:gap-4">
            <span className="uppercase tracking-luxury text-[10px] sm:text-[11px] text-[#252A25] font-semibold flex-shrink-0">
              Quantity:
            </span>
            <div className="flex items-center border border-[#E2DFD6] bg-[#FAF9F5]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-2.5 py-1 text-xs text-[#252A25] hover:bg-[#EEEAE0] transition-colors"
                aria-label="Decrease quantity"
              >
                –
              </button>
              <span className="px-3 py-1 text-xs font-medium text-[#176B45] min-w-[32px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="px-2.5 py-1 text-xs text-[#252A25] hover:bg-[#EEEAE0] transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Primary Action Buttons: Add to Bag & Add to Wishlist */}
          <div className="pt-4 border-t border-[#E2DFD6] space-y-2.5 sm:space-y-3">
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={!isAvailable}
                className={`flex-1 min-w-0 py-3 sm:py-3.5 px-4 sm:px-6 text-[10px] sm:text-xs uppercase tracking-luxury font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm ${
                  isAvailable
                    ? "bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{isAvailable ? "Add to Shopping Bag" : "Unavailable in Size"}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-3 sm:p-3.5 border transition-colors flex-shrink-0 ${
                  isFavorited
                    ? "border-[#176B45] bg-[#176B45]/10 text-[#176B45]"
                    : "border-[#E2DFD6] bg-[#FAF9F5] hover:border-[#176B45] text-[#252A25]"
                }`}
                aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-[#176B45]" : ""}`} />
              </button>
            </div>

            {/* Bespoke Atelier Hook */}
            {product.isCustomizable && (
              <Link
                href={`/product/custom?ref=${product.slug}`}
                className="block text-center p-2.5 sm:p-3 bg-[#FAF9F5] border border-[#AA9160]/40 text-[#176B45] hover:bg-[#176B45] hover:text-white transition-colors text-[10px] sm:text-[11px] uppercase tracking-luxury font-medium break-words"
              >
                <Sparkles className="inline w-3 h-3 text-[#AA9160] mr-1.5" />
                <span>Custom Sizing & Neckline Atelier Inquiry →</span>
              </Link>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="py-3.5 sm:py-4 border-y border-[#E2DFD6] space-y-2 text-xs text-[#74786F]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
              <span>Authentic Handcrafted Indian Craft Concept</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
              <span>Domestic & International Delivery Subject to Confirmation</span>
            </div>
          </div>

          {/* ================= EXPANDABLE INFORMATION ACCORDIONS ================= */}
          <div className="divide-y divide-[#E2DFD6] border-b border-[#E2DFD6]">
            {/* 1. Product Details */}
            <div className="py-3 sm:py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("details")}
                className="w-full flex items-center justify-between text-left font-serif text-sm sm:text-base text-[#176B45]"
              >
                <span>Product Details</span>
                {openSections.details ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.details && (
                <div className="pt-2.5 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in break-words">
                  <p>{product.shortDescription || product.description}</p>
                  {product.details && product.details.length > 0 && (
                    <ul className="space-y-1.5 pt-1 pl-4 list-disc">
                      {product.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[10px] text-[#AA9160] italic pt-1">
                    * Illustrated for sample development. Final garment finishing to be verified on actual commercial production.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Fabric & Care */}
            <div className="py-3 sm:py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("fabric")}
                className="w-full flex items-center justify-between text-left font-serif text-sm sm:text-base text-[#176B45]"
              >
                <span>Fabric & Care</span>
                {openSections.fabric ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.fabric && (
                <div className="pt-2.5 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in break-words">
                  <div>
                    <strong className="text-[#252A25]">Fabric Weave: </strong>
                    <span>{product.fabric} (Sample specification)</span>
                  </div>
                  <div>
                    <strong className="text-[#252A25]">Care Instructions: </strong>
                    <span>{product.care}</span>
                  </div>
                  <p className="text-[10px] text-[#74786F]/80 italic pt-1">
                    Authentic handloom textiles may feature natural slight variations in weave and zari. Care instructions are illustrative recommendations.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Size & Fit */}
            <div className="py-3 sm:py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("fit")}
                className="w-full flex items-center justify-between text-left font-serif text-sm sm:text-base text-[#176B45]"
              >
                <span>Size & Fit</span>
                {openSections.fit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.fit && (
                <div className="pt-2.5 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in break-words">
                  <p>
                    Standard comfort fit tailored for Indian designer silhouettes. If you are between sizes, we suggest choosing the larger size.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[#176B45] font-semibold uppercase tracking-luxury text-[10px] sm:text-[11px] hover:text-[#AA9160] flex items-center gap-1 pt-1"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>View Illustrative Size Chart</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Shipping Information */}
            <div className="py-3 sm:py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("shipping")}
                className="w-full flex items-center justify-between text-left font-serif text-sm sm:text-base text-[#176B45]"
              >
                <span>Shipping & Delivery Policy</span>
                {openSections.shipping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.shipping && (
                <div className="pt-2.5 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in break-words">
                  <p>
                    <strong>Illustrative Timelines: </strong> Ready-to-ship samples estimate 2–3 business days for dispatch. Made-to-order pieces estimate 7–10 working days.
                  </p>
                  <p className="text-[10px] text-[#AA9160] italic pt-1">
                    * Final domestic and worldwide delivery promises, courier rates, and transit estimates will be confirmed prior to public commercial sales.
                  </p>
                </div>
              )}
            </div>

            {/* 5. Customisation */}
            <div className="py-3 sm:py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("custom")}
                className="w-full flex items-center justify-between text-left font-serif text-sm sm:text-base text-[#176B45]"
              >
                <span>Atelier Customisation</span>
                {openSections.custom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.custom && (
                <div className="pt-2.5 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in break-words">
                  <p>
                    Every DHEERA silhouette can be personalized. Whether you desire customized bust/waist dimensions, modesty lining, modified sleeve lengths, or alternative festive colors, our atelier accommodates bespoke requests.
                  </p>
                  <p className="pt-1">
                    Contact our atelier team at{" "}
                    <a href="mailto:care@dheera.in" className="text-[#176B45] underline font-medium">
                      care@dheera.in
                    </a>{" "}
                    or explore our bespoke portal.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= ENLARGED ZOOM MODAL ================= */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <button
            onClick={() => setIsZoomModalOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 text-white hover:text-[#AA9160] transition-colors"
            aria-label="Close enlarged view"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[75vh] sm:h-[85vh]">
            <Image
              src={activeImage}
              alt={`${product.name} zoomed`}
              fill
              className="object-contain"
              sizes="95vw"
            />
          </div>
        </div>
      )}

      {/* ================= SIZE GUIDE MODAL ================= */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        selectedSize={selectedSize}
      />
    </div>
  );
}
