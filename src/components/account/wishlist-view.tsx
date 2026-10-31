"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { useShop } from "@/context/shop-context";
import { WishlistItem } from "@/types/account";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";

export function WishlistView() {
  const { user } = useAuth();
  const { addToBag } = useShop();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/account/wishlist?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId: string, productName: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/account/wishlist?userId=${user.id}&productId=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        setNotification(`Removed "${productName}" from your wishlist.`);
      }
    } catch {
      // Ignore
    } finally {
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleMoveToBag = async (item: WishlistItem) => {
    addToBag(
      {
        id: item.productId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: item.category,
        inStock: item.inStock,
      },
      "M",
      "Emerald Green",
      1
    );

    // Optionally remove from wishlist once moved to bag
    await handleRemove(item.productId, item.name);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm">
        <div>
          <h3 className="text-lg font-serif text-[#176B45]">Curated Wishlist</h3>
          <p className="text-xs text-[#555E55]">
            {items.length} artisanal garment{items.length === 1 ? "" : "s"} saved to your personal collection.
          </p>
        </div>

        {items.length > 0 && (
          <Link
            href="/shop"
            className="text-xs text-[#176B45] hover:text-[#AA9160] font-medium flex items-center gap-1 transition-colors"
          >
            Continue Exploring <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm">
          {notification}
        </div>
      )}

      {/* Wishlist Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#8C9388] animate-pulse">
          Loading your saved couture...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm p-12 text-center space-y-3">
          <Heart className="w-10 h-10 text-[#8C9388] mx-auto stroke-[1.2]" />
          <h4 className="font-serif text-base text-[#252A25]">Your Wishlist is Empty</h4>
          <p className="text-xs text-[#555E55] max-w-sm mx-auto">
            Save exquisite handcrafted ensembles to your wishlist as you explore our heritage collection.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#176B45] text-white text-xs uppercase tracking-wide hover:bg-[#315039] transition-colors rounded-sm"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-sm overflow-hidden flex flex-col justify-between group hover:border-[#176B45]/40 transition-colors"
            >
              <div>
                {/* Product Thumbnail */}
                <Link href={`/product/${item.slug}`} className="block relative aspect-[3/4] bg-[#EEEAE0]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item.productId, item.name);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[#555E55] hover:text-red-600 flex items-center justify-center shadow-sm transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>

                {/* Details */}
                <div className="p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C9388]">
                    {item.category}
                  </span>
                  <Link href={`/product/${item.slug}`} className="block">
                    <h4 className="font-serif text-sm text-[#252A25] font-medium hover:text-[#176B45] transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                  </Link>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-serif text-sm font-semibold text-[#176B45]">
                      {formatCurrency(item.price)}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-xs text-[#8C9388] line-through">
                        {formatCurrency(item.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Move to Bag Action */}
              <div className="p-4 pt-0">
                <Button
                  onClick={() => handleMoveToBag(item)}
                  className="w-full h-10 bg-[#176B45] hover:bg-[#315039] text-white text-xs uppercase tracking-wide flex items-center justify-center gap-2 rounded-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Move to Bag
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
