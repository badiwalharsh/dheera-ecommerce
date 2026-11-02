"use client";

import React from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ui/product-image";
import { formatCurrencyINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useShop } from "@/context/shop-context";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { SampleProduct } from "@/constants";

interface ProductCardProps {
  product: SampleProduct | {
    id: string;
    slug?: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    tag?: string;
    image: string;
    description: string;
    sizes: readonly string[] | string[];
    colors: readonly string[] | string[];
    fabric?: string;
    care?: string;
  };
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, setQuickViewProduct, addToBag } = useShop();
  const isFavorited = isInWishlist(product.id);
  const productSlug = product.slug || product.id;

  return (
    <article className="group bg-[#FAF9F5] border border-[#E2DFD6] flex flex-col transition-all duration-300 hover:border-[#176B45]/50 hover:shadow-md w-full overflow-hidden">
      {/* Product Image Container — Explicit absolute fill prevents any 0-height collapse */}
      <div className="relative w-full aspect-[3/4] bg-[#EEEAE0] overflow-hidden">
        <Link
          href={`/product/${productSlug}`}
          className="absolute inset-0 block w-full h-full overflow-hidden z-0"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            aspectRatio="auto"
            priority={priority}
            quality={85}
            className="transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Badge Overlay */}
        {product.tag && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 pointer-events-none z-10">
            <Badge variant="default" className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5">
              {product.tag}
            </Badge>
          </div>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product as SampleProduct);
          }}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
            isFavorited
              ? "bg-[#176B45] text-[#FAF9F5] shadow-sm"
              : "bg-[#FAF9F5]/90 text-[#252A25] hover:text-[#176B45] hover:bg-[#FAF9F5]"
          }`}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Quick Actions Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 sm:gap-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewProduct(product as SampleProduct);
            }}
            className="flex-1 bg-[#FAF9F5] hover:bg-[#176B45] text-[#252A25] hover:text-[#FAF9F5] text-[9px] sm:text-[10px] uppercase tracking-luxury font-medium py-1.5 sm:py-2 px-2 transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Quick View</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToBag(product as SampleProduct);
            }}
            className="bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] p-1.5 sm:p-2 transition-colors shadow-sm"
            aria-label="Add to shopping bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between bg-[#FAF9F5] min-w-0">
        <div>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-luxury text-[#AA9160] font-medium block mb-0.5 sm:mb-1">
            {product.category}
          </span>
          <Link href={`/product/${productSlug}`}>
            <h3 className="font-serif text-xs sm:text-sm md:text-base text-[#252A25] group-hover:text-[#176B45] transition-colors leading-snug line-clamp-1 mb-1 break-words">
              {product.name}
            </h3>
          </Link>
          <p className="text-[10px] sm:text-xs text-[#74786F] line-clamp-2 leading-relaxed mb-2">
            {product.description}
          </p>
        </div>

        {/* Price & Meta Footer */}
        <div className="pt-2 border-t border-[#E2DFD6] flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-[#176B45]">
              {formatCurrencyINR(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[9px] sm:text-[10px] text-[#74786F]/70 line-through">
                {formatCurrencyINR(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[7px] sm:text-[8px] uppercase tracking-luxury text-[#315039] font-medium bg-[#176B45]/10 px-1 py-0.5 rounded-sm">
            Sample
          </span>
        </div>
      </div>
    </article>
  );
}
