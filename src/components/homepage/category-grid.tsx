import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CATEGORIES } from "@/constants";
import { ArrowRight } from "lucide-react";

export function CategoryGrid() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-[#FAF9F5] overflow-x-hidden">
      <Container size="default">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold">
            Curated Wardrobe
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#176B45] mt-1.5 mb-2 sm:mb-3 break-words">
            Explore by Silhouette
          </h2>
          <p className="text-xs sm:text-sm text-[#74786F] leading-relaxed break-words">
            Thoughtfully tailored Indian ensembles designed to move gracefully through every celebration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="group relative bg-[#EEEAE0] border border-[#E2DFD6] flex flex-col overflow-hidden transition-all duration-300 hover:border-[#176B45]/50 hover:shadow-lg w-full"
            >
              <Link
                href={cat.href}
                className="block relative w-full aspect-[3/4] overflow-hidden"
                aria-label={`Shop ${cat.name}`}
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 right-4 sm:right-5 text-white">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-luxury text-[#FAF9F5]/80 block mb-1">
                    {cat.subtitle}
                  </span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-serif text-white group-hover:text-[#FAF9F5] transition-colors mb-1.5 sm:mb-2">
                    {cat.name}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-luxury text-[#FAF9F5] font-medium group-hover:text-[#AA9160] transition-colors">
                    <span>Shop Now</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
