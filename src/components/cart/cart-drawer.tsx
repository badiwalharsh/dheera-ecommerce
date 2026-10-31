"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/context/shop-context";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { SHIPPING_CONFIG } from "@/lib/services/shipping";

export function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    isBagOpen,
    closeBag,
    updateQuantity,
    removeFromBag,
  } = useShop();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isBagOpen) {
        closeBag();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBagOpen, closeBag]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isBagOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isBagOpen]);

  if (!isBagOpen) return null;

  const freeShippingThreshold = SHIPPING_CONFIG.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      {/* Backdrop */}
      <div
        onClick={closeBag}
        className="fixed inset-0 bg-[#252A25]/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-[#FAF9F5] shadow-2xl flex flex-col transform transition-transform ease-out duration-300 border-l border-[#E2DFD6]"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#E2DFD6] flex items-center justify-between bg-[#FAF9F5]">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#176B45]" />
              <h2 className="font-serif text-xl text-[#176B45] tracking-wide">
                Your Shopping Bag
              </h2>
              <span className="text-xs tracking-luxury text-[#74786F] font-medium">
                ({cartCount} {cartCount === 1 ? "Item" : "Items"})
              </span>
            </div>

            <button
              type="button"
              onClick={closeBag}
              className="p-2 text-[#74786F] hover:text-[#176B45] transition-colors rounded-full focus:outline-none focus:ring-1 focus:ring-[#176B45]"
              aria-label="Close Shopping Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Tier Banner */}
          <div className="bg-[#EEEAE0]/70 px-6 py-3 border-b border-[#E2DFD6]">
            {remainingForFreeShipping === 0 ? (
              <p className="text-xs text-[#176B45] font-medium tracking-wide flex items-center gap-1.5">
                <span className="text-[#AA9160]">✦</span> Complimentary shipping unlocked on this order!
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-[#252A25] tracking-wide">
                  Add <strong className="text-[#176B45]">₹{remainingForFreeShipping.toLocaleString("en-IN")}</strong> more for complimentary shipping
                </p>
                <div className="w-full bg-[#E2DFD6] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#176B45] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#E2DFD6]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#EEEAE0] flex items-center justify-center text-[#AA9160]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-[#176B45]">Your bag is empty</h3>
                  <p className="text-xs text-[#74786F] max-w-xs">
                    Explore our handcrafted edits of kurta sets, Chanderi sarees, and bespoke festive ensembles.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeBag}
                  className="inline-block mt-2 px-6 py-2.5 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors shadow-sm font-medium"
                >
                  Discover Artisanal Edits
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="relative w-20 aspect-[3/4] flex-shrink-0 bg-[#EEEAE0] overflow-hidden border border-[#E2DFD6]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.productSlug}`}
                          onClick={closeBag}
                          className="font-serif text-sm text-[#176B45] hover:text-[#AA9160] transition-colors line-clamp-1 font-medium"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromBag(item.id)}
                          className="text-[#74786F] hover:text-red-700 transition-colors p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant Badges */}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#74786F]">
                        <span>Size: <strong className="text-[#252A25]">{item.size}</strong></span>
                        {item.colour && item.colour !== "Standard" && (
                          <>
                            <span>•</span>
                            <span>Colour: <strong className="text-[#252A25]">{item.colour}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div className="flex items-center border border-[#E2DFD6] bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 sm:p-1.5 text-[#252A25] hover:bg-[#EEEAE0] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium text-[#252A25]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="p-1 sm:p-1.5 text-[#252A25] hover:bg-[#EEEAE0] transition-colors disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-sm font-semibold text-[#176B45]">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-[#74786F]">
                            ₹{item.price.toLocaleString("en-IN")} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#E2DFD6] bg-[#FAF9F5] space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#74786F]">Subtotal</span>
                  <span className="font-serif text-base font-semibold text-[#176B45]">
                    ₹{cartSubtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[11px] text-[#74786F]">
                  Shipping and promotion codes are calculated at checkout.
                </p>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/checkout"
                  onClick={closeBag}
                  className="w-full py-3.5 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors flex items-center justify-center gap-2 shadow-sm font-medium"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-between text-xs pt-1">
                  <Link
                    href="/cart"
                    onClick={closeBag}
                    className="text-[#176B45] hover:text-[#AA9160] transition-colors underline underline-offset-4 tracking-luxury uppercase text-[10px] font-medium"
                  >
                    View Detailed Bag
                  </Link>

                  <button
                    type="button"
                    onClick={closeBag}
                    className="text-[#74786F] hover:text-[#252A25] transition-colors tracking-luxury uppercase text-[10px]"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

