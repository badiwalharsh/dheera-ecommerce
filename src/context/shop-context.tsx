"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SampleProduct } from "@/constants";

interface ShopContextType {
  wishlist: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: SampleProduct) => void;
  cartCount: number;
  addToBag: (product: SampleProduct, size?: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  quickViewProduct: SampleProduct | null;
  setQuickViewProduct: (product: SampleProduct | null) => void;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<SampleProduct | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize from localStorage safely
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem("dheera_wishlist");
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
      const savedCart = localStorage.getItem("dheera_cart_count");
      if (savedCart) {
        setCartCount(Number(savedCart) || 0);
      }
    } catch {
      // Local storage not available in some sandbox contexts
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const toggleWishlist = (product: SampleProduct) => {
    setWishlist((prev) => {
      let updated: string[];
      if (prev.includes(product.id)) {
        updated = prev.filter((id) => id !== product.id);
        showNotification(`Removed "${product.name}" from your wishlist`);
      } else {
        updated = [...prev, product.id];
        showNotification(`Saved "${product.name}" to your wishlist`);
      }
      try {
        localStorage.setItem("dheera_wishlist", JSON.stringify(updated));
      } catch {
        // Safe fallback
      }
      return updated;
    });
  };

  const addToBag = (product: SampleProduct, size?: string) => {
    setCartCount((prev) => {
      const updated = prev + 1;
      try {
        localStorage.setItem("dheera_cart_count", String(updated));
      } catch {
        // Safe fallback
      }
      return updated;
    });
    const sizeLabel = size ? ` (${size})` : "";
    showNotification(`Added "${product.name}"${sizeLabel} to your shopping bag`);
  };

  return (
    <ShopContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        cartCount,
        addToBag,
        searchOpen,
        setSearchOpen,
        quickViewProduct,
        setQuickViewProduct,
        notification,
        showNotification,
      }}
    >
      {children}

      {/* Luxury Toast Notification */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#176B45] text-[#FAF9F5] px-5 py-3.5 shadow-xl border border-[#AA9160]/40 flex items-center gap-3 animate-fade-in text-xs tracking-luxury uppercase font-medium"
        >
          <span className="text-[#AA9160]">✦</span>
          <span>{notification}</span>
        </aside>
      )}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
