"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SampleProduct } from "@/constants";
import { CatalogProduct } from "@/types/ecommerce";
import { CartItem } from "@/types/cart";

export type ShopProductItem =
  | SampleProduct
  | CatalogProduct
  | {
      id: string;
      slug?: string;
      name: string;
      price: number;
      originalPrice?: number;
      image: string;
      category?: string;
      tag?: string;
      description?: string;
      sizes?: readonly string[] | string[];
      colors?: readonly string[] | string[];
      fabric?: string;
      care?: string;
      sku?: string;
      inStock?: boolean;
    };

interface ShopContextType {
  // Wishlist
  wishlist: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: ShopProductItem) => void;

  // Shopping Bag
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isBagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  toggleBag: () => void;
  addToBag: (
    product: ShopProductItem,
    size?: string,
    colour?: string,
    quantity?: number
  ) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromBag: (itemId: string) => void;
  clearBag: () => void;

  // Modals & Notifications
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  quickViewProduct: SampleProduct | null;
  setQuickViewProduct: (product: SampleProduct | null) => void;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const CART_STORAGE_KEY = "dheera_cart_items";
const WISHLIST_STORAGE_KEY = "dheera_wishlist";

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<SampleProduct | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Initialize from localStorage safely on client mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }

      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      // Safe fallback when storage disabled
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync cart changes to localStorage once hydrated
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      localStorage.setItem(
        "dheera_cart_count",
        String(cart.reduce((sum, item) => sum + item.quantity, 0))
      );
    } catch {
      // Safe fallback
    }
  }, [cart, isHydrated]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const openBag = useCallback(() => setIsBagOpen(true), []);
  const closeBag = useCallback(() => setIsBagOpen(false), []);
  const toggleBag = useCallback(() => setIsBagOpen((prev) => !prev), []);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (product: ShopProductItem) => {
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
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Safe fallback
        }
        return updated;
      });
    },
    [showNotification]
  );

  const addToBag = useCallback(
    (
      product: ShopProductItem,
      size?: string,
      colour?: string,
      quantity: number = 1
    ) => {
      const chosenSize = size || (product.sizes && product.sizes[0]) || "Standard";
      const chosenColour = colour || (product.colors && product.colors[0]) || "Standard";
      const qty = Math.max(1, Math.min(10, Math.floor(quantity)));
      const itemId = `${product.id}_${chosenSize}_${chosenColour}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === itemId);

        if (existingIndex > -1) {
          const updated = [...prev];
          const newQty = Math.min(10, updated[existingIndex].quantity + qty);
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          return updated;
        }

        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          productSlug: product.slug || product.id,
          name: product.name,
          sku: (product as any).sku || `DHR-${product.id}`,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          size: chosenSize,
          colour: chosenColour,
          quantity: qty,
          inStock: product.inStock !== false,
          maxQuantity: 10,
        };

        return [...prev, newItem];
      });

      const sizeLabel = chosenSize ? ` (${chosenSize})` : "";
      showNotification(`Added "${product.name}"${sizeLabel} to your shopping bag`);
      setIsBagOpen(true); // Open drawer on addition
    },
    [showNotification]
  );

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== itemId);
      }
      return prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.min(10, Math.floor(quantity)) }
          : item
      );
    });
  }, []);

  const removeFromBag = useCallback(
    (itemId: string) => {
      setCart((prev) => {
        const itemToRemove = prev.find((item) => item.id === itemId);
        if (itemToRemove) {
          showNotification(`Removed "${itemToRemove.name}" from your shopping bag`);
        }
        return prev.filter((item) => item.id !== itemId);
      });
    },
    [showNotification]
  );

  const clearBag = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        cart,
        cartCount,
        cartSubtotal,
        isBagOpen,
        openBag,
        closeBag,
        toggleBag,
        addToBag,
        updateQuantity,
        removeFromBag,
        clearBag,
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
          className="fixed bottom-6 right-6 z-50 bg-[#176B45] text-[#FAF9F5] px-5 py-3.5 shadow-2xl border border-[#AA9160]/40 flex items-center gap-3 animate-fade-in text-xs tracking-luxury uppercase font-medium max-w-[90vw]"
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
