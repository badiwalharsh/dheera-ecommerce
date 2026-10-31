"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { DesktopNav } from "@/components/navigation/desktop-nav";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Container } from "@/components/ui/container";
import { useShop } from "@/context/shop-context";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { wishlistCount, cartCount, setSearchOpen } = useShop();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E2DFD6] transition-all">
      <Container size="default">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 gap-2">
          {/* Mobile hamburger toggle */}
          <div className="flex items-center lg:hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Left Navigation (Desktop Only) */}
          <div className="hidden lg:flex items-center flex-1">
            <DesktopNav />
          </div>

          {/* Centered Brand Logo */}
          <div className="flex-shrink-0 flex items-center justify-center min-w-0">
            <BrandLogo size="md" />
          </div>

          {/* Right Navigation & Tools */}
          <div className="flex items-center justify-end gap-1 sm:gap-3 md:gap-5 flex-shrink-0 lg:flex-1">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors focus:outline-none"
              aria-label="Search Collection"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Account Link */}
            <Link
              href="/account"
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors hidden sm:inline-flex"
              aria-label="Account"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {/* Wishlist Link with Count Badge */}
            <Link
              href="/account"
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 px-1 rounded-full bg-[#176B45] text-white text-[8px] sm:text-[9px] flex items-center justify-center font-bold shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag with Item Count Badge */}
            <Link
              href="/cart"
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors relative"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 px-1 rounded-full bg-[#176B45] text-white text-[8px] sm:text-[9px] flex items-center justify-center font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}
