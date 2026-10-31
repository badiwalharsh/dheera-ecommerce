"use client";

import React from "react";
import Link from "next/link";
import { NAV_LINKS, BRAND } from "@/constants";
import { ArrowUpRight } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 top-20 bg-dheera-cream z-50 px-6 py-8 border-t border-dheera-line animate-fade-in flex flex-col justify-between overflow-y-auto">
      <nav className="flex flex-col space-y-6">
        <div className="text-[10px] tracking-luxury uppercase text-dheera-muted-gold font-medium mb-1">
          Explore DHEERA
        </div>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="text-2xl font-serif text-dheera-forest-green hover:text-dheera-muted-gold transition-colors flex items-center justify-between"
          >
            <span>{link.label}</span>
            <span className="text-xs text-dheera-secondary-text">→</span>
          </Link>
        ))}
      </nav>

      <div className="pt-8 border-t border-dheera-line mt-8 space-y-3">
        <p className="text-xs text-dheera-secondary-text italic font-serif">
          {BRAND.tagline}
        </p>
        <a
          href={BRAND.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury text-dheera-forest-green hover:text-dheera-muted-gold"
        >
          <span>Instagram {BRAND.instagram}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
