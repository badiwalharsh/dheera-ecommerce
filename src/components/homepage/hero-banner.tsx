import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroBanner() {
  return (
    <section className="bg-[#EEEAE0] border-b border-[#E2DFD6] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[660px]">
        {/* Left Editorial Copy */}
        <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <div className="space-y-1 mb-6">
            <span className="text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold block">
              INDIAN HERITAGE
            </span>
            <span className="text-[11px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              CONTEMPORARY SOUL
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#176B45] leading-[1.12] mb-6 font-normal">
            Timeless Styles, <br className="hidden sm:block" />
            Yours Truly.
          </h1>

          <p className="text-sm sm:text-base text-[#74786F] leading-relaxed max-w-lg mb-8 font-normal">
            Handcrafted apparel inspired by Indian traditions, designed for the modern you.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/collections">
              <Button variant="primary" size="lg">
                EXPLORE COLLECTIONS &nbsp;→
              </Button>
            </Link>
            <Link href="/product/custom">
              <Button variant="outline" size="lg">
                BESPOKE ATELIER
              </Button>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-[#E2DFD6] flex flex-wrap items-center gap-6 sm:gap-8 text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#315039]">
            <div className="flex items-center gap-2">
              <span className="text-[#AA9160]">✦</span>
              <span>Handcrafted in India</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#AA9160]">✦</span>
              <span>Made for the World</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#AA9160]">✦</span>
              <span>Custom Tailoring</span>
            </div>
          </div>
        </div>

        {/* Right Editorial Imagery */}
        <div className="lg:col-span-6 relative min-h-[440px] lg:min-h-full bg-[#FAF9F5] overflow-hidden">
          <Image
            src="/images/banners/hero-editorial.jpg"
            alt="DHEERA — Indian Heritage, Contemporary Soul"
            fill
            priority
            className="object-cover object-center transition-transform duration-1000 hover:scale-102"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
          <div className="absolute bottom-6 right-6 text-right hidden sm:block">
            <span className="text-[10px] tracking-luxury uppercase text-white/90 drop-shadow-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 border border-white/20">
              Dressed in Heritage
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
