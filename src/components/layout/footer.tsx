import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { BRAND, CATEGORIES } from "@/constants";
import { Container } from "@/components/ui/container";
import { ArrowUpRight, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#EEEAE0] text-[#252A25] border-t border-[#E2DFD6] pt-12 sm:pt-16 lg:pt-20 pb-10 sm:pb-12 overflow-x-hidden">
      <Container size="default">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 sm:pb-16 border-b border-[#E2DFD6]">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo size="md" />
            <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed max-w-sm pt-2 break-words">
              {BRAND.tagline} Handcrafted designer apparel, bespoke tailored outfits, and festive heirlooms made with intention in India.
            </p>
            <div className="pt-1">
              <a
                href={BRAND.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] font-medium transition-colors"
              >
                <span>Instagram {BRAND.instagram}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold pt-1">
              {BRAND.philosophy}
            </p>
          </div>

          {/* Shop & Collections Column */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <h4 className="text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#74786F]">
              <li>
                <Link href="/collections" className="hover:text-[#176B45] transition-colors">
                  All Collections
                </Link>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={cat.href} className="hover:text-[#176B45] transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="hover:text-[#176B45] transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Atelier & Story Column */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <h4 className="text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Atelier
            </h4>
            <ul className="space-y-2 text-xs text-[#74786F]">
              <li>
                <Link href="/product/custom" className="hover:text-[#176B45] transition-colors">
                  Bespoke Custom Orders
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#176B45] transition-colors">
                  Our Story & Craft
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#176B45] transition-colors">
                  Atelier Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <h4 className="text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold">
              Client Care
            </h4>
            <ul className="space-y-2 text-xs text-[#74786F]">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#176B45] flex-shrink-0" />
                <a href={`mailto:${BRAND.contactEmail}`} className="hover:text-[#176B45] transition-colors">
                  {BRAND.contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-2 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#176B45] flex-shrink-0 mt-0.5" />
                <span>{BRAND.contactHours}</span>
              </li>
              <li className="pt-1 text-[10px] sm:text-[11px] text-[#74786F]/80">
                Complimentary shipping on selected orders. Worldwide delivery options available.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Policies */}
        <div className="pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] sm:text-[11px] text-[#74786F]/80 gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} DHEERA — Apparel & Lifestyle. All rights reserved. {BRAND.philosophy}.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/about" className="hover:text-[#176B45] transition-colors">
              Brand Philosophy
            </Link>
            <span className="text-[#AA9160]">✦</span>
            <Link href="/contact" className="hover:text-[#176B45] transition-colors">
              Care & Returns
            </Link>
            <span className="text-[#AA9160]">✦</span>
            <Link href="/admin" className="hover:text-[#176B45] transition-colors uppercase text-[9px] sm:text-[10px] tracking-wider">
              Staff Portal
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
