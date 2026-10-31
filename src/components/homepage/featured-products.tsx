import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/products/product-card";
import { SAMPLE_PRODUCTS } from "@/constants";
import { ArrowRight } from "lucide-react";

export function FeaturedProducts() {
  return (
    <section className="bg-[#EEEAE0]/50 py-12 sm:py-16 md:py-24 border-y border-[#E2DFD6] overflow-x-hidden">
      <Container size="default">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-1">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#176B45] break-words">
              Our Favourites
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] mt-1 sm:mt-2 max-w-xl break-words">
              A thoughtful curation of handcrafted pieces for every occasion.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] font-medium transition-colors group flex-shrink-0"
          >
            <span>View All Pieces</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 6-Product Preview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
          {SAMPLE_PRODUCTS.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 2}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
