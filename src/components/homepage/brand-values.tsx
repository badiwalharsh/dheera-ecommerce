import React from "react";
import { Container } from "@/components/ui/container";
import { BRAND_VALUES } from "@/constants";

export function BrandValues() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#FAF9F5] border-b border-[#E2DFD6] overflow-x-hidden">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold">
            The DHEERA Promise
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-[#176B45] mt-1 mb-2 break-words">
            Pillars of Our Craft
          </h2>
          <p className="text-xs text-[#74786F] break-words">
            Every garment embodies conscious luxury, artisanal integrity, and enduring beauty.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {BRAND_VALUES.map((val) => (
            <div
              key={val.id}
              className="p-4 sm:p-6 bg-[#EEEAE0]/50 border border-[#E2DFD6] flex flex-col justify-between hover:border-[#176B45]/40 transition-colors w-full"
            >
              <div>
                <span className="text-[#AA9160] text-base sm:text-lg font-serif block mb-2 sm:mb-3">
                  {val.symbol}
                </span>
                <h3 className="text-sm sm:text-base font-serif text-[#176B45] mb-1.5 sm:mb-2 font-medium break-words">
                  {val.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#74786F] leading-relaxed break-words">
                  {val.description}
                </p>
              </div>

              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[#E2DFD6]/60">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-luxury text-[#AA9160] font-semibold">
                  DHEERA Standard
                </span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
