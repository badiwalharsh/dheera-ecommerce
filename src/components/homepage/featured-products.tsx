import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/products/product-card";
import { SAMPLE_PRODUCTS } from "@/constants";
import { ArrowRight } from "lucide-react";

export function FeaturedProducts() {
  return (
    <section className="bg-[#EEEAE0]/50 py-16 md:py-24 border-y border-[#E2DFD6]">
      <Container size="default">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block mb-1">
              Curated Selection
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#176B45]">
              Our Favourites
            </h2>
            <p className="text-xs sm:text-sm text-[#74786F] mt-2 max-w-xl">
              A thoughtful curation of handcrafted pieces for every occasion.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxury text-[#176B45] hover:text-[#AA9160] font-medium transition-colors group"
          >
            <span>View All Pieces</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 6-Product Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
