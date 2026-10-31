import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants";
import { getStoreContent } from "@/lib/services/admin";

export function BrandStory() {
  const content = getStoreContent();

  return (
    <section className="py-14 sm:py-20 md:py-28 bg-[#FAF9F5] border-b border-[#E2DFD6] overflow-x-hidden">
      <Container size="default">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Editorial Visual Panel */}
          <div className="lg:col-span-5 relative order-2 lg:order-1 w-full">
            <div className="relative aspect-[4/5] bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden shadow-sm w-full">
              <Image
                src="/images/banners/category-saree.jpg"
                alt="DHEERA Artisan Heritage Handcraft"
                fill
                className="object-cover object-center transition-transform duration-1000 hover:scale-102"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            {/* Subtle decorative offset card */}
            <div className="hidden sm:block absolute -bottom-6 -right-6 bg-[#EEEAE0] border border-[#AA9160]/40 p-5 max-w-xs shadow-md">
              <span className="text-[9px] uppercase tracking-luxury text-[#176B45] font-semibold block mb-1">
                Authentic Craftsmanship
              </span>
              <p className="font-serif italic text-sm text-[#252A25]">
                &ldquo;Preserving generational weaver legacies with a modern sensibility.&rdquo;
              </p>
            </div>
          </div>

          {/* Editorial Narrative */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 order-1 lg:order-2 w-full">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold">
              <span>✦</span>
              <span>Our Story & Vision</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-[#176B45] leading-[1.18] font-normal break-words whitespace-pre-line">
              {content.brandStoryHeading || "Rooted in Heritage.\nMade for Today."}
            </h2>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-[#74786F] leading-relaxed font-normal break-words">
              <p>
                {content.brandStoryBody || "DHEERA was born from an intimate reverence for India's living textile heritage and a conviction that age-old artisanal craft belongs effortlessly in the modern, global wardrobe."}
              </p>
              <p>
                From hand-selected pure Chanderis to intricate zardozi and delicate scalloped borders, every piece is shaped in our Indian ateliers by master craftsmen who have practiced their art across generations.
              </p>
              <p className="font-serif italic text-[#315039] text-sm sm:text-base md:text-lg pt-1">
                &ldquo;We don&apos;t design for transient trends. We create enduring heirlooms that evoke confidence, poise, and quiet luxury.&rdquo;
              </p>
            </div>

            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4 sm:gap-6">
              <Link href="/about">
                <Button variant="primary" size="lg" className="text-xs px-5 sm:px-6">
                  DISCOVER OUR PHILOSOPHY &nbsp;→
                </Button>
              </Link>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#AA9160] font-medium">
                {BRAND.philosophy}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
