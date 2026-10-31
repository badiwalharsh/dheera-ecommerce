"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BRAND, NAV_LINKS_LEFT } from "@/constants";
import { useShop } from "@/context/shop-context";
import { ChevronDown, ArrowUpRight, Heart, ShoppingBag, User } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);
  const { wishlistCount, cartCount } = useShop();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 top-20 bg-[#FAF9F5] z-50 px-6 py-8 border-t border-[#E2DFD6] flex flex-col justify-between overflow-y-auto animate-fade-in">
      <nav className="flex flex-col space-y-4">
        <div className="text-[10px] tracking-luxury uppercase text-[#AA9160] font-semibold mb-1">
          Explore DHEERA
        </div>

        {NAV_LINKS_LEFT.map((link) => {
          if ("dropdown" in link && link.dropdown) {
            return (
              <div key={link.label} className="border-b border-[#E2DFD6]/60 pb-3">
                <button
                  type="button"
                  onClick={() => setCollectionsExpanded(!collectionsExpanded)}
                  className="w-full flex items-center justify-between text-xl font-serif text-[#176B45] py-1 text-left"
                >
                  <span>{link.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#AA9160] transition-transform duration-200 ${
                      collectionsExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {collectionsExpanded && (
                  <div className="pl-4 pt-3 space-y-2.5 border-l-2 border-[#176B45]/20 mt-2">
                    {link.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onClose}
                        className="block text-sm text-[#74786F] hover:text-[#176B45] py-1 transition-colors uppercase tracking-wider"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="text-xl font-serif text-[#176B45] hover:text-[#AA9160] transition-colors flex items-center justify-between border-b border-[#E2DFD6]/60 pb-3"
            >
              <span>{link.label}</span>
              <span className="text-xs text-[#74786F]">→</span>
            </Link>
          );
        })}

        {/* Account, Wishlist, Cart quick row in mobile drawer */}
        <div className="pt-4 grid grid-cols-3 gap-2 text-center">
          <Link
            href="/account"
            onClick={onClose}
            className="p-3 bg-[#EEEAE0]/70 border border-[#E2DFD6] flex flex-col items-center gap-1 text-[10px] uppercase tracking-luxury text-[#252A25]"
          >
            <User className="w-4 h-4 text-[#176B45]" />
            <span>Account</span>
          </Link>

          <Link
            href="/account/wishlist"
            onClick={onClose}
            className="p-3 bg-[#EEEAE0]/70 border border-[#E2DFD6] flex flex-col items-center gap-1 text-[10px] uppercase tracking-luxury text-[#252A25] relative"
          >
            <Heart className="w-4 h-4 text-[#176B45]" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#176B45] text-white text-[9px] flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            onClick={onClose}
            className="p-3 bg-[#EEEAE0]/70 border border-[#E2DFD6] flex flex-col items-center gap-1 text-[10px] uppercase tracking-luxury text-[#252A25] relative"
          >
            <ShoppingBag className="w-4 h-4 text-[#176B45]" />
            <span>Bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#176B45] text-white text-[9px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Footer Branding Info */}
      <div className="pt-8 border-t border-[#E2DFD6] mt-8 space-y-3">
        <p className="text-xs text-[#74786F] italic font-serif">
          &ldquo;{BRAND.tagline}&rdquo;
        </p>
        <p className="text-[10px] uppercase tracking-luxury text-[#AA9160]">
          {BRAND.philosophy}
        </p>
        <a
          href={BRAND.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] font-medium pt-1"
        >
          <span>Instagram {BRAND.instagram}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
