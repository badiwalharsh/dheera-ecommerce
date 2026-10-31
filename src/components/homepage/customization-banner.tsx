import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Scissors, Ruler, Sparkles } from "lucide-react";

export function CustomizationBanner() {
  return (
    <section className="bg-[#176B45] text-[#FAF9F5] py-20 md:py-24 relative overflow-hidden">
      {/* Subtle background glow/texture */}
      <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent pointer-events-none" />

      <Container size="default">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Narrative & Atelier Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold bg-white/10 px-3 py-1 rounded-full w-fit">
              <Sparkles className="w-3 h-3 text-[#AA9160]" />
              <span>The DHEERA Bespoke Atelier</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#FAF9F5] leading-tight font-normal">
              Made Personal, <br />
              Just for You.
            </h2>

            <p className="text-sm sm:text-base text-[#FAF9F5]/80 leading-relaxed max-w-xl font-normal">
              Your vision, our craft. Discover clothing designed around your personal style.
            </p>

            {/* Atelier Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-4">
              <div className="flex items-start gap-3 p-3.5 bg-white/5 border border-white/10">
                <Ruler className="w-5 h-5 text-[#AA9160] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-luxury font-medium text-[#FAF9F5]">
                    Custom Measurements
                  </h4>
                  <p className="text-[11px] text-[#FAF9F5]/70 mt-1">
                    Made to your exact bust, waist, hip, and length preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-white/5 border border-white/10">
                <Scissors className="w-5 h-5 text-[#AA9160] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-luxury font-medium text-[#FAF9F5]">
                    Silhouette Adaptations
                  </h4>
                  <p className="text-[11px] text-[#FAF9F5]/70 mt-1">
                    Personalized sleeve cuts, neckline depth, and dupatta borders.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Link href="/product/custom">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-[#FAF9F5] text-[#FAF9F5] hover:bg-[#FAF9F5] hover:text-[#176B45]"
                >
                  EXPLORE CUSTOMISATION &nbsp;→
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Showcase Panel */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] bg-black/20 border border-white/20 overflow-hidden shadow-2xl">
              <Image
                src="/images/banners/category-kurta.jpg"
                alt="DHEERA Custom Atelier Craft"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#FAF9F5]/90 backdrop-blur-sm text-[#252A25] border border-[#AA9160]/40">
                <span className="text-[9px] uppercase tracking-luxury text-[#176B45] font-semibold block mb-0.5">
                  Atelier Consultation
                </span>
                <p className="font-serif text-sm">
                  Connect with our master artisans to tailor your signature silhouette.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

