"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { DesktopNav } from "@/components/navigation/desktop-nav";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Container } from "@/components/ui/container";
import { useShop } from "@/context/shop-context";
import { useAuth } from "@/context/auth-context";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { wishlistCount, cartCount, setSearchOpen, openBag } = useShop();
  const { user, isAuthenticated } = useAuth();

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
              href={isAuthenticated ? "/account" : "/account/login"}
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors hidden sm:inline-flex items-center gap-1.5"
              aria-label={isAuthenticated ? "Patron Account" : "Sign In"}
              title={isAuthenticated ? `Namaste, ${user?.fullName}` : "Sign In"}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              {isAuthenticated && user && (
                <span className="text-[11px] font-serif font-medium hidden md:inline text-[#176B45]">
                  {user.fullName.split(" ")[0]}
                </span>
              )}
            </Link>

            {/* Wishlist Link with Count Badge */}
            <Link
              href="/account/wishlist"
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

            {/* Shopping Bag Trigger with Live Item Count Badge */}
            <button
              type="button"
              onClick={openBag}
              className="p-1.5 sm:p-2 text-[#176B45] hover:text-[#AA9160] transition-colors relative focus:outline-none"
              aria-label="Open Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 px-1 rounded-full bg-[#176B45] text-white text-[8px] sm:text-[9px] flex items-center justify-center font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}
