"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/context/shop-context";
import { formatCurrencyINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X, Heart, ShoppingBag, ArrowRight } from "lucide-react";

export function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, isInWishlist, toggleWishlist, addToBag } = useShop();
  const [selectedSize, setSelectedSize] = useState<string>("");

  if (!quickViewProduct) return null;

  const isFavorited = isInWishlist(quickViewProduct.id);
  const activeSize = selectedSize || quickViewProduct.sizes[0];

  const handleAdd = () => {
    addToBag(quickViewProduct, activeSize);
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-[#FAF9F5] w-full max-w-3xl border border-[#E2DFD6] shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-10 p-2 text-[#74786F] hover:text-[#176B45] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-[3/4] md:h-full bg-[#EEEAE0]">
            <Image
              src={quickViewProduct.image}
              alt={quickViewProduct.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute top-4 left-4">
              <Badge variant="default">{quickViewProduct.tag}</Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-medium block mb-1">
                {quickViewProduct.category}
              </span>
              <h2 className="text-2xl font-serif text-[#252A25] mb-2">
                {quickViewProduct.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xl font-medium text-[#176B45]">
                  {formatCurrencyINR(quickViewProduct.price)}
                </span>
                {quickViewProduct.originalPrice && (
                  <span className="text-sm text-[#74786F]/70 line-through">
                    {formatCurrencyINR(quickViewProduct.originalPrice)}
                  </span>
                )}
                <span className="text-[10px] text-[#315039] uppercase tracking-wider bg-[#176B45]/10 px-2 py-0.5">
                  Handcrafted
                </span>
              </div>

              <p className="text-xs text-[#74786F] leading-relaxed mb-6">
                {quickViewProduct.description}
              </p>

              {/* Specs */}
              <div className="space-y-2 py-3 border-y border-[#E2DFD6] text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-[#74786F]">Fabric</span>
                  <span className="text-[#252A25] font-medium">{quickViewProduct.fabric}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#74786F]">Care</span>
                  <span className="text-[#252A25] font-medium">{quickViewProduct.care}</span>
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] uppercase tracking-luxury text-[#252A25] font-medium">
                    Select Size
                  </span>
                  <span className="text-[10px] text-[#AA9160] uppercase tracking-luxury">
                    Size Guide
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickViewProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-xs px-3.5 py-1.5 border transition-all ${
                        activeSize === sz
                          ? "border-[#176B45] bg-[#176B45] text-white"
                          : "border-[#E2DFD6] bg-[#EEEAE0]/50 text-[#252A25] hover:border-[#176B45]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-[#E2DFD6]">
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] py-3 px-4 text-xs uppercase tracking-luxury font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>
                <button
                  onClick={() => toggleWishlist(quickViewProduct)}
                  className={`p-3 border transition-colors ${
                    isFavorited
                      ? "border-[#176B45] bg-[#176B45]/10 text-[#176B45]"
                      : "border-[#E2DFD6] hover:border-[#176B45] text-[#252A25]"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? "fill-[#176B45]" : ""}`} />
                </button>
              </div>

              <Link
                href={`/product?id=${quickViewProduct.id}`}
                onClick={() => setQuickViewProduct(null)}
                className="w-full text-center block text-[11px] uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] transition-colors py-1"
              >
                <span>View Full Product Details</span> <ArrowRight className="inline w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
