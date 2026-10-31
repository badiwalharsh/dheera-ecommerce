"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { DesktopNav } from "@/components/navigation/desktop-nav";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Container } from "@/components/ui/container";
import { Search, ShoppingBag, Heart, Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-dheera-line/60 transition-all">
      <Container size="default">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Mobile hamburger toggle */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-dheera-forest-green hover:text-dheera-muted-gold transition-colors focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Left Nav Links */}
          <DesktopNav position="left" />

          {/* Centered Brand Logo */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Right Nav Links */}
          <DesktopNav position="right" />

          {/* Right Tools (Search, Wishlist, Bag) */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              type="button"
              className="p-2 text-dheera-forest-green hover:text-dheera-muted-gold transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <Link
              href="/account"
              className="p-2 text-dheera-forest-green hover:text-dheera-muted-gold transition-colors hidden sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 md:w-5 md:h-5" />
            </Link>

            <Link
              href="/cart"
              className="p-2 text-dheera-forest-green hover:text-dheera-muted-gold transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}

