import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { BRAND, NAV_LINKS } from "@/constants";
import { Container } from "@/components/ui/container";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#E9E6DD] text-dheera-primary-text border-t border-dheera-line/80 pt-16 pb-12 mt-20">
      <Container size="default">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-16 border-b border-dheera-line">
          {/* Brand Intro Column */}
          <div className="lg:col-span-5 space-y-4">
            <BrandLogo size="md" />
            <p className="text-sm text-dheera-secondary-text leading-relaxed max-w-sm pt-2">
              {BRAND.tagline} Handcrafted designer apparel, bespoke tailored outfits, and festive heirlooms made with intention in India.
            </p>
            <div className="pt-2">
              <a
                href={BRAND.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury text-dheera-forest-green hover:text-dheera-muted-gold font-medium transition-colors"
              >
                <span>Instagram {BRAND.instagram}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[11px] uppercase tracking-luxury text-dheera-forest-green font-medium">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-dheera-secondary-text">
              {NAV_LINKS.slice(2, 6).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-dheera-forest-green transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Atelier */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[11px] uppercase tracking-luxury text-dheera-forest-green font-medium">
              Atelier
            </h4>
            <ul className="space-y-2.5 text-xs text-dheera-secondary-text">
              <li>
                <Link href="/product/custom" className="hover:text-dheera-forest-green transition-colors">
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-dheera-forest-green transition-colors">
                  Brand Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-dheera-forest-green transition-colors">
                  Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Assistance */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-[11px] uppercase tracking-luxury text-dheera-forest-green font-medium">
              Client Care
            </h4>
            <ul className="space-y-2.5 text-xs text-dheera-secondary-text">
              <li>
                <a href={`mailto:${BRAND.contactEmail}`} className="hover:text-dheera-forest-green transition-colors">
                  {BRAND.contactEmail}
                </a>
              </li>
              <li className="text-[11px] text-dheera-secondary-text/80 pt-1">
                Mon – Sat, 10am – 7pm IST
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Subfooter */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-dheera-secondary-text/80 gap-4">
          <p>© {new Date().getFullYear()} DHEERA — Apparel & Lifestyle. {BRAND.philosophy}.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-dheera-forest-green">
              Philosophy
            </Link>
            <Link href="/admin" className="hover:text-dheera-forest-green uppercase text-[10px] tracking-wider">
              Admin
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

