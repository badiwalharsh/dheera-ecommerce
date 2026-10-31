import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants";

export function HeroBanner() {
  return (
    <section className="bg-dheera-warm-ivory border-b border-dheera-line/60">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[640px]">
        {/* Left Editorial Copy */}
        <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-luxury text-dheera-dark-green font-medium mb-4">
            <span>✦</span>
            <span>{BRAND.tagline}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-dheera-forest-green leading-[1.12] mb-6 font-normal">
            Timeless Styles, <br className="hidden sm:block" />
            Yours Truly.
          </h1>

          <p className="text-sm sm:text-base text-dheera-secondary-text leading-relaxed max-w-lg mb-8 font-normal">
            Handcrafted apparel inspired by Indian traditions, designed for the modern you. Made with intention, quiet luxury, and bespoke tailoring.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/shop">
              <Button variant="primary" size="lg">
                Explore Collections &nbsp;→
              </Button>
            </Link>
            <Link href="/product/custom">
              <Button variant="outline" size="lg">
                Bespoke Atelier
              </Button>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-dheera-line flex items-center gap-8 text-[11px] uppercase tracking-luxury text-dheera-dark-green">
            <div className="flex items-center gap-2">
              <span className="text-dheera-muted-gold">✦</span>
              <span>Handcrafted in India</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dheera-muted-gold">✦</span>
              <span>Quiet Luxury</span>
            </div>
          </div>
        </div>

        {/* Right Editorial Imagery */}
        <div className="lg:col-span-6 relative min-h-[420px] lg:min-h-full bg-dheera-cream overflow-hidden">
          <Image
            src="/images/banners/hero-editorial.jpg"
            alt="DHEERA Indian Heritage Editorial Fashion"
            fill
            priority
            className="object-cover object-center transition-transform duration-1000 hover:scale-102"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
          <div className="absolute bottom-6 right-6 text-right">
            <span className="text-[10px] tracking-luxury uppercase text-white/90 drop-shadow-sm">
              Dressed in Heritage
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
