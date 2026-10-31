"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SampleProduct } from "@/constants";
import { formatCurrencyINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useShop } from "@/context/shop-context";
import { Heart, Eye, ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: SampleProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, setQuickViewProduct, addToBag } = useShop();
  const isFavorited = isInWishlist(product.id);

  return (
    <article className="group bg-[#FAF9F5] border border-[#E2DFD6] flex flex-col transition-all duration-300 hover:border-[#176B45]/50 hover:shadow-md">
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EEEAE0]">
        <Link href={`/product?id=${product.id}`} className="block w-full h-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {/* Badge Overlay */}
        <div className="absolute top-3.5 left-3.5 pointer-events-none z-10">
          <Badge variant="default">{product.tag}</Badge>
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3.5 right-3.5 z-10 p-2.5 rounded-full transition-all duration-200 ${
            isFavorited
              ? "bg-[#176B45] text-[#FAF9F5] shadow-sm"
              : "bg-[#FAF9F5]/90 text-[#252A25] hover:text-[#176B45] hover:bg-[#FAF9F5]"
          }`}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Quick Actions Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="flex-1 bg-[#FAF9F5] hover:bg-[#176B45] text-[#252A25] hover:text-[#FAF9F5] text-[10px] uppercase tracking-luxury font-medium py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToBag(product);
            }}
            className="bg-[#176B45] hover:bg-[#315039] text-[#FAF9F5] p-2.5 transition-colors shadow-sm"
            aria-label="Add to shopping bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-[#FAF9F5]">
        <div>
          <span className="text-[9px] uppercase tracking-luxury text-[#AA9160] font-medium block mb-1.5">
            {product.category}
          </span>
          <Link href={`/product?id=${product.id}`}>
            <h3 className="font-serif text-base text-[#252A25] group-hover:text-[#176B45] transition-colors leading-snug line-clamp-1 mb-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-[#74786F] line-clamp-2 leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        {/* Price & Meta Footer */}
        <div className="pt-3 border-t border-[#E2DFD6] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-[#176B45]">
              {formatCurrencyINR(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#74786F]/70 line-through">
                {formatCurrencyINR(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-luxury text-[#315039] font-medium">
            Handcrafted
          </span>
        </div>
      </div>
    </article>
  );
}
