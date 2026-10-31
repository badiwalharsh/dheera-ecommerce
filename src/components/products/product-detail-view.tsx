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
  Check,
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

  // Accordion Sections State (All default open or toggleable)
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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* ================= LEFT COLUMN: PRODUCT GALLERY ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Visual Viewport */}
          <div className="relative aspect-[3/4] bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden group">
            <Image
              src={activeImage}
              alt={`${product.name} - View ${activeImageIndex + 1}`}
              fill
              priority
              className="object-cover object-center transition-all duration-500"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />

            {/* Product Tag / Badge */}
            {product.tag && (
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="default">{product.tag}</Badge>
              </div>
            )}

            {/* Enlarge / Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomModalOpen(true)}
              className="absolute top-4 right-4 z-10 p-2.5 bg-[#FAF9F5]/90 hover:bg-[#FAF9F5] text-[#252A25] hover:text-[#176B45] border border-[#E2DFD6] shadow-sm transition-colors"
              aria-label="Enlarge image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Mobile Navigation Arrows */}
            {galleryImages.length > 1 && (
              <div className="flex sm:hidden absolute inset-y-0 inset-x-2 items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
                  }
                  className="p-2 bg-black/40 text-white pointer-events-auto rounded-full"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
                  }
                  className="p-2 bg-black/40 text-white pointer-events-auto rounded-full"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Development Data Watermark */}
            {product.isDevelopmentFixture && (
              <div className="absolute bottom-3 left-3 bg-[#FAF9F5]/85 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-luxury text-[#AA9160] border border-[#E2DFD6]">
                Development Catalogue Fixture
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0 bg-[#EEEAE0] border-2 transition-all ${
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
        <div className="lg:col-span-5 space-y-6">
          {/* Breadcrumb / Category Link */}
          <div>
            <Link
              href={`/collections/${product.categorySlug}`}
              className="text-[10px] uppercase tracking-luxury text-[#AA9160] hover:text-[#176B45] font-semibold transition-colors"
            >
              {product.category}
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#176B45] mt-1.5 mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-[#74786F] tracking-wide">
              SKU: <span className="font-mono text-[#252A25]">{product.sku}</span>
            </p>
          </div>

          {/* Pricing Row */}
          <div className="p-4 bg-[#FAF9F5] border border-[#E2DFD6] flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-serif text-[#176B45] font-normal">
              {formatCurrencyINR(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-sm text-[#74786F]/70 line-through">
                  {formatCurrencyINR(product.originalPrice)}
                </span>
                <span className="text-[10px] uppercase tracking-luxury bg-[#176B45]/10 text-[#176B45] font-semibold px-2 py-0.5 border border-[#176B45]/20">
                  Save {discountPercent}%
                </span>
              </>
            )}
            <span className="text-[10px] text-[#74786F] block w-full pt-1">
              Inclusive of all taxes. Free shipping on selected domestic orders.
            </span>
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-2 text-xs">
            {isAvailable ? (
              <div className="flex items-center gap-2 text-[#176B45]">
                <span className="w-2 h-2 rounded-full bg-[#176B45] animate-pulse" />
                <span className="font-medium uppercase tracking-wider text-[11px]">
                  {product.isReadyToShip
                    ? "In Stock — Ready to Ship (Dispatches in 2–3 Days)"
                    : "In Stock — Made to Order (Handcrafted in 7–10 Days)"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="font-medium uppercase tracking-wider text-[11px]">
                  Currently Unavailable in Selected Size
                </span>
              </div>
            )}
          </div>

          {/* Short Narrative Description */}
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
            {product.description}
          </p>

          {/* Options: Colour Selection */}
          {product.colors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E2DFD6]">
              <div className="flex justify-between items-center text-xs">
                <span className="uppercase tracking-luxury text-[11px] text-[#252A25] font-semibold">
                  Colour: <span className="font-normal text-[#176B45]">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`text-xs px-3.5 py-1.5 border transition-all ${
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
              <span className="uppercase tracking-luxury text-[11px] text-[#252A25] font-semibold">
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
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => {
                const varForSz = product.variants.find((v) => v.size === sz);
                const hasStock = varForSz ? varForSz.inStock : product.inStock;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`text-xs px-4 py-2 border transition-all relative ${
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
          <div className="pt-2 border-t border-[#E2DFD6] flex items-center gap-4">
            <span className="uppercase tracking-luxury text-[11px] text-[#252A25] font-semibold">
              Quantity:
            </span>
            <div className="flex items-center border border-[#E2DFD6] bg-[#FAF9F5]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-xs text-[#252A25] hover:bg-[#EEEAE0] transition-colors"
                aria-label="Decrease quantity"
              >
                –
              </button>
              <span className="px-4 py-1.5 text-xs font-medium text-[#176B45] min-w-[36px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="px-3 py-1.5 text-xs text-[#252A25] hover:bg-[#EEEAE0] transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Primary Action Buttons: Add to Bag & Add to Wishlist */}
          <div className="pt-4 border-t border-[#E2DFD6] space-y-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={!isAvailable}
                className={`flex-1 py-3.5 px-6 text-xs uppercase tracking-luxury font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isAvailable
                    ? "bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAvailable ? "Add to Shopping Bag" : "Unavailable in Size"}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 border transition-colors ${
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
                className="block text-center p-3 bg-[#FAF9F5] border border-[#AA9160]/40 text-[#176B45] hover:bg-[#176B45] hover:text-white transition-colors text-[11px] uppercase tracking-luxury font-medium"
              >
                <Sparkles className="inline w-3 h-3 text-[#AA9160] mr-1.5" />
                <span>Need Custom Sizing or Neckline? Explore Atelier Customisation →</span>
              </Link>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="py-4 border-y border-[#E2DFD6] space-y-2 text-xs text-[#74786F]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
              <span>100% Authentic Handcrafted Indian Weaves & Embroidery</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#AA9160] flex-shrink-0" />
              <span>Complimentary Domestic Express Courier on Selected Orders</span>
            </div>
          </div>

          {/* ================= EXPANDABLE INFORMATION ACCORDIONS ================= */}
          <div className="divide-y divide-[#E2DFD6] border-b border-[#E2DFD6]">
            {/* 1. Product Details */}
            <div className="py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("details")}
                className="w-full flex items-center justify-between text-left font-serif text-base text-[#176B45]"
              >
                <span>Product Details</span>
                {openSections.details ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.details && (
                <div className="pt-3 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in">
                  <p>{product.shortDescription || product.description}</p>
                  {product.details && product.details.length > 0 && (
                    <ul className="space-y-1.5 pt-1 pl-4 list-disc">
                      {product.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* 2. Fabric & Care */}
            <div className="py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("fabric")}
                className="w-full flex items-center justify-between text-left font-serif text-base text-[#176B45]"
              >
                <span>Fabric & Care</span>
                {openSections.fabric ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.fabric && (
                <div className="pt-3 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in">
                  <div>
                    <strong className="text-[#252A25]">Fabric Weave: </strong>
                    <span>{product.fabric}</span>
                  </div>
                  <div>
                    <strong className="text-[#252A25]">Care Instructions: </strong>
                    <span>{product.care}</span>
                  </div>
                  <p className="text-[11px] text-[#74786F]/80 italic pt-1">
                    Authentic handcrafted garments may have gentle textural variations in weave or zari. These are natural signatures of master artisanal handloom work.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Size & Fit */}
            <div className="py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("fit")}
                className="w-full flex items-center justify-between text-left font-serif text-base text-[#176B45]"
              >
                <span>Size & Fit</span>
                {openSections.fit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.fit && (
                <div className="pt-3 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in">
                  <p>
                    Standard comfort fit tailored true to Indian designer sizing. If you find yourself between sizes or prefer an easier drape, we suggest selecting the larger size.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[#176B45] font-semibold uppercase tracking-luxury text-[11px] hover:text-[#AA9160] flex items-center gap-1 pt-1"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>View Comprehensive Size Chart</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Shipping Information */}
            <div className="py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("shipping")}
                className="w-full flex items-center justify-between text-left font-serif text-base text-[#176B45]"
              >
                <span>Shipping & Delivery</span>
                {openSections.shipping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.shipping && (
                <div className="pt-3 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in">
                  <p>
                    <strong>Domestic (India): </strong> Ready-to-ship pieces are securely dispatched within 2–3 business days via premium air express. Delivery typically takes 3–5 working days.
                  </p>
                  <p>
                    <strong>Made to Order: </strong> Tailored by our master artisans within 7–10 business days before dispatch.
                  </p>
                  <p>
                    <strong>International: </strong> Worldwide courier dispatch via DHL / FedEx.
                  </p>
                </div>
              )}
            </div>

            {/* 5. Customisation */}
            <div className="py-3.5">
              <button
                type="button"
                onClick={() => toggleSection("custom")}
                className="w-full flex items-center justify-between text-left font-serif text-base text-[#176B45]"
              >
                <span>Atelier Customisation</span>
                {openSections.custom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.custom && (
                <div className="pt-3 pb-1 text-xs text-[#74786F] space-y-2 animate-fade-in">
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setIsZoomModalOpen(false)}
            className="absolute top-6 right-6 p-3 text-white hover:text-[#AA9160] transition-colors"
            aria-label="Close enlarged view"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[85vh]">
            <Image
              src={activeImage}
              alt={`${product.name} zoomed`}
              fill
              className="object-contain"
              sizes="90vw"
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
    </>
  );
}
