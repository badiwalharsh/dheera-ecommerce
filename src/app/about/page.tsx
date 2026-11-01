import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BRAND, BRAND_VALUES } from "@/constants";
import { ArrowRight, Sparkles, Feather, Scissors, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story & Craft | DHEERA — Apparel & Lifestyle",
  description:
    "Rooted in Indian heritage, designed for contemporary life. Learn about the master weavers, authentic handlooms, and artisanal philosophy behind DHEERA.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-[#FAF9F5] text-[#252A25] overflow-x-hidden">
      {/* 1. Hero Editorial Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#EEEAE0] border-b border-[#E2DFD6]">
        <Container size="default">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#176B45] font-semibold bg-white/60 px-3 py-1 rounded-full border border-[#E2DFD6]">
              <Sparkles className="w-3.5 h-3.5 text-[#AA9160]" />
              <span>The DHEERA Journey</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-[#176B45] leading-tight">
              Rooted in Heritage. <br />
              Made for Today.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#74786F] leading-relaxed max-w-2xl mx-auto font-normal">
              DHEERA celebrates the quiet magnificence of Indian textile artistry. We believe luxury lies not in excess, but in the considered balance of traditional handloom roots, expressive craftsmanship, and contemporary modern ease.
            </p>

            <p className="text-[10px] sm:text-[11px] uppercase tracking-luxury text-[#AA9160] font-semibold pt-2">
              {BRAND.tagline} &nbsp;✦&nbsp; {BRAND.philosophy}
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Philosophy & Craftsmanship Section */}
      <section className="py-14 sm:py-20 md:py-24 border-b border-[#E2DFD6]">
        <Container size="default">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Visual Panel */}
            <div className="lg:col-span-6 relative w-full aspect-[4/5] bg-[#EEEAE0] border border-[#E2DFD6] overflow-hidden shadow-md">
              <Image
                src="/images/banners/hero-editorial.jpg"
                alt="DHEERA Master Craftsmanship and Handwoven Weaves"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 p-4 bg-[#FAF9F5]/95 backdrop-blur-sm border border-[#AA9160]/40">
                <span className="text-[9px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-0.5">
                  Artisanal Heritage
                </span>
                <p className="font-serif text-xs sm:text-sm text-[#176B45]">
                  Authentic Chanderi silk, handcrafted mulmul linings, and antique zari threadwork.
                </p>
              </div>
            </div>

            {/* Narrative Editorial */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
                Philosophy & Purpose
              </span>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#176B45] leading-snug">
                Quiet Luxury Crafted by Master Hands
              </h2>

              <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
                In a world of fleeting fast fashion, DHEERA honours the patience of artisanal weaving. Every ensemble begins at the looms of generational craft clusters across India — where delicate hand-spun silks, gossamer Chanderis, and pure cotton mulmul are slowly brought to life by master weavers.
              </p>

              <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed">
                We re-imagine traditional Indian silhouettes with minimal fluid lines, bespoke neckline tailoring, and effortless comfort, creating timeless heirloom garments intended to be cherished across celebrations, seasons, and generations.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E2DFD6]">
                <div className="space-y-1">
                  <h4 className="text-xs font-serif text-[#176B45] font-semibold flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-[#AA9160]" />
                    <span>Pure Organic Weaves</span>
                  </h4>
                  <p className="text-[11px] text-[#74786F]">
                    Breathable natural fibers that feel soothing against the skin in every Indian climate.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-serif text-[#176B45] font-semibold flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#AA9160]" />
                    <span>Artisanal Tailoring</span>
                  </h4>
                  <p className="text-[11px] text-[#74786F]">
                    Hand-finished side slits, French seam construction, and bespoke measurement adaptation.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#176B45] text-[#FAF9F5] text-xs uppercase tracking-luxury hover:bg-[#315039] transition-colors font-medium shadow-sm"
                >
                  <span>Explore the Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. The 4 Pillars of DHEERA */}
      <section className="py-14 sm:py-20 md:py-24 bg-[#EEEAE0]/50 border-b border-[#E2DFD6]">
        <Container size="default">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold">
              The Four Pillars
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#176B45] mt-1 mb-2">
              What Defines Every Stitch
            </h3>
            <p className="text-xs sm:text-sm text-[#74786F]">
              Our enduring commitment to ethical craftsmanship, conscious fashion, and timeless Indian silhouettes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BRAND_VALUES.map((val) => (
              <div
                key={val.id}
                className="bg-[#FAF9F5] p-6 border border-[#E2DFD6] space-y-3 hover:border-[#176B45]/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#EEEAE0] flex items-center justify-center text-[#176B45] font-serif text-sm">
                  {val.symbol}
                </div>
                <h4 className="font-serif text-base sm:text-lg text-[#176B45]">
                  {val.title}
                </h4>
                <p className="text-xs text-[#74786F] leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Production Readiness & Business Verification Notice */}
      <section className="py-12 bg-[#FAF9F5]">
        <Container size="narrow">
          <div className="p-6 sm:p-8 bg-[#EEEAE0] border border-[#AA9160]/40 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[#176B45] text-xs font-semibold uppercase tracking-luxury">
              <HeartHandshake className="w-4 h-4 text-[#AA9160]" />
              <span>Launch & Business Governance Notice</span>
            </div>
            <p className="text-xs text-[#74786F] leading-relaxed max-w-xl mx-auto">
              DHEERA is currently in structured pre-launch testing. Official corporate registration coordinates, permanent studio addresses, and confirmed commercial certifications will be published upon final commercial activation.
            </p>
            <div className="pt-1">
              <Link
                href="/contact"
                className="text-xs text-[#176B45] underline underline-offset-2 hover:text-[#AA9160] font-medium"
              >
                Inquire with Our Atelier Concierge →
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
