import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoreContent } from "@/lib/services/admin";

export function HeroBanner() {
  const content = getStoreContent();

  return (
    <section className="bg-[#EEEAE0] border-b border-[#E2DFD6] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[520px] lg:min-h-[640px]">
        {/* Left Editorial Copy */}
        <div className="lg:col-span-6 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-16 lg:py-24">
          <div className="space-y-1 mb-4 sm:mb-6">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold block">
              INDIAN HERITAGE
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              CONTEMPORARY SOUL
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#176B45] leading-[1.15] sm:leading-[1.12] mb-4 sm:mb-6 font-normal break-words whitespace-pre-line">
            {content.heroHeading || "Timeless Styles,\nYours Truly."}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-[#74786F] leading-relaxed max-w-lg mb-6 sm:mb-8 font-normal break-words">
            {content.heroDescription || "Handcrafted apparel inspired by Indian traditions, designed for the modern you."}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href={content.heroCtaLink || "/collections"}>
              <Button variant="primary" size="lg" className="text-xs px-5 sm:px-6">
                {content.heroCtaText || "EXPLORE COLLECTIONS"} &nbsp;→
              </Button>
            </Link>
            <Link href="/product/custom">
              <Button variant="outline" size="lg" className="text-xs px-5 sm:px-6">
                BESPOKE ATELIER
              </Button>
            </Link>
          </div>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[#E2DFD6] flex flex-wrap items-center gap-4 sm:gap-8 text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-luxury text-[#315039]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[#AA9160]">✦</span>
              <span>Handcrafted in India</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[#AA9160]">✦</span>
              <span>Made for the World</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[#AA9160]">✦</span>
              <span>Custom Tailoring</span>
            </div>
          </div>
        </div>

        {/* Right Editorial Imagery (Clean Portrait without Text or Carousel Artifacts) */}
        <div className="lg:col-span-6 relative min-h-[380px] sm:min-h-[440px] lg:min-h-full bg-[#FAF9F5] overflow-hidden">
          <Image
            src="/images/banners/hero-editorial.jpg"
            alt="DHEERA — Indian Heritage, Contemporary Soul"
            fill
            priority
            className="object-cover object-center transition-transform duration-1000 hover:scale-102"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
